# Example Workflow: Content Creation

This example demonstrates using prvm to develop and test prompts for content creation.

## Scenario

You're building a content pipeline that:
1. Generates blog post outlines from ideas
2. Writes first drafts from outlines
3. Edits and polishes drafts

## Step 1: Create the Outline Generator

### Save the prompt

Create `outline-prompt.txt`:
```
You are a professional content strategist. Create a detailed blog post outline for the following topic:

{{topic}}

Target audience: {{audience}}
Tone: {{tone}}

Provide:
1. A compelling title
2. 3-5 main sections with subsections
3. Key points to cover in each section
4. Suggested word count per section
```

```bash
prvm save content-outline outline-prompt.txt -n "Initial outline prompt"
```

### Test with different inputs

Create `outline-tests.json`:
```json
[
  {
    "topic": "The Future of Remote Work",
    "audience": "HR professionals and team managers",
    "tone": "professional but approachable"
  },
  {
    "topic": "Getting Started with TypeScript",
    "audience": "JavaScript developers",
    "tone": "technical and educational"
  },
  {
    "topic": "Healthy Meal Prep for Busy Professionals",
    "audience": "working adults 25-40",
    "tone": "friendly and encouraging"
  }
]
```

```bash
prvm eval content-outline outline-tests.json
```

### Iterate on the prompt

If the outlines aren't detailed enough, update the prompt:

```bash
prvm save content-outline outline-v2.txt -n "Added more specific section requirements"
```

Compare versions:
```bash
prvm diff content-outline
```

## Step 2: Create the Draft Writer

### Save the prompt

Create `draft-prompt.txt`:
```
You are an experienced content writer. Write a comprehensive blog post draft based on the following outline:

{{outline}}

Additional context:
- Brand voice: {{brand_voice}}
- Include relevant examples
- Use subheadings for each section
- Write in a {{writing_style}} style
- Target length: approximately {{target_length}} words
```

```bash
prvm save content-draft draft-prompt.txt
```

### Test the draft writer

```bash
prvm test content-draft -i draft-test-input.json
```

## Step 3: Create the Editor

### Save the prompt

Create `editor-prompt.txt`:
```
You are a professional editor. Review and improve the following draft:

{{draft}}

Focus on:
1. Grammar and spelling
2. Clarity and flow
3. Engagement and readability
4. SEO optimization (natural keyword integration)
5. Consistency in tone and style

Provide:
- The edited version
- A summary of major changes
- Suggestions for improvement
```

```bash
prvm save content-editor editor-prompt.txt
```

## Step 4: A/B Test Different Approaches

### Test different editor styles

```bash
# Version 1: Light editing
prvm save content-editor editor-light.txt -n "Light touch editing"
# Version 2: Heavy editing  
prvm save content-editor editor-heavy.txt -n "Comprehensive rewriting"

# Test both against same inputs
prvm eval content-editor v1 editor-tests.json
prvm eval content-editor v2 editor-tests.json

# Compare results
prvm diff content-editor
```

## Step 5: Export and Share

### Export your best prompts

```bash
# Export the complete workflow
prvm export content-outline content-outline.json
prvm export content-draft content-draft.json
prvm export content-editor content-editor.json

# Share with team members
# They can import with:
prvm import content-outline.json
```

## Tips

### 1. Use Template Variables Effectively
Template variables make prompts reusable across different contexts. Think about what parameters might change and make them variables.

### 2. Test Incrementally
Don't wait until you have the "perfect" prompt. Test early and often:
```bash
prvm test my-prompt -i test-input.json
```

### 3. Keep Versions Organized
Use meaningful notes when saving versions:
```bash
prvm save my-prompt new-version.txt -n "Added chain-of-thought reasoning"
```

### 4. Compare Before Deciding
Use diff to understand what changed:
```bash
prvm diff my-prompt
```

### 5. Batch Test Important Changes
Before deploying a new version, test it against a representative sample:
```bash
prvm eval my-prompt v2 comprehensive-tests.json