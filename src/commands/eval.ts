import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { isInitialized, promptExists, getMeta, getVersion } from '../lib/storage';
import { saveRun } from '../lib/runs';
import { runPrompt } from '../lib/llm';
import { parseVersionArg, applyTemplate } from '../lib/utils';

export function evalCommand(): Command {
  return new Command('eval')
    .description('Run a batch eval from a JSON file of inputs')
    .argument('<name>', 'Prompt name')
    .argument('<evalFile>', 'Path to JSON file with array of input objects or strings')
    .option('-v, --version <version>', 'Version to eval (defaults to active)')
    .option('-a, --all-versions', 'Run eval against all versions')
    .option('--max-tokens <n>', 'Override max tokens', (v) => {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 1) {
        throw new Error('max-tokens must be a positive number');
      }
      return n;
    })
    .action(async (name: string, evalFile: string, options: { version?: string; allVersions?: boolean; maxTokens?: number }) => {
      if (!isInitialized()) { console.log(chalk.red('Run `prvm init` first.')); return; }
      if (!promptExists(name)) { console.log(chalk.red(`Prompt "${name}" not found.`)); return; }
      if (!fs.existsSync(evalFile)) { console.log(chalk.red(`Eval file not found: ${evalFile}`)); return; }

      let inputs: unknown;
      try {
        inputs = JSON.parse(fs.readFileSync(evalFile, 'utf-8'));
      } catch (err) {
        console.log(chalk.red(`Invalid JSON in ${evalFile}: ${(err as Error).message}`));
        return;
      }

      if (!Array.isArray(inputs) || inputs.length === 0) {
        console.log(chalk.red('Eval file must contain a non-empty array.'));
        return;
      }

      // Support both string arrays and object arrays (for template variables)
      const validInputs = inputs.map((item, i) => {
        if (typeof item === 'string') {
          if (!item.trim()) throw new Error(`Entry at index ${i} is empty`);
          return { raw: item, vars: { input: item } };
        }
        if (typeof item === 'object' && item !== null) {
          return { raw: JSON.stringify(item), vars: item as Record<string, string> };
        }
        throw new Error(`Entry at index ${i} is not a string or object`);
      });

      const meta = getMeta(name);

      // --- All-versions mode ---
      if (options.allVersions) {
        const versionNumbers = [...meta.versions].sort((a, b) => a - b);
        console.log(chalk.bold(`\nRunning eval across ${versionNumbers.length} versions of "${name}" (${validInputs.length} inputs each)\n`));

        const results: Record<number, { succeeded: number; failed: number; outputs: string[][] }> = {};

        const maxTokensOverride = options.maxTokens;

        for (const ver of versionNumbers) {
          const versionData = getVersion(name, ver);
      const config: { provider: 'anthropic' | 'openai' | 'gemini'; model: string; temperature: number; max_tokens?: number } = {
        provider: versionData.provider,
        model: versionData.model,
        temperature: versionData.temperature,
      };
      if (maxTokensOverride !== undefined) {
        if (maxTokensOverride < 1) {
          console.log(chalk.red('max-tokens must be a positive number.'));
          return;
        }
        config.max_tokens = maxTokensOverride;
      }
          let succeeded = 0;
          let failed = 0;
          const outputs: string[][] = [];

          for (let i = 0; i < validInputs.length; i++) {
            const { vars } = validInputs[i];
            const spinner = ora(`v${ver} [${i + 1}/${validInputs.length}]`).start();
            const promptText = applyTemplate(versionData.prompt, vars);

            try {
              const { output, tokens } = await runPrompt(promptText, vars.input || '', config);
              spinner.succeed(chalk.gray(`v${ver} [${i + 1}/${validInputs.length}] Done (${tokens ?? '?'} tokens)`));
              outputs.push([output, vars.input || '']);
              saveRun(name, ver, {
                input: vars.input || JSON.stringify(vars),
                output,
                model: versionData.model,
                provider: versionData.provider,
                ran_at: new Date().toISOString(),
                tokens_used: tokens,
              });
              succeeded++;
            } catch (err: any) {
              spinner.fail(`v${ver} [${i + 1}/${validInputs.length}] Failed: ${err.message ?? 'Unknown error'}`);
              outputs.push(['ERROR', vars.input || '']);
              failed++;
            }
          }

          results[ver] = { succeeded, failed, outputs };
          console.log(
            failed === 0
              ? chalk.green(`  v${ver}: ${succeeded}/${validInputs.length} succeeded\n`)
              : chalk.yellow(`  v${ver}: ${succeeded} succeeded, ${failed} failed\n`)
          );
        }

        // Cross-version comparison summary
        console.log(chalk.bold('\n=== Cross-Version Comparison ===\n'));
        for (let i = 0; i < validInputs.length; i++) {
          console.log(chalk.cyan(`Input ${i + 1}: ${validInputs[i].vars.input?.slice(0, 60)}...`));
          for (const ver of versionNumbers) {
            const [output] = results[ver].outputs[i];
            const preview = output.slice(0, 80) + (output.length > 80 ? '...' : '');
            console.log(chalk.gray(`  v${ver}: ${preview}`));
          }
          console.log('');
        }

        return;
      }

      // --- Single version mode (existing behavior) ---
      const ver = options.version ? parseVersionArg(options.version) : meta.active_version;

      if (isNaN(ver) || !meta.versions.includes(ver)) {
        console.log(chalk.red(`Version "${options.version}" not found for "${name}".`));
        return;
      }

      const versionData = getVersion(name, ver);
      const config: { provider: 'anthropic' | 'openai' | 'gemini'; model: string; temperature: number; max_tokens?: number } = {
        provider: versionData.provider,
        model: versionData.model,
        temperature: versionData.temperature,
      };
      if (options.maxTokens !== undefined) {
        if (options.maxTokens < 1) {
          console.log(chalk.red('max-tokens must be a positive number.'));
          return;
        }
        config.max_tokens = options.maxTokens;
      }

      console.log(chalk.bold(`\nRunning eval: ${validInputs.length} inputs against "${name}" v${ver}\n`));

      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < validInputs.length; i++) {
        const { vars } = validInputs[i];
        const spinner = ora(`[${i + 1}/${validInputs.length}] ${vars.input?.slice(0, 50) || ''}...`).start();
        const promptText = applyTemplate(versionData.prompt, vars);

        try {
          const { output, tokens } = await runPrompt(promptText, vars.input || '', config);
          spinner.succeed(chalk.gray(`[${i + 1}/${validInputs.length}] Done (${tokens ?? '?'} tokens)`));

          saveRun(name, ver, {
            input: vars.input || JSON.stringify(vars),
            output,
            model: versionData.model,
            provider: versionData.provider,
            ran_at: new Date().toISOString(),
            tokens_used: tokens,
          });

          console.log(chalk.white(`  → ${output.slice(0, 100)}${output.length > 100 ? '...' : ''}\n`));
          succeeded++;
        } catch (err: any) {
          spinner.fail(`[${i + 1}/${validInputs.length}] Failed: ${err.message ?? 'Unknown error'}`);
          failed++;
        }
      }

      console.log(
        failed === 0
          ? chalk.green(`\n✔ Eval complete. ${succeeded}/${validInputs.length} runs saved to v${ver}.\n`)
          : chalk.yellow(`\n⚠ Eval finished with errors. ${succeeded} succeeded, ${failed} failed (v${ver}).\n`)
      );
    });
}
