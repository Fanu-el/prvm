import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, listAllPrompts, getMeta } from '../lib/storage';

export function listCommand(): Command {
  return new Command('list')
    .description('List all saved prompts')
    .action(() => {
      if (!isInitialized()) {
        console.log(chalk.red('Run `prvm init` first.'));
        return;
      }

      const prompts = listAllPrompts();

      if (prompts.length === 0) {
        console.log(chalk.yellow('No prompts saved yet. Use `prvm save <name> <file>`.'));
        return;
      }

      console.log(chalk.bold('\nSaved Prompts:\n'));
      for (const name of prompts) {
        const meta = getMeta(name);
        console.log(
          chalk.cyan(`  ${name}`) +
          chalk.gray(` — ${meta.versions.length} version(s), active: v${meta.active_version}`)
        );
      }
      console.log('');
    });
}