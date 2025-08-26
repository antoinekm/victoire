import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { victoire } from '@victoire.run/core';
import { createLanguageModel } from '../services/ai-models.js';
import { loadSettings } from '../services/settings.js';
import { VERSION } from '../utils/version.js';

interface MainInterfaceProps {
  cwd: string;
}

const thinkingMessages = [
  'Puzzling',
  'Pondering',
  'Contemplating',
  'Processing',
  'Analyzing',
  'Reflecting',
  'Considering',
  'Exploring',
  'Synthesizing',
  'Deliberating'
];

export function MainInterface({ cwd }: MainInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentThinkingMessage, setCurrentThinkingMessage] = React.useState('');
  const [animationFrame, setAnimationFrame] = React.useState(0);

  const hexagonFrames = ['⬢', '⬡', '⬣'];
  const [abortController, setAbortController] = React.useState<AbortController | null>(null);

  // Animation effect for hexagon spinning
  React.useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % hexagonFrames.length);
    }, 300); // Change frame every 300ms
    
    return () => clearInterval(interval);
  }, [isLoading, hexagonFrames.length]);

  useInput((input, key) => {
    if (key.escape && isLoading && abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
      // Find the last user message to show with the interruption
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      const interruptMessage = { 
        role: 'assistant' as const, 
        content: `INTERRUPT:${lastUserMessage?.content || ''}`
      };
      setMessages(prev => [...prev, interruptMessage]);
    }
  });

  const handleSubmit = async (value: string) => {
    if (value === '/quit') {
      process.exit(0);
    }
    
    if (!value.trim()) return;
    
    const userMessage = { role: 'user' as const, content: value };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Select a random thinking message
    const randomMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    setCurrentThinkingMessage(randomMessage);
    
    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    setAnimationFrame(0); // Reset animation
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
        })),
        abortSignal: controller.signal
      });
      
      const assistantMessage = { role: 'assistant' as const, content: result.text };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, no need to add error message as it's already handled in useInput
      } else {
        const errorMessage = { 
          role: 'assistant' as const, 
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
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
        <Box key={i} marginRight={2} marginY={msg.role === 'assistant' ? 1 : 0}>
          {msg.content.startsWith('INTERRUPT:') ? (
            <Box flexDirection="column">
              <Text color="gray">{'> '}{msg.content.slice(10)}</Text>
              <Box marginLeft={2}>
                <Text color="redBright">⎿  Interrupted by user</Text>
              </Box>
            </Box>
          ) : (
            <Text color={msg.role === 'user' ? 'gray' : 'white'}>
              {msg.role === 'user' ? '> ' : '⏺ '}{msg.content}
            </Text>
          )}
        </Box>
      ))}
      
      {isLoading && (
        <Box marginY={1}>
          <Text color="#ff69b4">{hexagonFrames[animationFrame]} {currentThinkingMessage}…</Text>
          <Text color="gray"> (esc to interrupt)</Text>
        </Box>
      )}

      <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={0}>
        <Text>{'> '}</Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}