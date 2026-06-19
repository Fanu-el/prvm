import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, saveMeta } from '../lib/storage';

export function rollbackCommand(): Command {
  return new Command('rollback')
    .description('Roll back a prompt to its previous version')
    .argument('<name>', 'Prompt name')
    .action((name: string) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);
      const currentIndex = meta.versions.indexOf(meta.active_version);

      if (currentIndex <= 0) {
        console.log(chalk.yellow('Already at the earliest version — cannot roll back further.'));
        return;
      }

      const previousVersion = meta.versions[currentIndex - 1];
      meta.active_version = previousVersion;
      meta.updated_at = new Date().toISOString();
      saveMeta(name, meta);

      console.log(chalk.green(`✔ Rolled back "${name}" to v${previousVersion}`));
    });
}