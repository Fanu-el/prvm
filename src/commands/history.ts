import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';

export function historyCommand(): Command {
  return new Command('history')
    .description('Show version history of a prompt')
    .argument('<name>', 'Prompt name')
    .action((name: string) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);

      console.log(chalk.bold(`\nHistory for "${name}":\n`));

      for (const ver of [...meta.versions].reverse()) {
        const v = getVersion(name, ver);
        const active = ver === meta.active_version ? chalk.green(' ◀ active') : '';
        console.log(
          chalk.cyan(`  v${ver}`) + active +
          chalk.gray(`  ${v.created_at}`) +
          (v.notes ? chalk.white(`  "${v.notes}"`) : '')
        );
      }
      console.log('');
    });
}