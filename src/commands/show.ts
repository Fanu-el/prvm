import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';
import { parseVersionArg } from '../lib/utils';

export function showCommand(): Command {
  return new Command('show')
    .description('Show a prompt version')
    .argument('<name>', 'Prompt name')
    .option('-v, --version <version>', 'Version number (defaults to active)')
    .action((name: string, options: { version?: string }) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);
      const ver = options.version ? parseVersionArg(options.version) : meta.active_version;

      if (!meta.versions.includes(ver)) {
        console.log(chalk.red(`Version ${ver} does not exist for "${name}".`));
        return;
      }

      const v = getVersion(name, ver);

      console.log(chalk.bold(`\n${name} v${ver}`) + (ver === meta.active_version ? chalk.green(' (active)') : ''));
      console.log(chalk.gray(`Created: ${v.created_at}`));
      console.log(chalk.gray(`Model:   ${v.provider}/${v.model} @ temp ${v.temperature}`));
      if (v.notes) console.log(chalk.gray(`Notes:   ${v.notes}`));
      console.log(chalk.bold('\nPrompt:\n'));
      console.log(v.prompt);
      console.log('');
    });
}