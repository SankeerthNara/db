import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import pg from "pg";
import { getClient, getProjectId, resolveBranch } from "../lib/client.js";
import { addLogEntry } from "../lib/config.js";

export function registerSeedCmd(program: Command) {
  program
    .command("seed")
    .description("Seed a branch with data from a SQL file")
    .argument("<branch>", "Branch name or ID to seed")
    .argument("<file>", "Path to SQL file")
    .option("-p, --project <id>", "Project ID")
    .option("--drop-first", "DROP existing tables before seeding")
    .action(async (branchName, filePath, options) => {
      const spinner = ora("Seeding branch…").start();
      try {
        const sql = fs.readFileSync(filePath, "utf-8");
        if (!sql.trim()) {
          spinner.fail("SQL file is empty");
          process.exit(1);
        }

        const client = getClient();
        const projectId = await getProjectId(options.project);
        const branch = await resolveBranch(client, projectId, branchName);
        const connStr = await client.getConnectionString(projectId, branch.id);

        const pgClient = new pg.Client(connStr);
        await pgClient.connect();

        if (options.dropFirst) {
          spinner.text = "Dropping existing tables…";
          const tables = await pgClient.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
          );
          for (const t of tables.rows) {
            await pgClient.query(`DROP TABLE IF EXISTS "public"."${t.table_name}" CASCADE`);
          }
        }

        spinner.text = "Executing SQL…";
        await pgClient.query(sql);
        await pgClient.end();
        spinner.stop();

        const lines = sql.split("\n").length;
        const size = (sql.length / 1024).toFixed(1);
        console.log(chalk.green(`\n  ✓ Branch "${branch.name}" seeded successfully.`));
        console.log(chalk.dim(`    ${lines} lines, ${size} KB\n`));

        addLogEntry({
          timestamp: new Date().toISOString(),
          action: "seed",
          branch: branch.name,
          detail: filePath,
        });
      } catch (err) {
        spinner.fail("Failed to seed branch");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
