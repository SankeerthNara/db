import { Command } from "commander";
import chalk from "chalk";
import { getClient, getProjectId } from "../lib/client.js";
import { renderBranchTable } from "../lib/format.js";

export function registerWatchCmd(program: Command) {
  program
    .command("watch")
    .description("Watch branches in real-time (poll every N seconds)")
    .option("-p, --project <id>", "Project ID")
    .option("-i, --interval <seconds>", "Poll interval in seconds", "5")
    .option("-n, --number <n>", "Number of times to refresh (default: infinite)", "0")
    .action(async (options) => {
      const interval = parseInt(options.interval, 10) * 1000;
      const maxRuns = parseInt(options.number, 10);
      let runs = 0;

      console.log(chalk.bold(`\n  Watching branches (refreshing every ${options.interval}s)`));
      console.log(chalk.dim("  Press Ctrl+C to stop\n"));

      const poll = async () => {
        try {
          const client = getClient();
          const projectId = await getProjectId(options.project);
          const res = await client.listBranches(projectId);
          const branches = res.branches ?? [];

          // Clear previous output (move cursor up)
          if (runs > 0) {
            const lines = branches.length + 6; // approx
            process.stdout.write(`\x1b[${lines}A`);
          }

          console.log(chalk.dim(new Date().toLocaleTimeString()));
          if (branches.length === 0) {
            console.log(chalk.dim("No branches found."));
          } else {
            console.log(renderBranchTable(branches));
          }
          console.log(chalk.dim(`  ${branches.length} branch(es)`));

          runs++;
          if (maxRuns > 0 && runs >= maxRuns) {
            console.log(chalk.dim("\nDone.\n"));
            return;
          }
          setTimeout(poll, interval);
        } catch (err) {
          console.error(chalk.red(`  ${(err as Error).message}`));
          process.exit(1);
        }
      };

      await poll();
    });
}
