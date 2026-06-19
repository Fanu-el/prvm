import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { isInitialized } from "../lib/storage";

const GITIGNORE_ENTRY = ".prompts/.runs/";

function readGitignore(): string {
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  return fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf-8")
    : "";
}

function isIgnored(content: string): boolean {
  return content
    .split("\n")
    .some((line) => line.trim() === GITIGNORE_ENTRY.trim());
}

function detectLineEnding(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function addEntry(): void {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const content = readGitignore();
  const eol = detectLineEnding(content);

  const insertion =
    content === '' || content.endsWith(eol)
      ? GITIGNORE_ENTRY + eol
      : eol + GITIGNORE_ENTRY + eol;

  fs.writeFileSync(gitignorePath, content + insertion);
  console.log(chalk.green(`✔ Added "${GITIGNORE_ENTRY}" to .gitignore`));
}

function removeEntry(): void {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const content = readGitignore();
  const eol = detectLineEnding(content);

  const withLeadingNewline = eol + GITIGNORE_ENTRY + eol;
  const atStart = GITIGNORE_ENTRY + eol;

  let newContent: string;
  if (content.includes(withLeadingNewline)) {
    newContent = content.replace(withLeadingNewline, eol);
  } else if (content.startsWith(atStart)) {
    newContent = content.slice(atStart.length);
  } else {
    newContent = content
      .split(eol)
      .filter((line) => line.trim() !== GITIGNORE_ENTRY.trim())
      .join(eol);
  }

  fs.writeFileSync(gitignorePath, newContent);
  console.log(chalk.green(`✔ Removed "${GITIGNORE_ENTRY}" from .gitignore`));
  console.log(chalk.gray('Note: files already committed before being ignored need `git add` again to be tracked.'));
}

export function gitignoreCommand(): Command {
  return new Command("gitignore")
    .description(
      "Toggle whether .prompts/.runs/ (test run history) is gitignored",
    )
    .option("--add", "Add the entry to .gitignore")
    .option("--remove", "Remove the entry from .gitignore")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(
      async (options: { add?: boolean; remove?: boolean; yes?: boolean }) => {
        if (!isInitialized()) {
          console.log(chalk.red("Run `prvm init` first."));
          return;
        }

        // --- Explicit flags: just do it, no questions asked ---
        if (options.add) {
          const content = readGitignore();
          if (isIgnored(content)) {
            console.log(chalk.yellow("Already ignored."));
            return;
          }
          addEntry();
          return;
        }

        if (options.remove) {
          const content = readGitignore();
          if (!isIgnored(content)) {
            console.log(chalk.yellow("Not currently ignored."));
            return;
          }
          removeEntry();
          return;
        }

        // --- No flag: context-aware toggle with confirmation ---
        const content = readGitignore();
        const currentlyIgnored = isIgnored(content);

        const message = currentlyIgnored
          ? `Test runs are currently ignored. Remove "${GITIGNORE_ENTRY}" from .gitignore and start tracking them?`
          : `Test runs are currently tracked. Add "${GITIGNORE_ENTRY}" to .gitignore and stop tracking them?`;

        if (!options.yes) {
          const { confirm } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message,
              default: !currentlyIgnored,
            },
          ]);
          if (!confirm) {
            console.log(chalk.gray("Skipped."));
            return;
          }
        }

        currentlyIgnored ? removeEntry() : addEntry();
      },
    );
}
