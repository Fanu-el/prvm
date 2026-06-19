# prvm — Prompt Version Manager

[![npm version](https://img.shields.io/npm/v/@fanu-el/prvm.svg)](https://www.npmjs.com/package/@fanu-el/prvm)
[![downloads](https://img.shields.io/npm/dm/@fanu-el/prvm)](https://www.npmjs.com/package/@fanu-el/prvm)
![license](https://img.shields.io/npm/l/@fanu-el/prvm)

Track, test, and manage LLM prompt versions with confidence.

## Features

- **Version Control** — Save and track multiple versions of your prompts
- **Batch Testing** — Run prompts against multiple inputs and compare results
- **Cross-Provider Support** — Works with Anthropic, OpenAI, and Google Gemini
- **Template Variables** — Use `{{placeholders}}` in prompts for dynamic content
- **Import/Export** — Share prompts as JSON files
- **Configurable** — Set defaults for provider, model, temperature, and max_tokens

## Installation

```bash
npm install -g @fanu-el/prvm
```

### Prerequisites

- Node.js 18+ 
- API key for your chosen provider (Anthropic, OpenAI, or Google Gemini)

## Quick Start

### 1. Initialize

```bash
# Set up prvm in your project directory
prvm init

# Configure your default provider and model
prvm config --provider anthropic --model claude-sonnet-4-6 --temperature 0.7
```

### 2. Save a Prompt

Create a prompt file `prompts/summarize.txt`:
```
Please summarize the following text in {{style}} style:

{{content}}
```

Save it:
```bash
prvm save summarize prompts/summarize.txt -n "Initial version"
```

### 3. Test with Template Variables

Create an input file `inputs.json`:
```json
{
  "style": "professional",
  "content": "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once."
}
```

Run the test:
```bash
prvm test summarize -i inputs.json
```

### 4. Batch Eval

Create an eval file `eval-inputs.json`:
```json
[
  { "style": "casual", "content": "First text to summarize..." },
  { "style": "formal", "content": "Second text to summarize..." },
  { "style": "technical", "content": "Third text to summarize..." }
]
```

Run batch eval:
```bash
prvm eval summarize eval-inputs.json
```

## Commands

### Prompt Management

| Command | Description |
|---------|-------------|
| `prvm save <name> <file>` | Save a new prompt or new version |
| `prvm list` | List all saved prompts |
| `prvm show <name> [version]` | Show prompt details |
| `prvm use <name> <version>` | Set active version |
| `prvm rollback <name>` | Revert to previous version |
| `prvm diff <name>` | Compare versions |
| `prvm history <name>` | Show version history |
| `prvm current <name>` | Show active version content |

### Testing & Evaluation

| Command | Description |
|---------|-------------|
| `prvm test <name> [version]` | Test prompt with input file |
| `prvm eval <name> <file>` | Batch eval with multiple inputs |

### Configuration

| Command | Description |
|---------|-------------|
| `prvm config --show` | View current config |
| `prvm config --provider <p>` | Set default provider |
| `prvm config --model <m>` | Set default model |
| `prvm config --temperature <t>` | Set default temperature |
| `prvm config --max-tokens <n>` | Set default max tokens |
| `prvm config --max-runs <n>` | Set max test runs to keep |

### Import/Export

| Command | Description |
|---------|-------------|
| `prvm export <name> <outFile>` | Export prompt to JSON |
| `prvm import <file>` | Import prompt from JSON |

### Utilities

| Command | Description |
|---------|-------------|
| `prvm init` | Initialize prvm in current directory |
| `prvm gitignore --add` | Add .prompts to .gitignore |

## Template Variables

Use `{{variable}}` syntax in your prompts to create dynamic templates:

**Prompt file:**
```
Act as a {{role}} and {{task}} the following:

{{content}}
```

**Input JSON:**
```json
{
  "role": "senior editor",
  "task": "proofread and improve",
  "content": "Your text here..."
}
```

The variables will be substituted before sending to the LLM.

## Configuration

### Environment Variables

Set your API keys as environment variables:

```bash
# Anthropic
export ANTHROPIC_API_KEY=your-key

# OpenAI
export OPENAI_API_KEY=your-key

# Google Gemini
export GOOGLE_API_KEY=your-key
```

### Config File

After `prvm init`, a `.prompts/config.json` file is created:

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "temperature": 0.7,
  "max_runs_per_version": 20,
  "max_tokens": 4096
}
```

### Override Options

Most commands accept override options:

```bash
# Override temperature for a single test
prvm test my-prompt -i input.json --temperature 0.5

# Override model and max_tokens
prvm test my-prompt -i input.json --model gpt-4 --max-tokens 2048

# Override provider
prvm eval my-prompt inputs.json --provider openai
```

## Examples

See the [examples/](examples/) directory for complete workflows including content creation pipelines, A/B testing, and multi-provider comparisons.

### A/B Test Prompt Versions

```bash
# Save two versions
prvm save summarizer v1-prompt.txt
prvm save summarizer v2-prompt.txt

# Test both against same inputs
prvm eval summarizer v1 inputs.json
prvm eval summarizer v2 inputs.json

# Compare results
prvm diff summarizer
```

### Multi-Provider Testing

```bash
# Test with different providers
prvm test summarizer -i input.json --provider anthropic --model claude-sonnet-4-6
prvm test summarizer -i input.json --provider openai --model gpt-4
prvm test summarizer -i input.json --provider gemini --model gemini-pro
```

### Share Prompts

```bash
# Export
prvm export summarizer summarizer.json

# Share the file, then import elsewhere
prvm import summarizer.json
```

## File Structure

```
your-project/
├── .prompts/
│   ├── config.json          # Global configuration
│   ├── summarizer/
│   │   ├── meta.json        # Prompt metadata
│   │   ├── v1.json          # Version 1
│   │   └── v2.json          # Version 2
│   └── translator/
│       ├── meta.json
│       └── v1.json
├── prompts/                  # Your prompt files (optional)
│   ├── summarizer.txt
│   └── translator.txt
└── inputs/                   # Test input files (optional)
    ├── test1.json
    └── eval.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

## License

MIT