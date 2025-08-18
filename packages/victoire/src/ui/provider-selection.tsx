import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { defaultProviders, type DefaultProvider } from '@victoire/core';

interface ProviderSelectionProps {
  onSelect: (provider: DefaultProvider) => void;
}

export function ProviderSelection({ onSelect }: ProviderSelectionProps) {
  const items = Object.entries(defaultProviders).map(([key, value]) => ({
    label: `${value.name} (${value.latestModels.join(', ')})`,
    value: key as DefaultProvider,
  }));

  const handleSelect = (item: { value: string }) => {
    onSelect(item.value as DefaultProvider);
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold><Text color="cyan">⬢</Text> victoire v0.0.1</Text>
      </Box>
      
      <Box>
        <Text>Which AI provider would you like to use?</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>To change this later, run /provider</Text>
      </Box>
      
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select.</Text>
      </Box>
    </Box>
  );
}