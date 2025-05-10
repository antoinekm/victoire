import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { logger } from '../utils/logger.js';
import { SystemPrompt } from './prompt.js';
import { executeCommand } from '../system/commands.js';
import { simulateKeyboard } from '../system/keyboard.js';
import { moveMouse, clickMouse } from '../system/mouse.js';
import { captureScreen } from '../screen/capture.js';
import { analyzeScreenContent } from '../screen/analyze.js';
import { z } from 'zod';

// Define the available tools
const tools = {
  executeCommand: {
    description: 'Execute a system command',
    parameters: z.object({
      command: z.string().describe('The command to execute')
    }),
    execute: async ({ command }) => {
      logger.info(`Executing command: ${command}`);
      return await executeCommand(command);
    }
  },
  
  typeText: {
    description: 'Type text using the keyboard',
    parameters: z.object({
      text: z.string().describe('The text to type')
    }),
    execute: async ({ text }) => {
      logger.info(`Typing text: ${text}`);
      await simulateKeyboard(text);
      return { success: true, message: `Typed: ${text}` };
    }
  },
  
  moveMouse: {
    description: 'Move the mouse to a specific position',
    parameters: z.object({
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate')
    }),
    execute: async ({ x, y }) => {
      logger.info(`Moving mouse to: ${x}, ${y}`);
      moveMouse(x, y);
      return { success: true, message: `Moved mouse to (${x}, ${y})` };
    }
  },
  
  clickMouse: {
    description: 'Click the mouse',
    parameters: z.object({
      button: z.enum(['left', 'right', 'middle']).default('left').describe('Mouse button to click'),
      double: z.boolean().default(false).describe('Whether to double-click')
    }),
    execute: async ({ button, double }) => {
      logger.info(`Clicking mouse: ${button}, double: ${double}`);
      clickMouse(button, double);
      return { success: true, message: `Clicked ${button} button ${double ? 'twice' : 'once'}` };
    }
  },
  
  captureScreen: {
    description: 'Capture the screen',
    parameters: z.object({
      region: z.object({
        x: z.number().optional().describe('X coordinate of the top-left corner'),
        y: z.number().optional().describe('Y coordinate of the top-left corner'),
        width: z.number().optional().describe('Width of the region'),
        height: z.number().optional().describe('Height of the region')
      }).optional().describe('Region to capture, capture full screen if not provided')
    }),
    execute: async ({ region }) => {
      logger.info(`Capturing screen${region ? ' with region' : ''}`);
      const path = await captureScreen(region);
      const analysis = await analyzeScreenContent(path);
      return { 
        success: true, 
        screenshotPath: path,
        analysis: analysis 
      };
    }
  }
};

let model: any;

export async function initializeLLM() {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment variables');
    }
    
    model = openai('gpt-4o');
    logger.info('Language model initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize language model:', error);
    throw error;
  }
}

export async function getAssistantResponse(userInput: string): Promise<string> {
  try {
    const result = await generateText({
      model,
      system: SystemPrompt,
      prompt: userInput,
      tools,
      maxSteps: 10, // Allow multiple tool calls if needed
      temperature: 0.7
    });
    
    logger.info('Generated assistant response');
    return result.text;
  } catch (error) {
    logger.error('Error generating assistant response:', error);
    throw error;
  }
}

export async function streamAssistantResponse(userInput: string): Promise<ReadableStream<any>> {
  try {
    const result = await streamText({
      model,
      system: SystemPrompt,
      prompt: userInput,
      tools,
      maxSteps: 10,
      temperature: 0.7
    });
    
    logger.info('Streaming assistant response');
    return result.textStream;
  } catch (error) {
    logger.error('Error streaming assistant response:', error);
    throw error;
  }
}