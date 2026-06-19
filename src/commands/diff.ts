import { Command } from 'commander';
import chalk from 'chalk';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';
import { parseVersionArg } from '../lib/utils';

export function diffCommand(): Command {
  return new Command('diff')
    .description('Diff two versions of a prompt')
    .argument('<name>', 'Prompt name')
    .option('-a, --version-a <a>', 'First version (defaults to active)')
    .option('-b, --version-b <b>', 'Second version (defaults to active - 1)')
    .action((name: string, options: { versionA?: string; versionB?: string }) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      const meta = getMeta(name);
      const verA = options.versionA ? parseVersionArg(options.versionA) : meta.active_version;
      const activeIndex = meta.versions.indexOf(verA);
      const verB = options.versionB
        ? parseVersionArg(options.versionB)
        : meta.versions[activeIndex - 1];

      if (!verB) {
        console.log(chalk.yellow('Only one version exists — nothing to diff.'));
        return;
      }

      const a = getVersion(name, verA);
      const b = getVersion(name, verB);

      const aLines = a.prompt.split('\n');
      const bLines = b.prompt.split('\n');

      console.log(chalk.bold(`\nDiff: v${verB} → v${verA}\n`));

      const maxLen = Math.max(aLines.length, bLines.length);
      for (let i = 0; i < maxLen; i++) {
        const lineA = aLines[i];
        const lineB = bLines[i];
        if (lineA === lineB) {
          console.log(chalk.gray(`  ${lineA ?? ''}`));
        } else {
          if (lineB !== undefined) console.log(chalk.red(`- ${lineB}`));
          if (lineA !== undefined) console.log(chalk.green(`+ ${lineA}`));
        }
      }
      console.log('');
    });
}