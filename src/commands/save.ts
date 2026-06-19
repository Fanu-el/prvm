import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { isInitialized, getConfig, promptExists, getMeta, saveMeta, saveVersion, getVersion } from '../lib/storage';
import { PromptVersion, PromptMeta } from '../types';

const MAX_PROMPT_LENGTH = 50_000; // ~12k tokens, generous ceiling for a "normal" prompt
const NAME_PATTERN = /^[a-z0-9-]+$/;

export function saveCommand(): Command {
  return new Command('save')
    .description('Save a new version of a prompt')
    .argument('<name>', 'Prompt name')
    .argument('<file>', 'Path to prompt text file')
    .option('-n, --notes <notes>', 'Notes for this version', '')
    .option('-f, --force', 'Skip the identical-content warning')
    .action(async (name: string, file: string, options: { notes: string; force?: boolean }) => {
      if (!isInitialized()) {
        console.log(chalk.red('Run `prvm init` first.'));
        return;
      }

      // --- Validate name format ---
      if (!NAME_PATTERN.test(name)) {
        console.log(chalk.red(`Invalid prompt name "${name}".`));
        console.log(chalk.gray('Names can only contain lowercase letters, numbers, and hyphens (e.g. "summarize-article").'));
        return;
      }

      if (!fs.existsSync(file)) {
        console.log(chalk.red(`File not found: ${file}`));
        return;
      }

      const prompt = fs.readFileSync(file, 'utf-8');

      // --- Validate non-empty ---
      if (!prompt.trim()) {
        console.log(chalk.red(`File "${file}" is empty — nothing to save.`));
        return;
      }

      // --- Validate max length ---
      if (prompt.length > MAX_PROMPT_LENGTH) {
        console.log(chalk.red(`Prompt is ${prompt.length.toLocaleString()} characters — exceeds the ${MAX_PROMPT_LENGTH.toLocaleString()} character limit.`));
        console.log(chalk.gray('Did you point --file at the wrong thing? Large inputs usually belong in --input for `prvm test`, not in the saved prompt itself.'));
        return;
      }

      const config = getConfig();

      let meta: PromptMeta;
      let newVersion: number;

      if (promptExists(name)) {
        meta = getMeta(name);

        // --- Warn on identical content to active version ---
        const activeVersion = getVersion(name, meta.active_version);
        if (activeVersion.prompt === prompt && !options.force) {
          console.log(chalk.yellow(`This is identical to the active version (v${meta.active_version}) — no changes detected.`));
          console.log(chalk.gray('Use --force to save it anyway as a new version.'));
          return;
        }

        newVersion = meta.versions[meta.versions.length - 1] + 1;
        meta.versions.push(newVersion);
        meta.active_version = newVersion;
        meta.updated_at = new Date().toISOString();
      } else {
        newVersion = 1;
        meta = {
          name,
          active_version: 1,
          versions: [1],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const versionData: PromptVersion = {
        version: newVersion,
        created_at: new Date().toISOString(),
        prompt,
        model: config.model,
        provider: config.provider,
        temperature: config.temperature,
        notes: options.notes,
      };

      saveVersion(name, versionData);
      saveMeta(name, meta);

      console.log(chalk.green(`✔ Saved ${name} v${newVersion}`));
    });
}