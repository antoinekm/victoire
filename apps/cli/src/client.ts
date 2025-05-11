import { io, Socket } from 'socket.io-client';
import { logger } from './utils/logger.js';
import { cancel, intro, log, outro, spinner } from '@clack/prompts';
import { Command } from 'commander';
import chalk from 'chalk';

const DEFAULT_SERVER_URL = 'http://localhost:3333';
let socket: Socket | null = null;

let conversationId: string | null = null;

export async function initializeClient(program: Command): Promise<void> {
  try {
    const serverUrl = process.env.PIERRE_SERVER_URL || DEFAULT_SERVER_URL;
    
    socket = io(serverUrl);

    const introMessage = chalk.bold(`▲ ${program.name()} ${program.version()}`);
    
    socket.on('connect', () => {
      conversationId = `cli-session-${Date.now()}`;

      intro(introMessage);
      log.message(`- Server:  ${serverUrl}
- Session: ${conversationId}`);
    });
    
    socket.on('connect_error', (error) => {
      intro(introMessage);
      log.error(`Failed to connect to server: ${error.message}`);
      outro('Please check if the server is running and try again.');
      throw error;
    });
    
    socket.on('disconnect', () => {
      outro('See you next time!');
      conversationId = null;
    });
    
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
    log.error(`Failed to initialize client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Closes the client connection
 */
export async function closeClient(): Promise<void> {
  if (socket) {
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