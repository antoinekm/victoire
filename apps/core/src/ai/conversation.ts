import { logger } from '../utils/logger.js';
import { generateText } from 'ai';
import { SystemPrompt } from './prompt.js';
import type { LanguageModelV1 } from 'ai';
import { tools } from './llm.js';

// Types for conversation management
type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  messages: ConversationMessage[];
  lastActivity: number;
  // Store any additional resources like screenshots
  resources: {
    screenshots?: {
      path: string;
      timestamp: number;
      description?: string;
    }[];
  };
};

// In-memory store for conversations
const conversations = new Map<string, Conversation>();

// Cleanup interval (30 minutes)
const CONVERSATION_TIMEOUT = 30 * 60 * 1000;

/**
 * Initialize the conversation manager
 */
export function initializeConversationManager(): void {
  // Start cleanup task
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
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  logger.info('Conversation manager initialized');
}

/**
 * Creates a new conversation or returns an existing one
 */
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

/**
 * Add a resource to a conversation
 */
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
  
  // Update last activity
  conversation.lastActivity = Date.now();
}

/**
 * Add a message to a conversation
 */
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
  
  // Update last activity
  conversation.lastActivity = Date.now();
  
  logger.info(`Added ${role} message to conversation ${conversationId}`);
}

/**
 * Process a user message in the context of a conversation
 */
export async function processConversationMessage(
  model: LanguageModelV1,
  conversationId: string,
  userMessage: string
): Promise<string> {
  const conversation = getOrCreateConversation(conversationId);
  
  // Add the user message
  addConversationMessage(conversationId, 'user', userMessage);
  
  try {
    // Create a contextual prompt based on conversation history
    let contextPrompt = '';
    
    // Add previous messages for context (limit to last 10 for token efficiency)
    const recentMessages = conversation.messages.slice(-10);
    if (recentMessages.length > 1) {
      contextPrompt = recentMessages
        .slice(0, -1) // Exclude the most recent (just added) user message
        .map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`)
        .join('\n\n');
        
      contextPrompt += '\n\n';
    }
    
    // Add screenshot context if available
    if (conversation.resources.screenshots && conversation.resources.screenshots.length > 0) {
      // Just mention the most recent screenshot
      const latestScreenshot = conversation.resources.screenshots[conversation.resources.screenshots.length - 1];
      
      // Fix: Add null check for latestScreenshot
      if (latestScreenshot) {
        contextPrompt += `Note: The user has previously shared a screenshot at ${new Date(latestScreenshot.timestamp).toISOString()}. `;
        contextPrompt += `You have access to this screenshot. When the user asks about what's on the screen, they're referring to this captured screenshot. `;
        
        if (latestScreenshot.description) {
          contextPrompt += `The screenshot shows: ${latestScreenshot.description}. `;
        }
        
        contextPrompt += '\n\n';
      }
    }
    
    // Add the most recent user message
    contextPrompt += `User: ${userMessage}\n\nYou:`;
    
    // Generate the response
    const result = await generateText({
      model,
      system: SystemPrompt,
      prompt: contextPrompt,
      // Add custom metadata to the tool calls
      tools: Object.fromEntries(
        Object.entries(tools).map(([key, tool]) => {
          // For captureScreen tool, inject the conversation ID
          if (key === 'captureScreen') {
            return [key, {
              ...tool,
              // Add conversationId to the parameters to maintain context
              parameters: {
                ...tool.parameters,
                properties: {
                  ...tool.parameters.properties,
                  conversationId: { type: 'string', default: conversationId }
                }
              }
            }];
          }
          return [key, tool];
        })
      ),
      temperature: 0.7,
      providerOptions: {
        // Pass conversationId as a provider option
        pierre: {
          conversationId
        }
      }
    });
    
    // Add the assistant's response to the conversation
    addConversationMessage(conversationId, 'assistant', result.text);
    
    return result.text;
  } catch (error) {
    logger.error(`Error processing message in conversation ${conversationId}:`, error);
    const errorMessage = `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. The full error has been logged for further investigation.`;
    
    // Add the error response to the conversation
    addConversationMessage(conversationId, 'assistant', errorMessage);
    
    return errorMessage;
  }
}

/**
 * Get a conversation by ID
 */
export function getConversation(conversationId: string): Conversation | undefined {
  return conversations.get(conversationId);
}