import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import { isInitialized, saveMeta, saveVersion, promptExists } from '../lib/storage';
import { PromptMeta, PromptVersion } from '../types';

const NAME_PATTERN = /^[a-z0-9-]+$/;
const MAX_PROMPT_LENGTH = 50_000;

export function importCommand(): Command {
  return new Command('import')
    .description('Import a prompt from an exported JSON file')
    .argument('<file>', 'Path to exported JSON file')
    .option('-y, --yes', 'Overwrite without confirmation if the prompt already exists')
    .action(async (file: string, options: { yes?: boolean }) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!fs.existsSync(file)) { console.log(chalk.red(`File not found: ${file}`)); return; }

      // --- Valid JSON ---
      let data: { meta: PromptMeta; versions: PromptVersion[] };
      try {
        data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (err) {
        console.log(chalk.red(`Invalid JSON in ${file}: ${(err as Error).message}`));
        return;
      }

      // --- Shape validation ---
      if (!data || typeof data !== 'object') {
        console.log(chalk.red('Invalid import file — expected an object with "meta" and "versions".'));
        return;
      }

      if (!data.meta || typeof data.meta.name !== 'string') {
        console.log(chalk.red('Invalid import file — missing or invalid "meta.name".'));
        return;
      }

      if (!Array.isArray(data.versions) || data.versions.length === 0) {
        console.log(chalk.red('Invalid import file — "versions" must be a non-empty array.'));
        return;
      }

      // --- Name validation ---
      if (!NAME_PATTERN.test(data.meta.name)) {
        console.log(chalk.red(`Invalid prompt name "${data.meta.name}" in import file.`));
        console.log(chalk.gray('Names can only contain lowercase letters, numbers, and hyphens.'));
        return;
      }

      // --- Validate every version entry before writing anything ---
      for (const v of data.versions) {
        if (typeof v.version !== 'number' || !Number.isInteger(v.version) || v.version < 1) {
          console.log(chalk.red(`Invalid version number in import file: ${JSON.stringify(v.version)}`));
          return;
        }
        if (typeof v.prompt !== 'string' || !v.prompt.trim()) {
          console.log(chalk.red(`Version v${v.version} has an empty or invalid "prompt" field.`));
          return;
        }
        if (v.prompt.length > MAX_PROMPT_LENGTH) {
          console.log(chalk.red(`Version v${v.version} exceeds ${MAX_PROMPT_LENGTH.toLocaleString()} characters.`));
          return;
        }
      }

      // --- Validate meta.versions matches the actual version files being imported ---
      const versionNumbers = data.versions.map(v => v.version).sort((a, b) => a - b);
      const metaVersionNumbers = [...data.meta.versions].sort((a, b) => a - b);
      if (JSON.stringify(versionNumbers) !== JSON.stringify(metaVersionNumbers)) {
        console.log(chalk.red('"meta.versions" does not match the versions array — import file is inconsistent.'));
        return;
      }

      if (!versionNumbers.includes(data.meta.active_version)) {
        console.log(chalk.red(`"meta.active_version" (${data.meta.active_version}) is not among the imported versions.`));
        return;
      }

      // --- Collision check ---
      if (promptExists(data.meta.name) && !options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `"${data.meta.name}" already exists. Overwrite it with the imported data?`,
            default: false,
          },
        ]);
        if (!confirm) { console.log(chalk.gray('Skipped.')); return; }
      }

      // --- All validated — now safe to write ---
      saveMeta(data.meta.name, data.meta);
      for (const v of data.versions) saveVersion(data.meta.name, v);

      console.log(chalk.green(`✔ Imported "${data.meta.name}" (${data.versions.length} versions)`));
    });
}