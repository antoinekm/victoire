import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import type { Settings } from './settings.js';

export function createLanguageModel(settings: Settings): LanguageModel {
  const { provider, apiKeys } = settings;
  const apiKey = apiKeys[provider];
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`No API key configured for provider: ${provider}`);
  }

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