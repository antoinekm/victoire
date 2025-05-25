import { openai } from '@ai-sdk/openai';
import { generateText, streamText, type ToolCallUnion } from 'ai';
import { logger } from '../utils/logger.js';
import { SystemPrompt } from './prompt.js';
import { computerTools } from './tools.js';
import { captureScreen } from '../screen/capture.js';
import { resizeScreenshot } from '../screen/analyze.js';
import fs from 'fs';
import path from 'path';

type ToolCallResult = {
  toolName: string;
  args: Record<string, any>;
  result: any;
};

type AgentLoopCallbacks = {
  onThinking?: (thinking: string) => void;
  onToolCall?: (toolName: string, args: any) => void;
  onToolResult?: (result: any) => void;
  onText?: (text: string) => void;
  onComplete?: (finalText: string) => void;
};

export async function executeAgentLoop(
  userInput: string,
  maxSteps: number = 10,
  callbacks: AgentLoopCallbacks = {}
) {
  try {
    logger.info('Starting agent loop execution');
    const screenshotInfo = await captureAutomaticScreenshot();
    let screenshotBuffer = fs.readFileSync(screenshotInfo.resizedScreenshotPath);
    
    let currentStep = 0;
    let toolResults: ToolCallResult[] = [];
    let finalText = '';
    
    while (currentStep < maxSteps) {
      logger.info(`Agent loop step ${currentStep + 1} of ${maxSteps}`);
      
      // Create properly typed messages for the AI
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: userInput },
            { type: 'image' as const, image: screenshotBuffer }
          ]
        }
      ];
      
      try {
        const result = await generateText({
          model: openai('gpt-4o'),
          system: SystemPrompt,
          messages,
          tools: computerTools,
          maxTokens: 1500,
          temperature: 0.7,
          maxSteps: 1 // Start with 1 to handle one tool call at a time
        });
        
        finalText = result.text;
        logger.info(`Generated text: ${finalText.substring(0, 100)}...`);
        
        if (callbacks.onText) {
          callbacks.onText(finalText);
        }
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          for (const toolCall of result.toolCalls) {
            logger.info(`Tool call detected: ${toolCall.toolName}`);
            
            if (callbacks.onToolCall) {
              callbacks.onToolCall(toolCall.toolName, toolCall.args);
            }
            
            const toolName = toolCall.toolName;
            const args = toolCall.args;
            
            try {
              // Execute the tool
              const toolResult = await executeToolCall(toolName, args, computerTools);
              logger.info(`Tool execution result: ${JSON.stringify(toolResult).substring(0, 100)}...`);
              
              if (callbacks.onToolResult) {
                callbacks.onToolResult(toolResult);
              }
              
              toolResults.push({
                toolName,
                args,
                result: toolResult
              });
              
              // Take a new screenshot after each tool call to update the visual context
              logger.info('Capturing post-action screenshot');
              const newScreenshotInfo = await captureAutomaticScreenshot();
              screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
              
              // Update user input to include the tool result and tell the AI to observe what happened
              userInput = `I performed the action you requested using the ${toolName} tool. The result was: ${JSON.stringify(toolResult)}. Look at the updated screenshot carefully to see what happened. What should I do next based on what you can see in the screenshot?`;
              logger.info(`Updated prompt for next step: ${userInput.substring(0, 100)}...`);
            } catch (toolError) {
              logger.error(`Error executing tool ${toolName}:`, toolError);
              userInput = `There was an error executing the ${toolName} tool: ${toolError instanceof Error ? toolError.message : 'Unknown error'}. Please suggest a different approach based on what you can see in the screenshot.`;
            }
          }
          
          currentStep++;
          continue;
        }
      } catch (generationError) {
        logger.error('Error in text generation:', generationError);
        // If there's an error during generation, we'll continue but with a modified prompt
        userInput = `There was an error processing your request: ${generationError instanceof Error ? generationError.message : 'Unknown error'}. Let's try a different approach based on what you can see in the screenshot.`;
        
        // Take a new screenshot to ensure we have the latest visual context
        const newScreenshotInfo = await captureAutomaticScreenshot();
        screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
        
        currentStep++;
        continue;
      }
      
      break;
    }
    
    if (callbacks.onComplete) {
      callbacks.onComplete(finalText);
    }
    
    return {
      finalText,
      toolResults,
      steps: currentStep
    };
  } catch (error) {
    logger.error('Critical error in agent loop:', error);
    throw error;
  }
}

