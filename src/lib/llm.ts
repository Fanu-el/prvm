import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import path from "path";
import { LLMRunConfig } from "../types";

config({ path: path.join(process.cwd(), ".env") });

const DEFAULT_MAX_TOKENS = 4096;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (rate limit or temporary server error)
 */
function isRetryableError(err: any): boolean {
  const status = err?.status || err?.response?.status;
  // Rate limit (429), Service Unavailable (503), Too Many Requests
  return status === 429 || status === 503 || (status >= 500 && status < 600);
}

/**
 * Get retry delay with exponential backoff and jitter
 */
function getRetryDelay(attempt: number): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
  const jitter = Math.random() * 1000; // Add jitter (0-1s)
  return Math.min(baseDelay + jitter, 30000); // Cap at 30s
}

export async function runPrompt(
  prompt: string,
  input: string,
  config: LLMRunConfig,
): Promise<{ output: string; tokens?: number }> {
  const fullPrompt = `${prompt}\n\n${input}`;
  const maxTokens = config.max_tokens ?? DEFAULT_MAX_TOKENS;

  // Retry logic with exponential backoff
  let lastError: any;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`  Retrying... (attempt ${attempt + 1}/${MAX_RETRIES}, delay ${Math.round(delay / 1000)}s)`);
        await sleep(delay);
      }

      const result = await runOnce(fullPrompt, config, maxTokens);
      return result;
    } catch (err: any) {
      lastError = err;
      if (!isRetryableError(err)) {
        throw err; // Not retryable, throw immediately
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

async function runOnce(
  fullPrompt: string,
  config: LLMRunConfig,
  maxTokens: number,
): Promise<{ output: string; tokens?: number }> {
  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      temperature: config.temperature,
      messages: [{ role: "user", content: fullPrompt }],
    });
    const output = res.content[0].type === "text" ? res.content[0].text : "";
    return { output, tokens: res.usage.input_tokens + res.usage.output_tokens };
  }

  if (config.provider === "openai") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: config.model,
      max_tokens: maxTokens,
      temperature: config.temperature,
      messages: [{ role: "user", content: fullPrompt }],
    });
    const output = res.choices[0].message.content || "";
    const tokens = res.usage ? res.usage.total_tokens : undefined;
    return { output, tokens };
  }

  if (config.provider === "gemini") {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = client.getGenerativeModel({
      model: config.model,
      generationConfig: { temperature: config.temperature, maxOutputTokens: maxTokens },
    });
    const res = await model.generateContent(fullPrompt);
    const output = res.response.text();
    const tokens = res.response.usageMetadata
      ? res.response.usageMetadata.totalTokenCount
      : undefined;
    return { output, tokens };
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}