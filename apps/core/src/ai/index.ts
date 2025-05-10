import { logger } from '../utils/logger.js';
import { initializeLLM, getAssistantResponse } from './llm.js';
import { SystemPrompt } from './prompt.js';

export async function setupAI() {
  try {
    logger.info('Setting up AI components...');
    await initializeLLM();
    logger.info('AI components initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize AI components:', error);
    throw error;
  }
}

export async function processUserInput(userInput: string): Promise<string> {
  try {
    logger.info('Processing user input');
    const response = await getAssistantResponse(userInput);
    return response;
  } catch (error) {
    logger.error('Error processing user input:', error);
    return 'I encountered an error while processing your request.';
  }
}

export { SystemPrompt };