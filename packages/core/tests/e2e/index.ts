import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import dotenv from 'dotenv';
import { openai } from '@ai-sdk/openai';
import { pierre } from '../../src/core/client.js';

// Load environment variables
dotenv.config();

describe('pierre e2e tests', () => {
  test('should make real API call if key available', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⏭️  Skipping live API test - no OPENAI_API_KEY');
      return;
    }

    const model = openai('gpt-4o-mini'); // Direct AI SDK usage
    const client = pierre(model);
    
    const response = await client.generateText({
      messages: [
        {
          role: 'user',
          content: 'Say "Pierre core test successful!" - no tools needed.'
        }
      ]
    });
    
    assert.ok(response.text);
    assert.ok(response.text.includes('Pierre') || response.text.includes('successful'));
  });

  test('should handle streaming if key available', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⏭️  Skipping streaming test - no OPENAI_API_KEY');
      return;
    }

    const model = openai('gpt-4o-mini');
    const client = pierre(model);
    const chunks: string[] = [];
    
    const result = client.streamText({
      messages: [
        {
          role: 'user',
          content: 'Count: 1, 2, 3 - no tools needed.'
        }
      ]
    });

    // Collect streaming chunks
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }
    
    assert.ok(chunks.length > 0, 'Should receive text chunks');
    
    const finalText = await result.text;
    assert.ok(finalText.length > 0, 'Should have final text');
  });

  test('should use tools with AI if key available', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⏭️  Skipping tools test - no OPENAI_API_KEY');
      return;
    }

    const model = openai('gpt-4o-mini');
    const client = pierre(model);
    
    const response = await client.generateText({
      messages: [
        {
          role: 'user',
          content: 'List the contents of the current directory and tell me what you find. Use the appropriate tool.'
        }
      ]
    });
    
    // Should have tool calls since we explicitly asked to use tools
    assert.ok(response.toolCalls && response.toolCalls.length > 0, 'Should have used at least one tool');
    assert.ok(response.toolResults && response.toolResults.length > 0, 'Should have tool results');
  });
});