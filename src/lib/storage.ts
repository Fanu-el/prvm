import fs from "fs";
import path from "path";
import { PromptVersion, PromptMeta, PRVMConfig } from "../types";

const PROMPTS_DIR = ".prompts";
const CONFIG_FILE = ".prompts/config.json";

export function getPromptsDir(): string {
  return path.join(process.cwd(), PROMPTS_DIR);
}

export function isInitialized(): boolean {
  return fs.existsSync(path.join(process.cwd(), CONFIG_FILE));
}

export function initStorage(): void {
  const dir = getPromptsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const config: PRVMConfig = {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: 0.7,
    max_runs_per_version: 20, // ← default
    max_tokens: 4096, // ← default
  };

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }
}

export function getConfig(): PRVMConfig {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    throw new Error("No config found. Run `prvm init` first.");
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    throw new Error(`Config file is corrupted: ${(err as Error).message}`);
  }
}

export function getPromptDir(name: string): string {
  return path.join(getPromptsDir(), name);
}

export function getMetaPath(name: string): string {
  return path.join(getPromptDir(name), "meta.json");
}

export function getVersionPath(name: string, version: number): string {
  return path.join(getPromptDir(name), `v${version}.json`);
}

export function promptExists(name: string): boolean {
  return fs.existsSync(getMetaPath(name)); // ✅ check the actual file
}

export function getMeta(name: string): PromptMeta {
  const metaPath = getMetaPath(name);

  if (!fs.existsSync(metaPath)) {
    throw new Error(
      `Prompt "${name}" exists but is missing meta.json — it may be corrupted.`,
    );
  }

  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch (err) {
    throw new Error(
      `Prompt "${name}" has a corrupted meta.json: ${(err as Error).message}`,
    );
  }
}

export function saveMeta(name: string, meta: PromptMeta): void {
  fs.writeFileSync(getMetaPath(name), JSON.stringify(meta, null, 2));
}

export function getVersion(name: string, version: number): PromptVersion {
  const versionPath = getVersionPath(name, version);

  if (!fs.existsSync(versionPath)) {
    throw new Error(`Version v${version} not found for "${name}".`);
  }

  try {
    return JSON.parse(fs.readFileSync(versionPath, "utf-8"));
  } catch (err) {
    throw new Error(
      `Version v${version} for "${name}" is corrupted: ${(err as Error).message}`,
    );
  }
}

export function saveVersion(name: string, versionData: PromptVersion): void {
  const dir = getPromptDir(name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    getVersionPath(name, versionData.version),
    JSON.stringify(versionData, null, 2),
  );
}

export function listAllPrompts(): string[] {
  const dir = getPromptsDir();
  return fs.readdirSync(dir).filter((f) => {
    const full = path.join(dir, f);
    return fs.statSync(full).isDirectory();
  });
}
