import { logger } from '../utils/logger.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { SystemPrompt } from './prompt.js';
import { computerTools } from './tools.js';
import { captureScreen } from '../screen/capture.js';
import { resizeScreenshot, getScreenshotBase64 } from '../screen/analyze.js';
import fs from 'fs';
import path from 'path';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  messages: ConversationMessage[];
  lastActivity: number;
  resources: {
    screenshots?: {
      path: string;
      timestamp: number;
      description?: string;
    }[];
  };
};

const conversations = new Map<string, Conversation>();
const CONVERSATION_TIMEOUT = 30 * 60 * 1000;

export function initializeConversationManager() {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, conversation] of conversations.entries()) {
      if (now - conversation.lastActivity > CONVERSATION_TIMEOUT) {
        conversations.delete(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} inactive conversations`);
    }
  }, 5 * 60 * 1000);
  
  logger.info('Conversation manager initialized');
}

export function getOrCreateConversation(conversationId: string): Conversation {
  let conversation = conversations.get(conversationId);
  
  if (!conversation) {
    conversation = {
      id: conversationId,
      messages: [],
      lastActivity: Date.now(),
      resources: {
        screenshots: []
      }
    };
    conversations.set(conversationId, conversation);
    logger.info(`Created new conversation: ${conversationId}`);
  }
  
  return conversation;
}

export function addConversationResource(
  conversationId: string, 
  resourceType: 'screenshot', 
  resource: any
): void {
  const conversation = getOrCreateConversation(conversationId);
  
  if (resourceType === 'screenshot') {
    if (!conversation.resources.screenshots) {
      conversation.resources.screenshots = [];
    }
    
    conversation.resources.screenshots.push({
      path: resource.path,
      timestamp: Date.now(),
      description: resource.description
    });
    
    logger.info(`Added screenshot to conversation ${conversationId}: ${resource.path}`);
  }
  
  conversation.lastActivity = Date.now();
}

export function addConversationMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  const conversation = getOrCreateConversation(conversationId);
  
  conversation.messages.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  conversation.lastActivity = Date.now();
  
  logger.info(`Added ${role} message to conversation ${conversationId}`);
}

export async function processConversationMessage(
  conversationId: string,
  userMessage: string
): Promise<string> {
  const conversation = getOrCreateConversation(conversationId);
  
  addConversationMessage(conversationId, 'user', userMessage);
  
  try {
    // Automatically capture screenshot before responding
    const screenshotInfo = await captureAutomaticScreenshot(conversationId);
    
    let contextPrompt = '';
    
    // Format recent conversation history
    const recentMessages = conversation.messages.slice(-10);
    if (recentMessages.length > 1) {
      contextPrompt = recentMessages
        .slice(0, -1)
        .map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`)
        .join('\n\n');
        
      contextPrompt += '\n\n';
    }
    
    contextPrompt += `User: ${userMessage}\n\nYou:`;
    
    // Prepare image data for the model
    const screenshotPath = screenshotInfo.resizedScreenshotPath;
    const imageData = fs.readFileSync(screenshotPath);
    
    // Use generateText with multi-modal input (text + image)
    const result = await generateText({
      model: openai('gpt-4o'),
      system: SystemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: contextPrompt,
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
    
    addConversationMessage(conversationId, 'assistant', result.text);
    
    return result.text;
  } catch (error) {
    logger.error(`Error processing message in conversation ${conversationId}:`, error);
    const errorMessage = `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. The full error has been logged for further investigation.`;
    
    addConversationMessage(conversationId, 'assistant', errorMessage);
    
    return errorMessage;
  }
}

// Helper function to capture a screenshot automatically
async function captureAutomaticScreenshot(conversationId: string) {
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
    
    // Add to conversation resources
    addConversationResource(conversationId, 'screenshot', {
      path: resizedPath,
      description: `Automatic screenshot captured at ${timestamp}`,
    });
    
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

export function getConversation(conversationId: string): Conversation | undefined {
  return conversations.get(conversationId);
}