import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import type { DefaultProvider } from '@victoire.run/core';

export interface Settings {
  $schema?: string;
  provider: DefaultProvider;
  model?: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
}

const CONFIG_DIR = path.join(os.homedir(), '.victoire');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

export async function loadSettings(): Promise<Settings | null> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(
    SETTINGS_FILE,
    JSON.stringify(
      {
        $schema: 'https://victoire.run/schema.json',
        ...settings,
      },
      null,
      2,
    ),
  );
}

export function hasConfiguredApiKey(settings: Settings): boolean {
  const { provider, apiKeys } = settings;
  const apiKey = apiKeys[provider];
  return apiKey !== undefined && apiKey !== null && apiKey !== '';
}