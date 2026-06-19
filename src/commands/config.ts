import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { isInitialized, getConfig } from '../lib/storage';

const CONFIG_FILE = path.join(process.cwd(), '.prompts', 'config.json');

export function configCommand(): Command {
  return new Command('config')
    .description('View or update prvm configuration')
    .option('--max-runs <n>', 'Max test runs to keep per version')
    .option('--provider <provider>', 'Default provider (anthropic, openai, gemini)')
    .option('--model <model>', 'Default model')
    .option('--max-tokens <n>', 'Default max tokens for LLM responses')
    .option('--show', 'Show current config')
    .action((options) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }

      const config = getConfig();

      if (options.show || (!options.maxRuns && !options.provider && !options.model && !options.maxTokens)) {
        console.log(chalk.bold('\nCurrent config:\n'));
        console.log(JSON.stringify(config, null, 2));
        console.log('');
        return;
      }

      if (options.maxRuns) {
        const n = parseInt(options.maxRuns, 10);
        if (isNaN(n) || n < 1) {
          console.log(chalk.red('max-runs must be a positive number.'));
          return;
        }
        config.max_runs_per_version = n;
      }

      if (options.provider) {
        const validProviders = ['anthropic', 'openai', 'gemini'];
        if (!validProviders.includes(options.provider)) {
          console.log(chalk.red(`Invalid provider "${options.provider}".`));
          console.log(chalk.gray('Valid providers: anthropic, openai, gemini'));
          return;
        }
        config.provider = options.provider;
      }
      if (options.model) {
        if (!options.model.trim()) {
          console.log(chalk.red('Model name cannot be empty.'));
          return;
        }
        config.model = options.model;
      }

      if (options.maxTokens) {
        const n = parseInt(options.maxTokens, 10);
        if (isNaN(n) || n < 1) {
          console.log(chalk.red('max-tokens must be a positive number.'));
          return;
        }
        config.max_tokens = n;
      }

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log(chalk.green('✔ Config updated.'));
      console.log(JSON.stringify(config, null, 2));
    });
}