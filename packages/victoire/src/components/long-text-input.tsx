import React, { useState, useEffect, useCallback } from 'react';
import { Text, useStdin } from 'ink';

interface LongTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  focus?: boolean;
}

export function LongTextInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = '',
  focus = true 
}: LongTextInputProps) {
  const { stdin, setRawMode } = useStdin();
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleInput = useCallback((data: Buffer) => {
    const input = data.toString();
    
    if (input === '\r' || input === '\n') {
      onSubmit();
      return;
    }

    if (input === '\x7f' || input === '\b') {
      if (internalValue.length > 0) {
        const newValue = internalValue.slice(0, -1);
        setInternalValue(newValue);
        onChange(newValue);
      }
      return;
    }

    if (input === '\x03' || input === '\x04') {
      process.exit(0);
    }

    if (input.charCodeAt(0) === 27) {
      return;
    }

    const newValue = internalValue + input;
    setInternalValue(newValue);
    onChange(newValue);
  }, [internalValue, onChange, onSubmit]);

  useEffect(() => {
    if (!focus || !stdin) return;

    setRawMode(true);
    stdin.on('data', handleInput);

    return () => {
      stdin.off('data', handleInput);
      setRawMode(false);
    };
  }, [focus, stdin, setRawMode, handleInput]);

  const displayValue = internalValue || placeholder;
  const isPlaceholder = !internalValue && placeholder;
  
  const maxLineLength = 80;
  let displayLines: string[] = [];
  
  if (displayValue.length > maxLineLength) {
    for (let i = 0; i < displayValue.length; i += maxLineLength) {
      displayLines.push(displayValue.slice(i, i + maxLineLength));
    }
  } else {
    displayLines = [displayValue];
  }

  return (
    <Text dimColor={isPlaceholder ? true : undefined}>
      {displayLines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && '\n'}
          {line}
          {index === displayLines.length - 1 && focus && !isPlaceholder ? '█' : ''}
        </React.Fragment>
      ))}
    </Text>
  );
}