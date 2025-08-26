import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import type { DefaultProvider } from '@victoire/core';
import type { Settings } from './settings.js';

export function createLanguageModel(settings: Settings): any {
  const { provider, apiKeys } = settings;
  const apiKey = apiKeys[provider];
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`No API key configured for provider: ${provider}`);
  }

  // Set API keys as environment variables for the AI SDK
  switch (provider) {
    case 'openai':
      process.env.OPENAI_API_KEY = apiKey;
      return openai('gpt-4o');
    case 'anthropic':
      process.env.ANTHROPIC_API_KEY = apiKey;
      return anthropic('claude-3-5-sonnet-20241022');
    case 'google':
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      return google('gemini-2.0-flash-exp');
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}