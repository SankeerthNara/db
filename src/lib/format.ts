import chalk from "chalk";
import Table from "cli-table3";
import { NeonBranch } from "./neon-api.js";

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(2)} ${units[unit]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function renderBranchTable(branches: NeonBranch[]): string {
  const table = new Table({
    head: ["Name", "ID", "Created", "Size", "Parent LSN"],
    style: { head: ["cyan"] },
  });

  for (const b of branches) {
    table.push([
      chalk.green(b.name),
      b.id.substring(0, 8) + "…",
      formatDate(b.created_at),
      formatBytes(b.logical_size ?? b.physical_size),
      b.parent_lsn ? b.parent_lsn.substring(0, 12) + "…" : "—",
    ]);
  }

  return table.toString();
}

export function renderBranchDetail(branch: NeonBranch): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`\n  ${branch.name}`));
  lines.push(`  ${chalk.dim("ID:")}        ${branch.id}`);
  lines.push(`  ${chalk.dim("Created:")}   ${formatDate(branch.created_at)}`);
  lines.push(`  ${chalk.dim("Updated:")}   ${formatDate(branch.updated_at)}`);
  lines.push(`  ${chalk.dim("Parent LSN:")} ${branch.parent_lsn ?? "—"}`);
  lines.push(
    `  ${chalk.dim("Size:")}      ${formatBytes(
      branch.logical_size ?? branch.physical_size
    )}`
  );
  return lines.join("\n");
}

export function renderDiff(
  branchA: string,
  branchB: string,
  diffs: DiffEntry[]
): string {
  if (diffs.length === 0) {
    return chalk.dim("\n  No schema differences found. Branches are in sync.\n");
  }

  const table = new Table({
    head: ["Type", "Table", "Detail"],
    style: { head: ["yellow"] },
  });

  for (const d of diffs) {
    const typeLabel =
      d.type === "added"
        ? chalk.green("+ added")
        : d.type === "removed"
          ? chalk.red("- removed")
          : chalk.yellow("~ modified");
    table.push([typeLabel, d.table, d.detail ?? ""]);
  }

  return (
    chalk.bold(`\n  Schema diff: ${branchA} → ${branchB}\n`) +
    table.toString() +
    "\n"
  );
}

export interface DiffEntry {
  type: "added" | "removed" | "modified";
  table: string;
  detail?: string;
}
