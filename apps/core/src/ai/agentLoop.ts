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
    const originalUserInput = userInput;
    
    while (currentStep < maxSteps) {
      logger.info(`Agent loop step ${currentStep + 1} of ${maxSteps}`);
      
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
          temperature: 0.3,
          maxSteps: 1
        });
        
        finalText = result.text;
        logger.info(`Generated text: ${finalText.substring(0, 100)}...`);
        
        if (callbacks.onText) {
          callbacks.onText(finalText);
        }
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          let allToolsExecuted = true;
          
          for (const toolCall of result.toolCalls) {
            logger.info(`Tool call detected: ${toolCall.toolName}`);
            
            if (callbacks.onToolCall) {
              callbacks.onToolCall(toolCall.toolName, toolCall.args);
            }
            
            const toolName = toolCall.toolName;
            const args = toolCall.args;
            
            try {
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
              
              logger.info('Capturing post-action screenshot');
              const newScreenshotInfo = await captureAutomaticScreenshot();
              screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
              
            } catch (toolError) {
              logger.error(`Error executing tool ${toolName}:`, toolError);
              allToolsExecuted = false;
              
              userInput = `There was an error executing the ${toolName} tool: ${toolError instanceof Error ? toolError.message : 'Unknown error'}. 

Original request: "${originalUserInput}"

Please analyze the current screenshot and either:
1. Try a different approach to accomplish the original goal
2. If the goal appears to be already accomplished, confirm completion
3. If the goal cannot be accomplished, explain why

Look carefully at what's visible on the screen and determine the best next action.`;
              break;
            }
          }
          
          if (allToolsExecuted) {
            userInput = `I have executed the requested actions. 

Original request: "${originalUserInput}"

Please analyze the current screenshot carefully and determine:
1. Has the original goal been accomplished? If so, confirm completion.
2. If not, what is the next specific action needed to accomplish the goal?
3. Are there any obstacles or issues that need to be addressed?

Look at what's currently visible on the screen and either complete the task or take the next necessary action.`;
          }
          
          currentStep++;
          continue;
        } else {
          if (currentStep === 0) {
            logger.info('No tool calls generated on first step, task may be informational only');
          } else {
            logger.info('No more tool calls generated, task appears complete');
          }
          break;
        }
      } catch (generationError) {
        logger.error('Error in text generation:', generationError);
        
        userInput = `There was an error processing the request: ${generationError instanceof Error ? generationError.message : 'Unknown error'}. 

Original request: "${originalUserInput}"

Please analyze the current screenshot and try a different approach to accomplish the original goal, or explain why it cannot be accomplished.`;
        
        const newScreenshotInfo = await captureAutomaticScreenshot();
        screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
        
        currentStep++;
        continue;
      }
    }
    
    if (currentStep >= maxSteps) {
      logger.warn(`Agent loop reached maximum steps (${maxSteps}), stopping execution`);
      finalText += `\n\n[Note: Reached maximum number of steps (${maxSteps}). The task may require manual completion or a different approach.]`;
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
    const originalUserInput = userInput;
    
    while (currentStep < maxSteps) {
      logger.info(`Streaming agent loop step ${currentStep + 1} of ${maxSteps}`);
      
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
        if (currentStep === 0 && callbacks.onText) {
          callbacks.onText("I'm analyzing your request and the current screen...\n\n");
        }
        
        const result = await streamText({
          model: openai('gpt-4o'),
          system: SystemPrompt,
          messages,
          tools: computerTools,
          maxTokens: 1500,
          temperature: 0.3,
          maxSteps: 1,
          onError: (error) => {
            logger.error('Stream error:', error);
            if (callbacks.onText) {
              callbacks.onText(`\nEncountered an error: ${error.error.message}\n`);
            }
          }
        });
        
        combinedText = '';
        for await (const chunk of result.textStream) {
          combinedText += chunk;
          if (callbacks.onText) {
            callbacks.onText(chunk);
          }
        }
        
        finalText = combinedText || await result.text;
        logger.info(`Generated text: ${finalText.substring(0, 100)}...`);
        
        const toolCallsArray = await result.toolCalls;
        logger.info(`Tool calls detected: ${toolCallsArray.length}`);
        
        if (toolCallsArray.length > 0) {
          let allToolsExecuted = true;
          
          for (const toolCall of toolCallsArray) {
            logger.info(`Processing tool call: ${toolCall.toolName}`);
            
            if (callbacks.onToolCall) {
              callbacks.onToolCall(toolCall.toolName, toolCall.args);
            }
            
            const toolName = toolCall.toolName;
            const args = toolCall.args;
            
            try {
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
              
              logger.info('Capturing post-action screenshot');
              const newScreenshotInfo = await captureAutomaticScreenshot();
              screenshotBuffer = fs.readFileSync(newScreenshotInfo.resizedScreenshotPath);
              
            } catch (toolError) {
              logger.error(`Error executing tool ${toolName}:`, toolError);
              allToolsExecuted = false;
              
              if (callbacks.onText) {
                callbacks.onText(`\n\nError executing tool ${toolName}: ${toolError instanceof Error ? toolError.message : 'Unknown error'}\n`);
              }
              
              userInput = `There was an error executing the ${toolName} tool: ${toolError instanceof Error ? toolError.message : 'Unknown error'}. 

Original request: "${originalUserInput}"

Please analyze the current screenshot and either:
1. Try a different approach to accomplish the original goal
2. If the goal appears to be already accomplished, confirm completion
3. If the goal cannot be accomplished, explain why

Look carefully at what's visible on the screen and determine the best next action.`;
              break;
            }
          }
          
          if (allToolsExecuted) {
            if (callbacks.onText) {
              callbacks.onText("\n\nAnalyzing the updated screen to determine next steps...\n\n");
            }
            
            userInput = `I have executed the requested actions. 

Original request: "${originalUserInput}"

Please analyze the current screenshot carefully and determine:
1. Has the original goal been accomplished? If so, confirm completion.
2. If not, what is the next specific action needed to accomplish the goal?
3. Are there any obstacles or issues that need to be addressed?

Look at what's currently visible on the screen and either complete the task or take the next necessary action.`;
          }
          
          currentStep++;
          continue;
        } else {
          if (currentStep === 0) {
            logger.info('No tool calls generated on first step, task may be informational only');
          } else {
            logger.info('No more tool calls generated, task appears complete');
          }
          break;
        }
      } catch (streamError) {
        logger.error('Error in streaming text generation:', streamError);
        if (callbacks.onText) {
          callbacks.onText(`\nEncountered an error: ${streamError instanceof Error ? streamError.message : 'Unknown error'}\n`);
        }
        
        const errorScreenshotInfo = await captureAutomaticScreenshot();
        screenshotBuffer = fs.readFileSync(errorScreenshotInfo.resizedScreenshotPath);
        
        userInput = `There was an error processing the request. Let's try a different approach for the original goal: "${originalUserInput}"`;
        currentStep++;
        continue;
      }
    }
    
    if (currentStep >= maxSteps) {
      logger.warn(`Streaming agent loop reached maximum steps (${maxSteps}), stopping execution`);
      const maxStepsMessage = `\n\n[Note: Reached maximum number of steps (${maxSteps}). The task may require manual completion or a different approach.]`;
      finalText += maxStepsMessage;
      if (callbacks.onText) {
        callbacks.onText(maxStepsMessage);
      }
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

async function executeToolCall(toolName: string, args: any, tools: any) {
  logger.info(`Executing tool ${toolName} with args: ${JSON.stringify(args)}`);
  
  try {
    const tool = tools[toolName];
    
    if (!tool) {
      logger.error(`Tool not found: ${toolName}`);
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      logger.error(`Tool ${toolName} does not have an execute function`);
      throw new Error(`Tool ${toolName} does not have an execute function`);
    }
    
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