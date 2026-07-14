import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { getClient, getProjectId, resolveBranch } from "../lib/client.js";

export function registerExportCmd(program: Command) {
  program
    .command("export")
    .description("Export a branch's schema (and optionally data) to a SQL file")
    .argument("<branch>", "Branch name or ID to export")
    .option("-p, --project <id>", "Project ID")
    .option("-o, --output <file>", "Output file (default: <branch>-export.sql)")
    .option("--schema <schema>", "Database schema (default: public)")
    .option("--data", "Include INSERT data in the export (uses pg_dump)")
    .action(async (identifier, options) => {
      const spinner = ora("Preparing export…").start();
      try {
        const client = getClient();
        const projectId = await getProjectId(options.project);
        const branch = await resolveBranch(client, projectId, identifier);
        const connStr = await client.getConnectionString(projectId, branch.id);
        const schema = options.schema || "public";
        const outputFile = options.output || `${branch.name}-export.sql`;

        spinner.stop();

        // First attempt: use information_schema to build CREATE TABLE statements
        console.log(chalk.bold(`\n  Exporting ${branch.name} (schema: ${schema}) → ${outputFile}\n`));

        const pg = (await import("pg")).default;
        const pgClient = new pg.Client(connStr);
        await pgClient.connect();

        // Get all tables
        const tablesRes = await pgClient.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = $1 AND table_type = 'BASE TABLE'
           ORDER BY table_name`,
          [schema]
        );

        if (tablesRes.rows.length === 0) {
          console.log(chalk.dim(`  No tables found in schema "${schema}".`));
          await pgClient.end();
          return;
        }

        const lines: string[] = [];
        lines.push(`-- Exported from ${branch.name} on ${new Date().toISOString()}`);
        lines.push(`-- Schema: ${schema}`);
        lines.push("");

        for (const row of tablesRes.rows) {
          const tableName = row.table_name;

          // Get columns
          const colsRes = await pgClient.query(
            `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
             FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2
             ORDER BY ordinal_position`,
            [schema, tableName]
          );

          const colDefs = colsRes.rows.map((col: any) => {
            let def = `  "${col.column_name}" ${col.data_type}`;
            if (col.character_maximum_length) {
              def += `(${col.character_maximum_length})`;
            }
            if (col.is_nullable === "NO") def += " NOT NULL";
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            return def;
          });

          lines.push(`CREATE TABLE "${schema}"."${tableName}" (`);
          lines.push(colDefs.join(",\n"));
          lines.push(");");
          lines.push("");

          // Get indexes
          const idxRes = await pgClient.query(
            `SELECT indexname, indexdef FROM pg_indexes
             WHERE schemaname = $1 AND tablename = $2
             ORDER BY indexname`,
            [schema, tableName]
          );
          for (const idx of idxRes.rows) {
            lines.push(`${idx.indexdef};`);
            lines.push("");
          }

          if (options.data) {
            const dataRes = await pgClient.query(
              `SELECT * FROM "${schema}"."${tableName}" LIMIT 1000`
            );
            if (dataRes.rows.length > 0) {
              const cols = dataRes.fields.map((f: any) => `"${f.name}"`).join(", ");
              for (const row of dataRes.rows) {
                const vals = Object.values(row).map((v) => {
                  if (v === null) return "NULL";
                  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
                  if (v instanceof Date) return `'${v.toISOString()}'`;
                  return String(v);
                }).join(", ");
                lines.push(`INSERT INTO "${schema}"."${tableName}" (${cols}) VALUES (${vals});`);
              }
              lines.push("");
            }
          }
        }

        await pgClient.end();

        // Write the file
        const fs = await import("node:fs");
        fs.writeFileSync(outputFile, lines.join("\n"), "utf-8");

        console.log(chalk.green(`  ✓ Exported ${tablesRes.rows.length} table(s) to ${outputFile}\n`));
      } catch (err) {
        spinner.fail("Export failed");
        console.error(chalk.red(`  ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
