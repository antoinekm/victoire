import { 
  generateText as aiGenerateText, 
  streamText as aiStreamText,
  type LanguageModel
} from 'ai';
import { createDevelopmentTools } from './tools/index.js';

export function victoire(model: LanguageModel) {
  const tools = createDevelopmentTools();

  return {
    generateText: (options: Omit<Parameters<typeof aiGenerateText>[0], 'model' | 'tools'>): ReturnType<typeof aiGenerateText> => {
      return aiGenerateText({
        model,
        tools,
        system: options.system || getDefaultSystemPrompt(),
        ...options,
      });
    },

    streamText: (options: Omit<Parameters<typeof aiStreamText>[0], 'model' | 'tools'>): ReturnType<typeof aiStreamText> => {
      return aiStreamText({
        model,
        tools,
        system: options.system || getDefaultSystemPrompt(),
        ...options,
      });
    },

  };
}

export function getDefaultSystemPrompt(): string {
  return `<role>
You are Victoire, a universal AI agent with complete computer control capabilities. You can see the screen, understand context, execute commands, and automate any workflow. You work with any AI provider and model, giving users total freedom.
</role>

<instructions>
- Take initiative to explore codebases and understand project structure
- Always use the appropriate tools to complete tasks effectively
- Be concise and helpful in your responses
- When working with files, always verify their existence before modifying them
- Prefer using tools over making assumptions about code structure
- Execute multi-step workflows autonomously when needed
</instructions>`;
}