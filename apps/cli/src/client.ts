import { io, Socket } from 'socket.io-client';
import { logger } from './utils/logger.js';

// Client connection details
const DEFAULT_SERVER_URL = 'http://localhost:3333';
let socket: Socket | null = null;

// Store the conversation state
let conversationId: string | null = null;

/**
 * Initializes the client connection to Pierre core
 */
export async function initializeClient(): Promise<void> {
  try {
    const serverUrl = process.env.PIERRE_SERVER_URL || DEFAULT_SERVER_URL;
    logger.info(`Connecting to Pierre server at ${serverUrl}`);
    
    // Connect to the Pierre server
    socket = io(serverUrl);
    
    // Setup event listeners
    socket.on('connect', () => {
      logger.info('Connected to Pierre server');
      // Generate a unique conversation ID
      conversationId = `cli-session-${Date.now()}`;
      logger.info(`Started conversation with ID: ${conversationId}`);
    });
    
    socket.on('connect_error', (error) => {
      logger.error('Connection error:', error);
      throw error;
    });
    
    socket.on('disconnect', () => {
      logger.info('Disconnected from Pierre server');
      conversationId = null;
    });
    
    // Wait for the connection to be established
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      socket!.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      socket!.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Failed to initialize client:', error);
    throw error;
  }
}

/**
 * Closes the client connection
 */
export async function closeClient(): Promise<void> {
  if (socket) {
    logger.info('Closing connection to Pierre server');
    socket.disconnect();
    socket = null;
    conversationId = null;
  }
}

/**
 * Resets the current conversation
 */
export function resetConversation(): void {
  if (socket && socket.connected) {
    // Generate a new conversation ID
    conversationId = `cli-session-${Date.now()}`;
    logger.info(`Reset conversation with new ID: ${conversationId}`);
  }
}

/**
 * Sends a message to the Pierre server and returns the response
 */
export async function sendMessage(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Not connected to Pierre server'));
      return;
    }
    
    // If no conversation ID exists, create one
    if (!conversationId) {
      conversationId = `cli-session-${Date.now()}`;
      logger.info(`Created new conversation with ID: ${conversationId}`);
    }
    
    // Send the message with conversation ID to maintain state
    socket.emit('message', { 
      message,
      conversationId,
      timestamp: Date.now()
    });
    
    socket.once('response', (data) => {
      resolve(data.response);
    });
    
    socket.once('error', (data) => {
      reject(new Error(data.error || 'Unknown error'));
    });
    
    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      reject(new Error('Response timeout'));
    }, 30000);
  });
}