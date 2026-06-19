import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';

export function exportCommand(): Command {
  return new Command('export')
    .description('Export a prompt and all its versions to a JSON file')
    .argument('<name>', 'Prompt name')
    .argument('<outFile>', 'Output file path (must end with .json)')
    .action((name: string, outFile: string) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }

      // --- Validate output file extension ---
      if (!outFile.endsWith('.json')) {
        console.log(chalk.red('Output file must have a .json extension.'));
        return;
      }

      // --- Validate output file path (basic security) ---
      if (outFile.includes('..')) {
        console.log(chalk.red('Invalid output path — path traversal not allowed.'));
        return;
      }

      const meta = getMeta(name);
      const versions = meta.versions.map(v => getVersion(name, v));
      const exportData = { meta, versions };

      try {
        fs.writeFileSync(outFile, JSON.stringify(exportData, null, 2));
        console.log(chalk.green(`✔ Exported "${name}" to ${outFile}`));
      } catch (err: any) {
        console.log(chalk.red(`Failed to write export file: ${err.message || 'Unknown error'}`));
      }
    });
}
