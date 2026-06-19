import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';

export function currentCommand(): Command {
  return new Command('current')
    .description('Show the active version of a prompt')
    .argument('<name>', 'Prompt name')
    .action((name: string) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);
      const version = getVersion(name, meta.active_version);

      console.log(chalk.bold(`\n${name} — active: v${version.version}\n`));
      console.log(chalk.gray(`Model: ${version.model} (${version.provider})`));
      console.log(chalk.gray(`Notes: ${version.notes || '—'}`));
      console.log(chalk.gray(`Created: ${version.created_at}\n`));
      console.log(version.prompt);
      console.log('');
    });
}