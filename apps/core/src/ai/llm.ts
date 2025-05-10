import { openai } from '@ai-sdk/openai';
import { generateText, LanguageModelV1, streamText, ToolSet } from 'ai';
import { logger } from '../utils/logger.js';
import { SystemPrompt } from './prompt.js';
import { executeCommand } from '../system/commands.js';
import { simulateKeyboard } from '../system/keyboard.js';
import { moveMouse, clickMouse } from '../system/mouse.js';
import { captureScreen } from '../screen/capture.js';
import { getScreenshotBase64, resizeScreenshot } from '../screen/analyze.js';
import { z } from 'zod';

// Define the available tools
export const tools: ToolSet = {
  executeCommand: {
    description: 'Execute a system command',
    parameters: z.object({
      command: z.string().describe('The command to execute')
    }),
    execute: async ({ command }) => {
      logger.info(`Executing command: ${command}`);
      try {
        return await executeCommand(command);
      } catch (error) {
        logger.error(`Error executing command: ${command}`, error);
        return { 
          stdout: '', 
          stderr: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },
  
  typeText: {
    description: 'Type text using the keyboard',
    parameters: z.object({
      text: z.string().describe('The text to type')
    }),
    execute: async ({ text }) => {
      logger.info(`Typing text: ${text}`);
      try {
        await simulateKeyboard(text);
        return { success: true, message: `Typed: ${text}` };
      } catch (error) {
        logger.error(`Error typing text: ${text}`, error);
        return { 
          success: false, 
          message: `Error typing text: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
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
      try {
        moveMouse(x, y);
        return { success: true, message: `Moved mouse to (${x}, ${y})` };
      } catch (error) {
        logger.error(`Error moving mouse to: ${x}, ${y}`, error);
        return { 
          success: false, 
          message: `Error moving mouse: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
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
      try {
        clickMouse(button, double);
        return { success: true, message: `Clicked ${button} button ${double ? 'twice' : 'once'}` };
      } catch (error) {
        logger.error(`Error clicking mouse: ${button}, double: ${double}`, error);
        return { 
          success: false, 
          message: `Error clicking mouse: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
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
      }).optional().describe('Region to capture, capture full screen if not provided'),
      maxWidth: z.number().optional().default(800).describe('Maximum width of the resized screenshot'),
      maxHeight: z.number().optional().default(600).describe('Maximum height of the resized screenshot'),
      conversationId: z.string().optional().describe('Conversation ID to associate the screenshot with')
    }),
    execute: async ({ region, maxWidth, maxHeight, conversationId }, options) => {
      logger.info(`Capturing screen${region ? ' with region' : ''} (max size: ${maxWidth}x${maxHeight})`);
      try {
        const imagePath = await captureScreen(region);
        
        // Resize the screenshot to fit within token limits - using smaller defaults
        const resizedImagePath = await resizeScreenshot(imagePath, maxWidth, maxHeight);
        const base64Image = getScreenshotBase64(resizedImagePath);
        
        logger.info(`Screenshot resized to max dimensions: ${maxWidth}x${maxHeight}`);
        
        // If we have access to the messages, try to extract the conversation ID
        if (!conversationId && options && options.messages && options.messages.length > 0) {
          // Look for a message with a conversationId property
          for (const message of options.messages) {
            if ('conversationId' in message) {
              conversationId = message.conversationId;
              break;
            }
          }
        }
        
        // Add screenshot to conversation context if possible
        if (conversationId) {
          logger.info(`Adding screenshot to conversation: ${conversationId}`);
          try {
            // Import here to avoid circular dependencies
            const { addConversationResource } = await import('../ai/conversation.js');
            addConversationResource(conversationId, 'screenshot', {
              path: resizedImagePath,
              description: `Screenshot captured at ${new Date().toISOString()}. Shows the user's screen or desktop environment.`
            });
          } catch (e) {
            logger.error('Error adding screenshot to conversation:', e);
          }
        }
        
        // Create detailed description for the AI
        const description = `This is a screenshot of the user's screen captured at ${new Date().toISOString()}. It has been resized to a maximum of ${maxWidth}x${maxHeight} pixels.`;
        
        return { 
          success: true, 
          screenshotPath: imagePath,
          resizedScreenshotPath: resizedImagePath,
          image: {
            base64: base64Image,
            mimeType: 'image/jpeg', // Using JPEG for smaller file size
            description
          },
          // Include the conversation ID in the response
          conversationId
        };
      } catch (error) {
        logger.error(`Error capturing screen${region ? ' with region' : ''}`, error);
        return { 
          success: false, 
          message: `Error capturing screen: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    },
    // Map to tool result content for LLM consumption:
    experimental_toToolResultContent(result) {
      if (!result.success || !result.image) {
        return [{ type: 'text', text: result.message || "Screenshot capture failed" }];
      }
      
      // Create a detailed message about the image
      const contextText = result.conversationId ? 
        " I'll remember this screenshot for our conversation. You can ask me questions about what's visible in it." :
        " You can ask me questions about what's visible in it.";
      
      return [
        { 
          type: 'image', 
          data: result.image.base64, 
          mimeType: result.image.mimeType 
        },
        { 
          type: 'text', 
          text: "Screenshot captured successfully." + contextText
        }
      ];
    },
  }
};

export let model: LanguageModelV1;

export async function initializeLLM() {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment variables');
    }
    
    model = openai('gpt-4o'); // GPT-4o has vision capabilities
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
    // Return a friendly error message
    return `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. The full error has been logged for further investigation.`;
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
    // Create a readable stream with an error message
    const encoder = new TextEncoder();
    const errorMessage = `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. The full error has been logged for further investigation.`;
    
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    });
  }
}