import { Command } from 'commander';
import chalk from 'chalk';
import { initStorage, isInitialized } from '../lib/storage';

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize prvm in the current directory')
    .action(() => {
      if (isInitialized()) {
        console.log(chalk.yellow('prvm already initialized in this directory.'));
        return;
      }
      initStorage();
      console.log(chalk.green('✔ Initialized prvm — .prompts/ directory created.'));
      console.log(chalk.gray('\nAdd your API keys to .env:'));
      console.log(chalk.gray('  ANTHROPIC_API_KEY=...'));
      console.log(chalk.gray('  OPENAI_API_KEY=...'));
      console.log(chalk.gray('  GOOGLE_API_KEY=...'));
      console.log(chalk.gray('\nDefault provider is anthropic. To switch, edit .prompts/config.json:'));
      console.log(chalk.gray('  provider: "anthropic" | "openai" | "gemini"'));
    });
}