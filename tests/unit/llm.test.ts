// Create mock functions that can be accessed across the test
const mockAnthropicCreate = jest.fn();
const mockOpenAICreate = jest.fn();
const mockGeminiGenerate = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGeminiGenerate,
});

// Mock the LLM SDKs
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate,
    },
  }));
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

import { runPrompt } from '../../src/lib/llm';
import { LLMRunConfig } from '../../src/types';

describe('LLM', () => {
  const mockConfig: LLMRunConfig = {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicCreate.mockReset();
    mockOpenAICreate.mockReset();
    mockGeminiGenerate.mockReset();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GOOGLE_API_KEY = 'test-google-key';
  });

  afterAll(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  describe('runPrompt with Anthropic', () => {
    it('should call Anthropic API and return output', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const result = await runPrompt('You are helpful.', 'Say hello.', mockConfig);

      expect(result.output).toBe('Hello from Claude!');
      expect(result.tokens).toBe(15);
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096, // default
        temperature: 0.7,
        messages: [{ role: 'user', content: 'You are helpful.\n\nSay hello.' }],
      });
    });

    it('should use custom max_tokens when provided', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const config: LLMRunConfig = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_tokens: 2048,
      };

      await runPrompt('You are helpful.', 'Say hello.', config);

      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{ role: 'user', content: 'You are helpful.\n\nSay hello.' }],
      });
    });

    it('should handle empty content from Anthropic', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'tool_use', id: '1', name: 'test' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const result = await runPrompt('You are helpful.', 'Test.', mockConfig);

      expect(result.output).toBe('');
    });
  });

  describe('runPrompt with OpenAI', () => {
    it('should call OpenAI API and return output', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello from GPT!' } }],
        usage: { total_tokens: 20 },
      });

      const config: LLMRunConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
      };

      const result = await runPrompt('You are helpful.', 'Say hello.', config);

      expect(result.output).toBe('Hello from GPT!');
      expect(result.tokens).toBe(20);
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        max_tokens: 4096, // default
        temperature: 0.5,
        messages: [{ role: 'user', content: 'You are helpful.\n\nSay hello.' }],
      });
    });

    it('should use custom max_tokens when provided', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello!' } }],
        usage: { total_tokens: 10 },
      });

      const config: LLMRunConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 1024,
      };

      await runPrompt('You are helpful.', 'Say hello.', config);

      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        max_tokens: 1024,
        temperature: 0.5,
        messages: [{ role: 'user', content: 'You are helpful.\n\nSay hello.' }],
      });
    });

    it('should handle undefined usage from OpenAI', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello!' } }],
        usage: undefined,
      });

      const config: LLMRunConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
      };

      const result = await runPrompt('You are helpful.', 'Say hello.', config);

      expect(result.output).toBe('Hello!');
      expect(result.tokens).toBeUndefined();
    });

    it('should handle empty content from OpenAI', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
        usage: { total_tokens: 10 },
      });

      const config: LLMRunConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
      };

      const result = await runPrompt('You are helpful.', 'Say hello.', config);

      expect(result.output).toBe('');
    });
  });

  describe('runPrompt with Gemini', () => {
    it('should call Gemini API and return output', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => 'Hello from Gemini!',
          usageMetadata: { totalTokenCount: 25 },
        },
      });

      const config: LLMRunConfig = {
        provider: 'gemini',
        model: 'gemini-pro',
        temperature: 0.8,
      };

      const result = await runPrompt('You are helpful.', 'Say hello.', config);

      expect(result.output).toBe('Hello from Gemini!');
      expect(result.tokens).toBe(25);
      expect(mockGeminiGenerate).toHaveBeenCalledWith('You are helpful.\n\nSay hello.');
    });

    it('should use custom max_tokens when provided', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => 'Hello!',
          usageMetadata: { totalTokenCount: 10 },
        },
      });

      const config: LLMRunConfig = {
        provider: 'gemini',
        model: 'gemini-pro',
        temperature: 0.8,
        max_tokens: 2048,
      };

      await runPrompt('You are helpful.', 'Say hello.', config);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro',
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      });
    });

    it('should handle undefined usageMetadata from Gemini', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => 'Hello!',
          usageMetadata: undefined,
        },
      });

      const config: LLMRunConfig = {
        provider: 'gemini',
        model: 'gemini-pro',
        temperature: 0.8,
      };

      const result = await runPrompt('You are helpful.', 'Say hello.', config);

      expect(result.output).toBe('Hello!');
      expect(result.tokens).toBeUndefined();
    });
  });

  describe('runPrompt with unknown provider', () => {
    it('should throw error for unknown provider', async () => {
      const config: LLMRunConfig = {
        provider: 'unknown' as any,
        model: 'some-model',
        temperature: 0.5,
      };

      await expect(runPrompt('Test prompt.', 'Input.', config)).rejects.toThrow('Unknown provider: unknown');
    });
  });
});