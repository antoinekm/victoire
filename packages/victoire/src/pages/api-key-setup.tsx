import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LongTextInput } from '../components/long-text-input.js';
import { defaultProviders, type DefaultProvider } from '@victoire.run/core';

interface ApiKeySetupProps {
  provider: DefaultProvider;
  onSubmit: (apiKey: string) => void;
  onBack?: () => void;
}

export function ApiKeySetup({ provider, onSubmit, onBack }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 
                       provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 
                       provider === 'google' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : '';
    
    const envKey = process.env[envVarName];
    if (envKey) {
      setApiKey(envKey);
    }
  }, [provider]);

  const handleSubmit = () => {
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  useEffect(() => {
    const handleKeyPress = (data: string) => {
      if (data === '\u001b' && onBack) {
        onBack();
      }
    };

    process.stdin.setRawMode?.(true);
    process.stdin.on('data', handleKeyPress);

    return () => {
      process.stdin.setRawMode?.(false);
      process.stdin.off('data', handleKeyPress);
    };
  }, [onBack]);

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="#ff69b4" paddingX={2} paddingY={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold><Text color="#ff69b4">⬢</Text> victoire › {provider} setup</Text>
          </Box>
          
          <Box marginBottom={1} flexDirection="column">
            <Text>Get your API key from:</Text>
            <Text color="#ff69b4">{defaultProviders[provider].url}</Text>
            {provider === 'openai' && (
              <Box marginTop={1}>
                <Text dimColor>💡 Tip: For long API keys, set OPENAI_API_KEY env variable before running victoire</Text>
              </Box>
            )}
          </Box>
          
          <Box>
            <Text>{'>'}{'  '}</Text>
            <LongTextInput
              value={apiKey}
              onChange={setApiKey}
              onSubmit={handleSubmit}
              placeholder={`Paste your API Key here (${defaultProviders[provider].prefix})`}
            />
          </Box>
          {apiKey.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>Length: {apiKey.length} chars</Text>
              {provider === 'openai' && apiKey.length < 160 && (
                <Text color="yellow">⚠️  OpenAI keys are typically ~164 chars. Your key might be truncated.</Text>
              )}
            </Box>
          )}
        </Box>
      </Box>
      
      <Box>
        <Text>{'  '}</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    </Box>
  );
}