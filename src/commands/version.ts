import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

export function registerVersionCmd(program: any) {
  program
    .command("version")
    .description("Show version information")
    .action(() => {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const pkgPath = path.resolve(__dirname, "../../package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      console.log(chalk.bold(`db v${pkg.version}`));
    });
}
