# @victoire.run/core

🏆 **Any Provider. Any Model. Total Control.**

Core AI engine for Victoire - the universal AI agent with complete provider flexibility.

## Installation

```bash
npm install @victoire.run/core
```

## Usage

```typescript
import { victoire, defaultProviders } from '@victoire.run/core';
import { openai } from '@ai-sdk/openai';

// Create client with any model
const model = openai('gpt-4o');
const client = victoire(model);

// Generate text
const response = await client.generateText({
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Stream text  
const stream = client.streamText({
  messages: [{ role: 'user', content: 'Count to 3' }]
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Features

🔄 **Any Provider**
- OpenAI, Anthropic, Google
- Easy provider switching
- Soon: Local LLMs

🧠 **Any Model** 
- Use the best model for each task
- No vendor lock-in
- Future-proof architecture

⚡ **Built-in Tools**
- File system operations
- Shell commands  
- Web search
- Memory management

## API Reference

### `victoire(model: LanguageModel)`

Creates a Victoire client with the given language model.

**Returns**: Object with `generateText` and `streamText` methods.

### `defaultProviders`

Configuration for supported AI providers:

```typescript
const providers = {
  openai: { name: 'OpenAI', url: '...', prefix: 'sk-xxx', latestModels: [...] },
  anthropic: { name: 'Anthropic', url: '...', prefix: 'sk-ant-xxx', latestModels: [...] },
  google: { name: 'Google', url: '...', prefix: 'AIza-xxx', latestModels: [...] }
};
```

## License

MIT - see [LICENSE](../../LICENSE) for details.