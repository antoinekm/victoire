import { 
  generateText as aiGenerateText, 
  streamText as aiStreamText,
  type LanguageModel
} from 'ai';
import pc from 'picocolors';
import { createDevelopmentTools } from './tools/index.js';
import { getEnvironmentInfo } from './utils/environment.js';

export type DevelopmentTools = ReturnType<typeof createDevelopmentTools>;

export type GenerateTextOptions = Omit<Parameters<typeof aiGenerateText<DevelopmentTools>>[0], 'model' | 'tools'>;
export type StreamTextOptions = Omit<Parameters<typeof aiStreamText<DevelopmentTools>>[0], 'model' | 'tools'>;

export function victoire(model: LanguageModel) {
  const tools = createDevelopmentTools();
  const defaultSystem = getDefaultSystemPrompt();
  
  return {
    async generateText(options: GenerateTextOptions) {
      return await aiGenerateText<DevelopmentTools>({
        model,
        tools,
        system: options.system ?? defaultSystem,
        ...options,
      } as Parameters<typeof aiGenerateText<DevelopmentTools>>[0]);
    },
    
    async streamText(options: StreamTextOptions) {
      return aiStreamText<DevelopmentTools>({
        model,
        tools,
        system: options.system ?? defaultSystem,
        ...options,
      } as Parameters<typeof aiStreamText<DevelopmentTools>>[0]);
    },
    
    tools,
    systemPrompt: defaultSystem,
  };
}

export function getDefaultSystemPrompt(): string {
  const environmentInfo = getEnvironmentInfo();
  
  return `${environmentInfo}
<role>
You are Victoire, a universal AI agent with complete computer control capabilities. You can see the screen, understand context, execute commands, and automate any workflow. You work with any AI provider and model, giving users total freedom.
</role>
<instructions>
- Be proactive: When asked to create/modify code, DO IT immediately using available tools. Don't ask for confirmation unless the request is ambiguous or potentially destructive.
- Show your work: Always display what files you're creating/modifying and their content. Use tools to demonstrate concrete actions.
- Provide execution instructions: After creating files, always explain how to run/use them.
- Be direct and concise: Skip conversational padding. Focus on delivering working solutions.
- Choose appropriate languages: Prefer JavaScript/Node.js for scripts, but adapt based on the task requirements.
- Execute multi-step workflows autonomously: Complete entire workflows without asking for permission at each step.
- Verify and test when possible: Use available tools to validate your solutions.
</instructions>
<formatting>
Terminal mode: NO markdown. Use ANSI colors: ${pc.bold('bold')}, ${pc.red('errors')}, ${pc.green('success')}, ${pc.cyan('paths')}, ${pc.yellow('commands')}.
</formatting>`;
}