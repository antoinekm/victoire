import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings, hasConfiguredApiKey, type Settings } from './services/settings.js';
import { ProviderSelection } from './pages/provider-selection.js';
import { ApiKeySetup } from './pages/api-key-setup.js';
import { ModelSelection } from './pages/model-selection.js';
import { MainInterface } from './pages/main-interface.js';
import type { DefaultProvider } from '@victoire.run/core';

type AppState = 
  | { type: 'loading' }
  | { type: 'provider-selection' }
  | { type: 'api-key-setup'; provider: DefaultProvider }
  | { type: 'model-selection'; provider: DefaultProvider; apiKey: string }
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
    setState({ type: 'model-selection', provider: state.provider, apiKey });
  };

  const handleModelSelect = async (model: string) => {
    if (state.type !== 'model-selection') return;
    
    const settings: Settings = {
      provider: state.provider,
      model,
      apiKeys: {
        [state.provider]: state.apiKey,
      },
    };
    
    await saveSettings(settings);
    setState({ type: 'main', settings });
  };

  const handleModelGoBack = () => {
    if (state.type !== 'model-selection') return;
    setState({ type: 'api-key-setup', provider: state.provider });
  };

  switch (state.type) {
    case 'loading':
      return null;
    case 'provider-selection':
      return <ProviderSelection onSelect={handleProviderSelect} />;
    case 'api-key-setup':
      return <ApiKeySetup provider={state.provider} onSubmit={handleApiKeySubmit} onBack={handleGoBack} />;
    case 'model-selection':
      return <ModelSelection provider={state.provider} onSelect={handleModelSelect} onBack={handleModelGoBack} />;
    case 'main':
      return <MainInterface cwd={process.cwd()} />;
  }
}