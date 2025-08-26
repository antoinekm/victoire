import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { victoire } from '@victoire.run/core';
import { createLanguageModel } from '../services/ai-models.js';
import { loadSettings } from '../services/settings.js';
import { VERSION } from '../utils/version.js';

interface MainInterfaceProps {
  cwd: string;
}

export function MainInterface({ cwd }: MainInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (value: string) => {
    if (value === '/quit') {
      process.exit(0);
    }
    
    if (!value.trim()) return;
    
    const userMessage = { role: 'user' as const, content: value };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const settings = await loadSettings();
      if (!settings) {
        throw new Error('No settings found');
      }
      
      const model = createLanguageModel(settings);
      const ai = victoire(model);
      
      const result = await ai.generateText({
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });
      
      const assistantMessage = { role: 'assistant' as const, content: result.text };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant' as const, 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="#ff69b4" paddingX={2} paddingY={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold><Text color="#ff69b4">⬢</Text> victoire v{VERSION}</Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text>/help for help, /status for your current setup</Text>
          </Box>
          
          <Text dimColor>cwd: {cwd}</Text>
        </Box>
      </Box>

      {messages.map((msg, i) => (
        <Box key={i} marginX={2} marginY={msg.role === 'assistant' ? 1 : 0}>
          <Text color={msg.role === 'user' ? 'cyan' : 'green'}>
            {msg.role === 'user' ? '> ' : '⭐ '}{msg.content}
          </Text>
        </Box>
      ))}
      
      {isLoading && (
        <Box marginX={2}>
          <Text color="yellow">⏳ Thinking...</Text>
        </Box>
      )}

      <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={0}>
        <Text>{'> '}</Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}