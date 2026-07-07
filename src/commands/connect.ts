import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { NeonClient } from "../lib/neon-api.js";
import { resolveApiKey, resolveProjectId } from "../lib/config.js";

function getClient(): NeonClient {
  const key = resolveApiKey();
  if (!key) {
    console.error(chalk.red("No API key configured. Run: db auth login"));
    process.exit(1);
  }
  return new NeonClient(key);
}

async function getProjectId(provided?: string): Promise<string> {
  if (provided) return provided;
  const id = resolveProjectId();
  if (!id) {
    console.error(
      chalk.red("No project ID set. Run: db auth set-project <id> or pass --project")
    );
    process.exit(1);
  }
  return id;
}

export function registerConnectCmd(program: Command) {
  const connect = program
    .command("connect")
    .alias("conn")
    .description("Get a connection string for a branch");

  connect
    .argument("[branch-name]", "Branch name or ID (default: main)")
    .option("-p, --project <id>", "Project ID")
    .option("--pooled", "Use pooled connection URL")
    .action(async (branchName, options) => {
      const spinner = ora("Resolving connection string…").start();
      try {
        const client = getClient();
        const projectId = await getProjectId(options.project);

        // List branches to resolve name → ID
        const branchesRes = await client.listBranches(projectId);
        const targetBranch = branchName
          ? branchesRes.branches?.find(
              (b) => b.name === branchName || b.id.startsWith(branchName)
            )
          : branchesRes.branches?.find((b) => b.name === "main");

        if (!targetBranch) {
          spinner.fail(
            branchName
              ? `Branch "${branchName}" not found`
              : 'No "main" branch found'
          );
          process.exit(1);
        }

        const connStr = await client.getConnectionString(
          projectId,
          targetBranch.id,
          !!options.pooled
        );

        spinner.stop();

        console.log(chalk.green(`\n  ✓ ${targetBranch.name}\n`));
        console.log(`  ${connStr}\n`);

        // Also print copy hint
        console.log(chalk.dim("  Copy with:"));
        console.log(
          chalk.dim(
            `  echo "${connStr}" | pbcopy  # or use your clipboard tool\n`
          )
        );
      } catch (err) {
        spinner.fail("Failed to get connection string");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
