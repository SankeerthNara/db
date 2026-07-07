#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCmd } from "./commands/auth.js";
import { registerBranchCmd } from "./commands/branch.js";
import { registerConnectCmd } from "./commands/connect.js";
import { registerCiCmd } from "./commands/ci.js";

// Load .env if available
try {
  const { config } = await import("dotenv");
  config();
} catch {
  // dotenv not installed or no .env — that's fine
}

const program = new Command();

program
  .name("db")
  .description("Database branch CLI — Git-like branching for Neon Postgres")
  .version("0.1.0")
  .helpOption("-h, --help", "Show help")
  .addHelpText(
    "after",
    `
Examples:
  db auth login                          Set up your Neon API key
  db branch list                         List all branches
  db branch create feat/awesome          Create a branch
  db branch diff feat/awesome main       Show schema diff
  db connect                             Get connection string for main
  db ci preview 42                       Create ephemeral branch for PR #42
  db ci cleanup --days 7                 Clean stale preview branches

📖 Docs: https://github.com/IN3PIRE/db
  `
  );

registerAuthCmd(program);
registerBranchCmd(program);
registerConnectCmd(program);
registerCiCmd(program);

// Allow `db <cmd>` without subcommand prefix for common ops
program
  .command("list", { hidden: true })
  .description("Alias for: db branch list")
  .argument("[project-id]", "Project ID")
  .action(async (projectId) => {
    // Delegate to branch list
    const listCmd = program.commands
      .find((c) => c.name() === "branch")
      ?.commands.find((c) => c.name() === "list");
    if (listCmd) {
      await listCmd.parseAsync(
        ["node", "db", ...(projectId ? ["--project", projectId] : [])],
        { from: "user" }
      );
    }
  });

program.parse(process.argv);
