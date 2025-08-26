import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { defaultProviders, type DefaultProvider } from '@victoire.run/core';

interface ModelSelectionProps {
  provider: DefaultProvider;
  onSelect: (model: string) => void;
  onBack?: () => void;
}

export function ModelSelection({ provider, onSelect, onBack }: ModelSelectionProps) {
  const providerConfig = defaultProviders[provider];
  const items = providerConfig.latestModels.map((model) => ({
    label: model,
    value: model,
  }));

  const handleSelect = (item: { value: string }) => {
    onSelect(item.value);
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#ff69b4" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold><Text color="#ff69b4">⬢</Text> victoire › {provider}</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>Which model would you like to use?</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>Choose the AI model for your {providerConfig.name} setup</Text>
      </Box>
      
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select.</Text>
        {onBack && <Text dimColor>Press Escape to go back.</Text>}
      </Box>
    </Box>
  );
}