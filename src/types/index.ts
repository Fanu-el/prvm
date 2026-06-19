export interface PromptMeta {
  name: string;
  active_version: number;
  versions: number[];
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  input: string;
  output: string;
  model: string;
  ran_at: string;
  tokens_used?: number;
}

export interface PromptVersion {
  version: number;
  created_at: string;
  prompt: string;
  model: string;
  provider: "anthropic" | "openai" | "gemini"; // ← add 'gemini'
  temperature: number;
  notes: string;
  // test_results: TestResult[];
}

export interface RunResult {
  input: string;
  output: string;
  model: string;
  provider: string;
  ran_at: string;
  tokens_used?: number;
}

export interface PRVMConfig {
  provider: "anthropic" | "openai" | "gemini";
  model: string;
  temperature: number;
  max_runs_per_version: number;
  max_tokens?: number;
}

export interface LLMRunConfig {
  provider: 'anthropic' | 'openai' | 'gemini';
  model: string;
  temperature: number;
  max_tokens?: number;
}
