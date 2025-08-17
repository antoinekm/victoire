# @pierre/core

AI Assistant Core with Development Tools - Built with Vercel AI SDK

## Features

- **Native AI SDK Integration**: Direct use of Vercel AI SDK providers
- **Development Tools**: File operations, shell commands, code search
- **Streaming Support**: Real-time response streaming
- **TypeScript**: Full type safety

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { pierre } from '@pierre/core';

// Create client with AI SDK model
const model = openai('gpt-4o');
const client = pierre(model);

const response = await client.generateText([
  { role: 'user', content: 'List the files in the current directory' }
]);

console.log(response.text);
```

## Multi-Provider Support

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic'; 
import { google } from '@ai-sdk/google';
import { pierre } from '@pierre/core';

// Use any AI SDK provider
const openaiClient = pierre(openai('gpt-4o'));
const anthropicClient = pierre(anthropic('claude-3-5-sonnet-20241022'));
const googleClient = pierre(google('gemini-1.5-pro'));
```

## Available Tools

- **readFile**: Read file contents
- **writeFile**: Write content to files
- **shell**: Execute shell commands
- **listDirectory**: List directory contents
- **searchFiles**: Search files with glob patterns
- **grep**: Search text within files

## Text Generation & Streaming

```typescript
// Generate text
const response = await client.generateText([
  { role: 'user', content: 'Explain TypeScript' }
]);

// Stream text
const chunks: string[] = [];
await client.streamText([
  { role: 'user', content: 'Explain how to use streams' }
], {
  onText: (chunk) => {
    chunks.push(chunk);
    process.stdout.write(chunk);
  }
});

// Generate structured objects
import { z } from 'zod';

const analysis = await client.generateObject([
  { role: 'user', content: 'Analyze this codebase' }
], {
  schema: z.object({
    language: z.string(),
    complexity: z.enum(['low', 'medium', 'high']),
    files: z.array(z.string())
  })
});

// Stream structured objects
await client.streamObject([
  { role: 'user', content: 'Generate file list' }
], {
  schema: fileSchema,
  onObject: (partial) => console.log('Partial:', partial)
});
```

## Environment Variables

The AI SDK providers handle environment variables automatically:
- `OPENAI_API_KEY`: For OpenAI models
- `ANTHROPIC_API_KEY`: For Anthropic models  
- `GOOGLE_API_KEY`: For Google AI models

Or pass API keys explicitly:
```typescript
const model = openai('gpt-4o', { apiKey: 'your-key' });
```