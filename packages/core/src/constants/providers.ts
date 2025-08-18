export const defaultProviders = {
  openai: {
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-xxx',
    name: 'OpenAI',
    latestModels: ['gpt-5', 'o4-mini', 'o3'],
  },
  anthropic: {
    url: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-xxx',
    name: 'Anthropic',
    latestModels: ['Claude Opus 4.1', 'Claude Sonnet 4'],
  },
  google: {
    url: 'https://makersuite.google.com/app/apikey',
    prefix: 'AIza-xxx',
    name: 'Google',
    latestModels: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash'],
  },
} as const;

export type DefaultProvider = keyof typeof defaultProviders;