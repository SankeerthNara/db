#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCmd } from "./commands/auth.js";
import { registerBranchCmd } from "./commands/branch.js";
import { registerConnectCmd } from "./commands/connect.js";
import { registerCiCmd } from "./commands/ci.js";
import { registerConfigCmd } from "./commands/config.js";
import { registerProjectCmd } from "./commands/project.js";
import { registerRestoreCmd } from "./commands/restore.js";
import { registerResetCmd } from "./commands/reset.js";
import { registerExportCmd } from "./commands/export.js";
import { registerQueryCmd } from "./commands/query.js";
import { registerLogCmd } from "./commands/log.js";
import { registerWatchCmd } from "./commands/watch.js";
import { registerCompletionCmd } from "./commands/completion.js";

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
   db branch protect main                 Protect a branch from deletion
   db branch diff feat/awesome main       Show schema diff
   db branch merge feat/awesome main      Merge schema changes
   db connect                             Get connection string for main
   db ci preview 42                       Create ephemeral branch for PR #42
   db ci cleanup --days 7                 Clean stale preview branches
   db project list                        List all Neon projects
   db config list                         Show local configuration
   db restore                             Restore a branch from parent LSN
   db reset feat/awesome --to main        Reset branch to match main
   db export main -o schema.sql           Export schema to file
   db query main "SELECT * FROM users"    Run SQL query
   db log show                            Show branch operation history
   db watch                               Watch branches in real-time
   db completion bash                     Generate bash completions

📖 Docs: https://github.com/IN3PIRE/db
  `
  );

registerAuthCmd(program);
registerBranchCmd(program);
registerConnectCmd(program);
registerCiCmd(program);
registerConfigCmd(program);
registerProjectCmd(program);
registerRestoreCmd(program);
registerResetCmd(program);
registerExportCmd(program);
registerQueryCmd(program);
registerLogCmd(program);
registerWatchCmd(program);
registerCompletionCmd(program);

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
