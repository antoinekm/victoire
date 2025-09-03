import React from 'react';
import { Box, Text } from 'ink';

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        elements.push(<Box key={i} height={1}></Box>);
        continue;
      }
      
      if (line.startsWith('# ')) {
        elements.push(
          <Box key={i} marginY={1}>
            <Text bold color="cyan">{line.slice(2)}</Text>
          </Box>
        );
      }
      else if (line.startsWith('## ')) {
        elements.push(
          <Box key={i} marginY={1}>
            <Text bold color="blue">{line.slice(3)}</Text>
          </Box>
        );
      }
      else if (line.startsWith('### ')) {
        elements.push(
          <Box key={i}>
            <Text bold color="magenta">{line.slice(4)}</Text>
          </Box>
        );
      }
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <Box key={i}>
            <Text color="gray">• </Text>
            <Text>{parseInlineMarkdown(line.slice(2))}</Text>
          </Box>
        );
      }
      else if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && lines[i] !== undefined && !lines[i]!.startsWith('```')) {
          codeLines.push(lines[i]!);
          i++;
        }
        elements.push(
          <Box key={i} marginY={1} paddingX={2} borderStyle="single" borderColor="gray">
            <Box flexDirection="column">
              {codeLines.map((codeLine, j) => (
                <Text key={j} color="green">{codeLine}</Text>
              ))}
            </Box>
          </Box>
        );
      }
      else if (line.trim()) {
        elements.push(
          <Box key={i} marginY={0}>
            <Text>{parseInlineMarkdown(line)}</Text>
          </Box>
        );
      }
    }
    
    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    let processedText = text;
    const parts: React.ReactNode[] = [];
    let keyIndex = 0;
    
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkMap: { [key: string]: React.ReactNode } = {};
    let linkCounter = 0;
    
    processedText = processedText.replace(linkRegex, (match, linkText, url) => {
      const placeholder = `__LINK_${linkCounter}__`;
      linkMap[placeholder] = (
        <Text key={`link-${keyIndex++}`}>
          <Text>{linkText}</Text>
          <Text> (</Text>
          <Text color="blueBright">{url}</Text>
          <Text>)</Text>
        </Text>
      );
      linkCounter++;
      return placeholder;
    });
    
    const urlRegex = /https?:\/\/[^\s]+/g;
    
    processedText = processedText.replace(urlRegex, (match) => {
      if (Object.values(linkMap).some(node => 
        React.isValidElement(node) && JSON.stringify(node).includes(match)
      )) {
        return match;
      }
      
      const placeholder = `__URL_${linkCounter}__`;
      linkMap[placeholder] = (
        <Text key={`url-${keyIndex++}`} color="blueBright">{match}</Text>
      );
      linkCounter++;
      return placeholder;
    });
    
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(processedText)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = processedText.slice(lastIndex, match.index);
        parts.push(...replaceLinksInText(beforeText, linkMap, keyIndex));
        keyIndex += 10;
      }
      parts.push(<Text key={keyIndex++} bold>{match[1]}</Text>);
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < processedText.length) {
      const remainingText = processedText.slice(lastIndex);
      parts.push(...replaceLinksInText(remainingText, linkMap, keyIndex));
    }
    
    if (parts.length > 1) {
      return <>{parts}</>;
    }
    
    return parts[0] || text;
  };

  const replaceLinksInText = (text: string, linkMap: { [key: string]: React.ReactNode }, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    
    for (const [placeholder, linkNode] of Object.entries(linkMap)) {
      if (remainingText.includes(placeholder)) {
        const segments = remainingText.split(placeholder);
        const result: React.ReactNode[] = [];
        
        for (let i = 0; i < segments.length; i++) {
          if (segments[i]) result.push(segments[i]);
          if (i < segments.length - 1) result.push(linkNode);
        }
        
        return result;
      }
    }
    
    return remainingText ? [remainingText] : [];
  };

  
  return (
    <Box flexDirection="column">
      {renderMarkdown(children)}
    </Box>
  );
}