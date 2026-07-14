import { Command } from "commander";
import chalk from "chalk";
import { execSync } from "child_process";
import ora from "ora";
import { getClient, getProjectId, resolveBranch } from "../lib/client.js";
import { addLogEntry, isBranchProtected } from "../lib/config.js";

export function registerGitCmd(program: Command) {
  const git = program
    .command("git")
    .description("Sync Git branches with Neon database branches");

  // -- git sync ---------------------------------------------------------------
  git
    .command("sync")
    .description("Sync local Git branches → Neon branches (create missing, flag orphans)")
    .option("-p, --project <id>", "Project ID")
    .option("--prefix <prefix>", "Prefix for Neon branch names (default: git-)", "git-")
    .option("--dry-run", "Show what would be done without making changes")
    .option("--prune", "Delete Neon branches that have no matching Git branch")
    .action(async (options) => {
      const spinner = ora("Reading Git branches…").start();
      try {
        const gitBranches = execSync("git branch --format='%(refname:short)'", { encoding: "utf-8" })
          .trim()
          .split("\n")
          .filter(Boolean);

        if (gitBranches.length === 0) {
          spinner.stop();
          console.log(chalk.yellow("No Git branches found."));
          return;
        }

        const client = getClient();
        const projectId = await getProjectId(options.project);

        spinner.text = "Fetching Neon branches…";
        const res = await client.listBranches(projectId);
        const neonBranches = res.branches ?? [];
        const neonNames = new Set(neonBranches.map((b) => b.name));

        spinner.stop();

        const prefix = options.prefix as string;
        let created = 0;
        let orphaned: string[] = [];

        console.log(chalk.bold("\n  Git → Neon Branch Sync\n"));

        for (const gb of gitBranches) {
          const neonName = `${prefix}${gb}`;
          if (neonNames.has(neonName)) {
            console.log(`  ${chalk.green("✓")} ${chalk.dim(gb)} → ${chalk.cyan(neonName)} ${chalk.dim("(exists)")}`);
          } else {
            console.log(`  ${chalk.yellow("+")} ${chalk.dim(gb)} → ${chalk.cyan(neonName)} ${chalk.dim("(creating)")}`);
            if (!options.dryRun) {
              try {
                await client.createBranch(projectId, neonName);
                addLogEntry({ timestamp: new Date().toISOString(), action: "git-sync", branch: neonName, detail: `from Git branch ${gb}` });
                created++;
              } catch (e) {
                console.log(`    ${chalk.red("✗ failed:")} ${(e as Error).message}`);
              }
            } else {
              created++;
            }
          }
        }

        if (options.prune) {
          orphaned = neonBranches
            .filter((b) => b.name.startsWith(prefix))
            .map((b) => b.name.replace(prefix, ""))
            .filter((gb) => !gitBranches.includes(gb))
            .map((gb) => `${prefix}${gb}`);

          if (orphaned.length > 0) {
            console.log(chalk.bold(`\n  Orphaned Neon branches (no matching Git branch):\n`));
            for (const name of orphaned) {
              console.log(`  ${chalk.red("-")} ${chalk.cyan(name)}`);
              if (!options.dryRun) {
                try {
                  const branch = neonBranches.find((b) => b.name === name);
                  if (branch && !isBranchProtected(branch.name)) {
                    await client.deleteBranch(projectId, branch.id);
                    addLogEntry({ timestamp: new Date().toISOString(), action: "git-prune", branch: name });
                  }
                } catch {
                  console.log(`    ${chalk.red("✗ failed to delete")}`);
                }
              }
            }
          }
        }

        const summary = options.dryRun
          ? chalk.yellow(`\n  (dry run) Would create ${created} branch(es)${options.prune ? `, would prune ${orphaned.length}` : ""}\n`)
          : chalk.green(`\n  ✓ Created ${created} branch(es)${options.prune ? `, pruned ${orphaned.length}` : ""}\n`);
        console.log(summary);
      } catch (err) {
        spinner.fail("Git sync failed");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });

  // -- git status -------------------------------------------------------------
  git
    .command("status")
    .description("Show Git branch vs Neon branch mapping")
    .option("-p, --project <id>", "Project ID")
    .option("--prefix <prefix>", "Prefix for Neon branch names (default: git-)", "git-")
    .action(async (options) => {
      const spinner = ora("Reading Git and Neon branches…").start();
      try {
        const gitBranches = execSync("git branch --format='%(refname:short)'", { encoding: "utf-8" })
          .trim()
          .split("\n")
          .filter(Boolean);

        const client = getClient();
        const projectId = await getProjectId(options.project);
        const res = await client.listBranches(projectId);
        const neonBranches = res.branches ?? [];
        const prefix = options.prefix as string;

        spinner.stop();

        console.log(chalk.bold("\n  Git Branch → Neon Branch Mapping\n"));
        for (const gb of gitBranches) {
          const neonName = `${prefix}${gb}`;
          const match = neonBranches.find((b) => b.name === neonName);
          if (match) {
            console.log(`  ${chalk.green("✓")} ${chalk.dim(gb)} → ${chalk.cyan(neonName)} ${chalk.dim(match.id.substring(0, 8))}`);
          } else {
            console.log(`  ${chalk.red("✗")} ${chalk.dim(gb)} → ${chalk.dim("(no Neon branch)")}`);
          }
        }

        const orphans = neonBranches
          .filter((b) => b.name.startsWith(prefix))
          .filter((b) => !gitBranches.includes(b.name.replace(prefix, "")));

        if (orphans.length > 0) {
          console.log(chalk.bold(`\n  Orphaned Neon branches (no Git match):\n`));
          for (const o of orphans) {
            console.log(`  ${chalk.yellow("!")} ${chalk.cyan(o.name)} ${chalk.dim(o.id.substring(0, 8))}`);
          }
        }

        console.log();
      } catch (err) {
        spinner.fail("Failed to get mapping");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
