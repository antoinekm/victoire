import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings, hasConfiguredApiKey, type Settings } from '../settings.js';
import { ProviderSelection } from './provider-selection.js';
import { ApiKeySetup } from './api-key-setup.js';
import { MainInterface } from './main-interface.js';
import type { DefaultProvider } from '@victoire/core';

type AppState = 
  | { type: 'loading' }
  | { type: 'provider-selection' }
  | { type: 'api-key-setup'; provider: DefaultProvider }
  | { type: 'main'; settings: Settings };

export function App() {
  const [state, setState] = useState<AppState>({ type: 'loading' });

  useEffect(() => {
    loadSettings().then((settings) => {
      if (settings && hasConfiguredApiKey(settings)) {
        setState({ type: 'main', settings });
      } else {
        setState({ type: 'provider-selection' });
      }
    });
  }, []);

  const handleProviderSelect = (provider: DefaultProvider) => {
    setState({ type: 'api-key-setup', provider });
  };

  const handleGoBack = () => {
    setState({ type: 'provider-selection' });
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    if (state.type !== 'api-key-setup') return;
    
    const settings: Settings = {
      provider: state.provider,
      apiKeys: {
        openai: state.provider === 'openai' ? apiKey : null,
        anthropic: state.provider === 'anthropic' ? apiKey : null,
        google: state.provider === 'google' ? apiKey : null,
      },
    };
    
    await saveSettings(settings);
    setState({ type: 'main', settings });
  };

  switch (state.type) {
    case 'loading':
      return null;
    case 'provider-selection':
      return <ProviderSelection onSelect={handleProviderSelect} />;
    case 'api-key-setup':
      return <ApiKeySetup provider={state.provider} onSubmit={handleApiKeySubmit} onBack={handleGoBack} />;
    case 'main':
      return <MainInterface cwd={process.cwd()} />;
  }
}