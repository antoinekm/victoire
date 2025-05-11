import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { logger } from '../utils/logger.js';
import { SystemPrompt } from './prompt.js';
import { computerTools } from './tools.js';
import { captureScreen } from '../screen/capture.js';
import { resizeScreenshot, getScreenshotBase64 } from '../screen/analyze.js';
import fs from 'fs';
import path from 'path';

export async function initializeLLM() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment variables');
    }
    
    logger.info('Language model initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize language model:', error);
    throw error;
  }
}

export async function getAssistantResponse(userInput: string) {
  try {
    // Capture screenshot first
    const screenshotInfo = await captureAutomaticScreenshot();
    const imageData = fs.readFileSync(screenshotInfo.resizedScreenshotPath);
    
    const result = await generateText({
      model: openai('gpt-4o'),
      system: SystemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userInput,
            },
            {
              type: 'image',
              image: imageData,
            },
          ],
        },
      ],
      tools: computerTools,
      maxSteps: 10,
      temperature: 0.7
    });
    
    logger.info('Generated assistant response with screenshot');
    return result.text;
  } catch (error) {
    logger.error('Error generating assistant response:', error);
    return `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. The full error has been logged for further investigation.`;
  }
}

export async function streamAssistantResponse(userInput: string) {
  try {
    // Capture screenshot before streaming response
    const screenshotInfo = await captureAutomaticScreenshot();
    
    // Use the screenshot in the input to the model
    const screenshotPath = screenshotInfo.resizedScreenshotPath;
    const imageData = fs.readFileSync(screenshotPath);
    
    const result = await streamText({
      model: openai('gpt-4o'),
      system: SystemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userInput,
            },
            {
              type: 'image',
              image: imageData,
            },
          ],
        },
      ],
      tools: computerTools,
      maxSteps: 10,
      temperature: 0.7
    });
    
    logger.info('Streaming assistant response with screenshot');
    return result.textStream;
  } catch (error) {
    logger.error('Error streaming assistant response:', error);
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

// Helper function to capture a screenshot automatically
async function captureAutomaticScreenshot() {
  try {
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });
    
    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);
    
    // Capture screenshot
    await captureScreen(undefined, filepath);
    
    // Resize for better token efficiency
    const resizedPath = await resizeScreenshot(filepath, 1920, 1080);
    
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