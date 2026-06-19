import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import {
  isInitialized,
  promptExists,
  getMeta,
  getVersion,
  getConfig,
} from "../lib/storage";
import { saveRun } from "../lib/runs";
import { runPrompt } from "../lib/llm";
import { parseVersionArg, applyTemplate } from "../lib/utils";

export function testCommand(): Command {
  return new Command("test")
    .description("Run a prompt version against an input and save the result")
    .argument("<name>", "Prompt name")
    .argument("[version]", "Version to test, e.g. v2 (defaults to active)")
    .option("-i, --input <file>", "Path to input file (supports JSON objects for template variables)")
    .option("-t, --temperature <n>", "Override temperature (0-2)", (v) => {
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > 2) {
        throw new Error('temperature must be between 0 and 2');
      }
      return n;
    })
    .option("-m, --model <model>", "Override model")
    .option("-p, --provider <provider>", "Override provider (anthropic, openai, gemini)")
    .option("--max-tokens <n>", "Override max tokens", (v) => parseInt(v, 10))
    .action(
      async (
        name: string,
        versionArg: string | undefined,
        options: { input?: string; temperature?: number; model?: string; provider?: string; maxTokens?: number },
      ) => {
        if (!isInitialized()) {
          console.log(chalk.red("Run `prvm init` first."));
          return;
        }
        if (!promptExists(name)) {
          console.log(chalk.red(`Prompt "${name}" not found.`));
          return;
        }

        const meta = getMeta(name);
        const versionNum = versionArg
          ? parseVersionArg(versionArg)
          : meta.active_version;

        if (isNaN(versionNum) || !meta.versions.includes(versionNum)) {
          console.log(
            chalk.red(`Version "${versionArg}" not found for "${name}".`),
          );
          return;
        }

        const version = getVersion(name, versionNum);

        if (!options.input || !fs.existsSync(options.input)) {
          console.log(chalk.red("Please provide a valid --input file."));
          return;
        }

        const inputContent = fs.readFileSync(options.input, "utf-8");

        // Parse input - support plain text, single JSON object, or JSON array
        let inputs: unknown;
        try {
          inputs = JSON.parse(inputContent);
        } catch {
          inputs = inputContent;
        }

        // Validate input format - test command expects object, not array
        if (Array.isArray(inputs)) {
          console.log(chalk.red('Test command expects a single input object, not an array.'));
          console.log(chalk.yellow('For batch processing with arrays, use the `eval` command instead.'));
          return;
        }

        // Support both string arrays and object arrays (for template variables)
        let validInputs: { raw: string; vars: Record<string, string> }[];
        if (Array.isArray(inputs)) {
          validInputs = inputs.map((item, i) => {
            if (typeof item === 'string') {
              if (!item.trim()) throw new Error(`Entry at index ${i} is empty`);
              return { raw: item, vars: { input: item } };
            }
            if (typeof item === 'object' && item !== null) {
              return { raw: JSON.stringify(item), vars: item as Record<string, string> };
            }
            throw new Error(`Entry at index ${i} is not a string or object`);
          });
        } else if (typeof inputs === 'string') {
          validInputs = [{ raw: inputs, vars: { input: inputs } }];
        } else if (typeof inputs === 'object' && inputs !== null) {
          validInputs = [{ raw: JSON.stringify(inputs), vars: inputs as Record<string, string> }];
        } else {
          validInputs = [{ raw: String(inputs), vars: { input: String(inputs) } }];
        }

        // Build config with overrides
        const baseConfig = getConfig();
        const provider = (options.provider || baseConfig.provider) as 'anthropic' | 'openai' | 'gemini';
        const config: { provider: 'anthropic' | 'openai' | 'gemini'; model: string; temperature: number; max_tokens?: number } = {
          provider,
          model: options.model || baseConfig.model,
          temperature: options.temperature ?? baseConfig.temperature,
        };

        // Add max_tokens if provided or if set in base config
        if (options.maxTokens !== undefined) {
          if (isNaN(options.maxTokens) || options.maxTokens < 1) {
            console.log(chalk.red('max-tokens must be a positive number.'));
            return;
          }
          config.max_tokens = options.maxTokens;
        } else if (baseConfig.max_tokens !== undefined) {
          config.max_tokens = baseConfig.max_tokens;
        }

        // Validate temperature is within range
        if (config.temperature < 0 || config.temperature > 2) {
          console.log(chalk.red('Temperature must be between 0 and 2.'));
          return;
        }

        console.log(chalk.bold(`\nRunning ${name}@v${versionNum} against ${config.provider}/${config.model} (temp=${config.temperature})...\n`));

        for (let i = 0; i < validInputs.length; i++) {
          const { vars } = validInputs[i];
          const promptText = applyTemplate(version.prompt, vars);
          const inputText = vars.input || '';

          console.log(chalk.gray(`[${i + 1}/${validInputs.length}] Running...`));

          let output: string;
          let tokens: number | undefined;

          try {
            const result = await runPrompt(promptText, inputText, config);
            output = result.output;
            tokens = result.tokens;
          } catch (err: any) {
            console.log(
              chalk.red(`\n✖ Request failed: ${err.message || "Unknown error"}`),
            );

            if (err.status === 503) {
              console.log(
                chalk.yellow("The model is overloaded — try again in a moment."),
              );
            } else if (err.status === 401 || err.status === 403) {
              console.log(chalk.yellow("Check your API key for this provider."));
            } else if (err.status === 429) {
              console.log(
                chalk.yellow("Rate limited — slow down or wait before retrying."),
              );
            }

            process.exitCode = 1;
            return;
          }

          saveRun(name, versionNum, {
            input: inputText,
            output,
            model: config.model,
            provider: config.provider,
            ran_at: new Date().toISOString(),
            tokens_used: tokens,
          });

          console.log(chalk.bold(`\nOutput [${i + 1}/${validInputs.length}]:\n`));
          console.log(output);
          console.log(chalk.green(`\n✔ Run ${i + 1} saved.\n`));
        }
      },
    );
}