export async function streamAgentLoop(
  userInput: string,
  maxSteps: number = 10,
  callbacks: AgentLoopCallbacks = {}
) {
  try {
    logger.info('Starting streaming agent loop');
    const screenshotInfo = await captureAutomaticScreenshot();
    let screenshotBuffer = fs.readFileSync(screenshotInfo.resizedScreenshotPath);
    
    let currentStep = 0;
    let toolResults: ToolCallResult[] = [];
    let finalText = '';
    let combinedText = '';
    
    while (currentStep < maxSteps) {
      logger.info(`Streaming agent loop step ${currentStep + 1} of ${maxSteps}`);
      
      // Create properly typed messages for the AI
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: userInput },
            { type: 'image' as const, image: screenshotBuffer }
          ]
        }
      ];
      
      try {
        // First, always trigger the onText callback with a processing message
        if (callbacks.onText) {
          callbacks.onText("I'm analyzing your request and the current screen...");
        }
        
        const result = await streamText({
          model: openai('gpt-4o'),
          system: SystemPrompt,
          messages,
          tools: computerTools,
          maxTokens: 1500,
          temperature: 0.7,
          maxSteps: 1, // Handle one tool at a time for better debugging
          onError: (error) => {
            logger.error('Stream error:', error);
            if (callbacks.onText) {
              callbacks.onText(`\nEncountered an error: ${error.error.message}`);
            }
          }
        });
        
        // Collect streaming text
        combinedText = '';
        for await (const chunk of result.textStream) {
          combinedText += chunk;
          if (callbacks.onText) {
            callbacks.onText(chunk);
          }
        }
        
        finalText = combinedText || await result.text;
        logger.info(`Generated text: ${finalText.substring(0, 100)}...`);
        
        // Get the toolCalls that were generated
        const toolCallsArray = await result.toolCalls;
        logger.info(`Tool calls detected: ${toolCallsArray.length}`);
        
        if (toolCallsArray.length > 0) {
          for (const toolCall of toolCallsArray) {
            logger.info(`Processing tool call: ${toolCall.toolName}`);
            
            if (callbacks.onToolCall) {
              callbacks.onToolCall(toolCall.toolName, toolCall.args);
            }
            
            const toolName = toolCall.toolName;
            const args = toolCall.args;
            
            try {
              // Execute the tool
              const toolResult = await executeToolCall(toolName, args, computerTools);
              logger.info(`Tool execution result: ${JSON.stringify(toolResult).substring(0, 100)}...`);
              
              if (callbacks.onToolResult) {
                callbacks.onToolResult(toolResult);
              }
              
              toolResults.push({
                toolName,
                args,
                result: toolResult
              });
              
              // Take a new screenshot after each tool call
              logger.info('Capturing post-action screenshot');
              const newScreenshotInfo = await captureAutomaticScreenshot();
              screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
              
              // Update user input for the next step
              userInput = `I performed the action you requested using the ${toolName} tool. The result was: ${JSON.stringify(toolResult)}. Look at the updated screenshot carefully to see what happened. What should I do next based on what you can see in the screenshot?`;
              logger.info(`Updated prompt for next step: ${userInput.substring(0, 100)}...`);
            } catch (toolError) {
              logger.error(`Error executing tool ${toolName}:`, toolError);
              if (callbacks.onText) {
                callbacks.onText(`\nError executing tool ${toolName}: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`);
              }
              
              userInput = `There was an error executing the ${toolName} tool: ${toolError instanceof Error ? toolError.message : 'Unknown error'}. Please suggest a different approach based on what you can see in the screenshot.`;
            }
          }
          
          currentStep++;
          continue;
        }
      } catch (streamError) {
        logger.error('Error in streaming text generation:', streamError);
        if (callbacks.onText) {
          callbacks.onText(`\nEncountered an error: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`);
        }
        
        // Take a new screenshot to ensure we have the latest context
        const errorScreenshotInfo = await captureAutomaticScreenshot();
        screenshotBuffer = fs.readFileSync(errorScreenshotInfo.resizedScreenshotPath);
        
        userInput = `There was an error processing your request. Let's try a different approach based on what you can see in the screenshot.`;
        currentStep++;
        continue;
      }
      
      break;
    }
    
    if (callbacks.onComplete) {
      callbacks.onComplete(finalText);
    }
    
    return {
      finalText,
      toolResults,
      steps: currentStep
    };
  } catch (error) {
    logger.error('Critical error in streaming agent loop:', error);
    throw error;
  }
}

// Helper function to execute a tool call with better error handling
async function executeToolCall(toolName: string, args: any, tools: any) {
  logger.info(`Executing tool ${toolName} with args: ${JSON.stringify(args)}`);
  
  try {
    // Find the tool in the tools object
    const tool = tools[toolName];
    
    if (!tool) {
      logger.error(`Tool not found: ${toolName}`);
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      logger.error(`Tool ${toolName} does not have an execute function`);
      throw new Error(`Tool ${toolName} does not have an execute function`);
    }
    
    // Execute the tool with timeout
    const result = await Promise.race([
      tool.execute(args),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Tool execution timed out after 30 seconds`)), 30000)
      )
    ]);
    
    logger.info(`Tool ${toolName} executed successfully`);
    return result;
  } catch (error) {
    logger.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

async function captureAutomaticScreenshot() {
  try {
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);
    
    logger.info(`Capturing screenshot to ${filepath}`);
    await captureScreen(undefined, filepath);
    
    const resizedPath = await resizeScreenshot(filepath, 1920, 1080);
    logger.info(`Screenshot resized to ${resizedPath}`);
    
    return {
      screenshotPath: filepath,
      resizedScreenshotPath: resizedPath,
      timestamp
    };
  } catch (error) {
    logger.error('Error capturing automatic screenshot:', error);
    throw error;
  }
}