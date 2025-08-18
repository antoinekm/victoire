import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { defaultProviders, type DefaultProvider } from '@victoire/core';

interface ApiKeySetupProps {
  provider: DefaultProvider;
  onSubmit: (apiKey: string) => void;
  onBack?: () => void;
}

export function ApiKeySetup({ provider, onSubmit, onBack }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');

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
          </Box>
          
          <Box>
            <Text>{'>'}{'  '}</Text>
            <TextInput
              value={apiKey}
              onChange={setApiKey}
              onSubmit={handleSubmit}
              placeholder={`Paste your API Key here (${defaultProviders[provider].prefix})`}
            />
          </Box>
        </Box>
      </Box>
      
      <Box>
        <Text>{'  '}</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    </Box>
  );
}