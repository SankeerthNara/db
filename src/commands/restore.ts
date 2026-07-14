import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { getClient, getProjectId, resolveBranch } from "../lib/client.js";
import { renderBranchDetail } from "../lib/format.js";
import { addLogEntry } from "../lib/config.js";

export function registerRestoreCmd(program: Command) {
  program
    .command("restore")
    .description("Create a restore point by branching from an existing branch")
    .argument("<branch>", "Branch name or ID to create a restore point from")
    .argument("[name]", "Name for the restore branch (default: <branch>-restore-<timestamp>)")
    .option("-p, --project <id>", "Project ID")
    .option("--from <branch>", "Parent branch (default: main)")
    .action(async (identifier, name, options) => {
      const spinner = ora("Creating restore point…").start();
      try {
        const client = getClient();
        const projectId = await getProjectId(options.project);

        const branch = await resolveBranch(client, projectId, identifier);
        const ts = Date.now().toString(36);
        const newName = name || `${branch.name}-restore-${ts}`;

        let parentId: string | undefined;
        if (options.from) {
          const parent = await resolveBranch(client, projectId, options.from);
          parentId = parent.id;
        }

        const res = await client.createBranch(projectId, newName, parentId);
        spinner.stop();

        const b = res.branch;
        if (b) {
          console.log(chalk.green(`\n  ✓ Restore point "${newName}" created from "${branch.name}"\n`));
          console.log(renderBranchDetail(b));
          if (branch.parent_lsn) {
            console.log(`  ${chalk.dim("Parent LSN:")} ${branch.parent_lsn}`);
          }
          console.log();

          addLogEntry({
            timestamp: new Date().toISOString(),
            action: "restore",
            branch: newName,
            detail: `from ${branch.name}`,
          });
        }
      } catch (err) {
        spinner.fail("Restore failed");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
