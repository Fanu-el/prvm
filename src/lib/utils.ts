import chalk from 'chalk';
import { PromptVersion } from '../types';

export function requireInit(isInitialized: boolean): boolean {
  if (!isInitialized) {
    console.log(chalk.red('prvm is not initialized. Run `prvm init` first.'));
    return false;
  }
  return true;
}

export function requirePrompt(exists: boolean, name: string): boolean {
  if (!exists) {
    console.log(chalk.red(`Prompt "${name}" not found. Use \`prvm list\` to see available prompts.`));
    return false;
  }
  return true;
}

export function requireVersion(meta: { versions: number[] }, ver: number, name: string): boolean {
  if (!meta.versions.includes(ver)) {
    console.log(chalk.red(`Version ${ver} does not exist for "${name}". Available: ${meta.versions.join(', ')}`));
    return false;
  }
  return true;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function parseVersionArg(v: string): number {
  return parseInt(v.replace(/^v/i, ''), 10);
}

/**
 * Apply template variables to a prompt string.
 * Replaces {{variable}} placeholders with values from the vars object.
 * If a variable is not found, it leaves the placeholder as-is.
 */
export function applyTemplate(prompt: string, vars: Record<string, string>): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars.hasOwnProperty(key) ? vars[key] : match;
  });
}
