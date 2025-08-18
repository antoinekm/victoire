import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MainInterfaceProps {
  cwd: string;
}

export function MainInterface({ cwd }: MainInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<string[]>([]);

  const handleSubmit = (value: string) => {
    if (value === '/quit') {
      process.exit(0);
    }
    
    // TODO: Handle other commands and integrate with @victoire/core
    setMessages([...messages, `> ${value}`]);
    setInput('');
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold><Text color="cyan">⬢</Text> victoire v0.0.1</Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text>/help for help, /status for your current setup</Text>
          </Box>
          
          <Text dimColor>cwd: {cwd}</Text>
        </Box>
      </Box>

      {messages.map((msg, i) => (
        <Box key={i} marginX={2}>
          <Text>{msg}</Text>
        </Box>
      ))}

      <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={0}>
        <Text>{'> '}</Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}