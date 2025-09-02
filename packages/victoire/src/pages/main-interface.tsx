import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { victoire } from '@victoire.run/core';
import { stepCountIs, ModelMessage } from 'ai';
import type { StepResult, ToolSet } from 'ai';
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


type StepMessage = {
  type: 'step';
  toolName: string;
  success: boolean;
  summary: string;
};

type Message = ModelMessage | StepMessage;

export function MainInterface({ cwd }: MainInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentThinkingMessage, setCurrentThinkingMessage] = React.useState('');
  const [animationFrame, setAnimationFrame] = React.useState(0);

  const hexagonFrames = ['⬢', '⬡', '⬣'];
  const [abortController, setAbortController] = React.useState<AbortController | null>(null);

  React.useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % hexagonFrames.length);
    }, 300);
    
    return () => clearInterval(interval);
  }, [isLoading, hexagonFrames.length]);

  useInput((input, key) => {
    if (key.escape && isLoading && abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
      const lastUserMessage = messages.filter(msg => 'role' in msg && msg.role === 'user').pop();
      const interruptMessage: ModelMessage = { 
        role: 'assistant', 
        content: [{ type: 'text', text: `INTERRUPT:${lastUserMessage && 'content' in lastUserMessage ? (typeof lastUserMessage.content === 'string' ? lastUserMessage.content : 'message') : ''}` }]
      };
      setMessages(prev => [...prev, interruptMessage]);
    }
  });

  const handleSubmit = async (value: string) => {
    if (value === '/quit') {
      process.exit(0);
    }
    
    if (!value.trim()) return;
    
    const userMessage: ModelMessage = { role: 'user', content: value };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    const randomMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)] || 'Thinking';
    setCurrentThinkingMessage(randomMessage);
    
    const controller = new AbortController();
    setAbortController(controller);
    setAnimationFrame(0);
    setIsLoading(true);
    
    try {
      const settings = await loadSettings();
      if (!settings) {
        throw new Error('No settings found');
      }
      
      const model = createLanguageModel(settings);
      const agent = victoire(model);
      
      const modelMessages = [...messages, userMessage].filter((msg): msg is ModelMessage => 'role' in msg);
      const conversationContext = modelMessages
        .map(msg => {
          const role = msg.role === 'user' ? 'Human' : 'Assistant';
          const content = typeof msg.content === 'string' 
            ? msg.content 
            : msg.content.map(part => part.type === 'text' ? part.text : '').join('');
          return `${role}: ${content}`;
        })
        .join('\n\n');
      
      const result = await agent.generateText({
        prompt: conversationContext,
        stopWhen: [stepCountIs(10)],
        onStepFinish: (step: StepResult<ToolSet>) => {
          for (const content of step.content) {
            if (content.type === 'tool-call') {
              const stepMessage: StepMessage = {
                type: 'step',
                toolName: content.toolName,
                success: true,
                summary: 'Starting...'
              };
              setMessages(prev => [...prev, stepMessage]);
            } else if (content.type === 'tool-result') {
              setMessages(prev => {
                const newMessages = [...prev];
                for (let i = newMessages.length - 1; i >= 0; i--) {
                  const msg = newMessages[i];
                  if (msg && 'type' in msg && msg.type === 'step' && msg.toolName.startsWith(content.toolName)) {
                    const output = content.output;
                    const success = output && typeof output === 'object' && 'success' in output ? Boolean(output.success) : true;
                    const summary = output && typeof output === 'object' && 'message' in output && typeof output.message === 'string' 
                      ? output.message 
                      : success ? 'Completed' : 'Failed';
                    
                    const displayArg = output && typeof output === 'object' && 'display' in output ? output.display : '';
                    const displayName = displayArg ? `${content.toolName}(${displayArg})` : content.toolName;
                    
                    newMessages[i] = {
                      ...msg,
                      toolName: displayName,
                      success,
                      summary
                    };
                    break;
                  }
                }
                return newMessages;
              });
            }
          }
        }
      });
      
      const assistantMessage: ModelMessage = { role: 'assistant', content: [{ type: 'text', text: result.text }] };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        
      } else {
        const errorMessage: ModelMessage = { 
          role: 'assistant', 
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
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

      {messages.map((msg, i) => {
        const isStep = 'type' in msg && msg.type === 'step';
        const isAssistant = 'role' in msg && msg.role === 'assistant';
        
        return (
          <Box key={i} marginRight={2} marginTop={isStep || isAssistant ? 1 : 0} marginBottom={isAssistant ? 1 : 0}>
            {isStep ? (
              <Box flexDirection="column">
                <Text>
                  <Text color={msg.success ? 'green' : 'red'}>⏺ </Text>
                  <Text color="white">{msg.toolName}</Text>
                </Text>
                <Box marginLeft={2}>
                  <Text color="gray">⎿  {msg.summary}</Text>
                </Box>
              </Box>
            ) : 'role' in msg ? (() => {
              const content = typeof msg.content === 'string' 
                ? msg.content 
                : msg.content.map(part => part.type === 'text' ? part.text : '').join('');
              
              if (content.startsWith('INTERRUPT:')) {
                return (
                  <Box flexDirection="column">
                    <Text color="gray">{'> '}{content.slice(10)}</Text>
                    <Box marginLeft={2}>
                      <Text color="redBright">⎿  Interrupted by user</Text>
                    </Box>
                  </Box>
                );
              }
              
              return (
                <Text color={msg.role === 'user' ? 'gray' : 'white'}>
                  {msg.role === 'user' ? '> ' : '⏺ '}{content}
                </Text>
              );
            })() : null}
          </Box>
        );
      })}
      
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