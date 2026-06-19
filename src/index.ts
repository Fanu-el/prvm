#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { saveCommand } from "./commands/save";
import { listCommand } from "./commands/list";
import { showCommand } from "./commands/show";
import { useCommand } from "./commands/use";
import { rollbackCommand } from "./commands/rollback";
import { diffCommand } from "./commands/diff";
import { historyCommand } from "./commands/history";
import { testCommand } from "./commands/test";
import { evalCommand } from "./commands/eval";
import { exportCommand } from "./commands/export";
import { importCommand } from "./commands/import";
import { currentCommand } from "./commands/current";
import { configCommand } from "./commands/config";
import { gitignoreCommand } from "./commands/gitignore";
import chalk from "chalk";

const program = new Command();

program
  .name("prvm")
  .description("Prompt Version Manager — track, test, and manage LLM prompt versions")
  .version("0.1.0");

program.addCommand(initCommand());
program.addCommand(saveCommand());
program.addCommand(listCommand());
program.addCommand(showCommand());
program.addCommand(useCommand());
program.addCommand(rollbackCommand());
program.addCommand(diffCommand());
program.addCommand(historyCommand());
program.addCommand(testCommand());
program.addCommand(evalCommand());
program.addCommand(exportCommand());
program.addCommand(importCommand());
program.addCommand(currentCommand());
program.addCommand(configCommand());
program.addCommand(gitignoreCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(`\n✖ Unexpected error: ${err.message || err}`));
  process.exit(1);
});
