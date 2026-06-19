import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, saveMeta } from '../lib/storage';
import { parseVersionArg } from '../lib/utils';

export function useCommand(): Command {
  return new Command('use')
    .description('Set the active version of a prompt')
    .argument('<name>', 'Prompt name')
    .argument('<version>', 'Version number to activate')
    .action((name: string, version: string) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);
      const ver = parseVersionArg(version);

      if (!meta.versions.includes(ver)) {
        console.log(chalk.red(`Version ${ver} does not exist for "${name}".`));
        return;
      }

      meta.active_version = ver;
      meta.updated_at = new Date().toISOString();
      saveMeta(name, meta);

      console.log(chalk.green(`✔ "${name}" is now using v${ver}`));
    });
}