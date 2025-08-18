import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { defaultProviders, type DefaultProvider } from '@victoire/core';

interface ApiKeySetupProps {
  provider: DefaultProvider;
  onSubmit: (apiKey: string) => void;
}

export function ApiKeySetup({ provider, onSubmit }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = () => {
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold><Text color="cyan">⬢</Text> victoire › {provider} setup</Text>
      </Box>
      
      <Box marginBottom={1} flexDirection="column">
        <Text>Get your API key from:</Text>
        <Text color="cyan">{defaultProviders[provider].url}</Text>
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
  );
}