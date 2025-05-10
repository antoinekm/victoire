// This file would typically be used in a separate client application
// Here we provide a minimal implementation for reference

import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger.js';

export class PierreClient {
  private socket: Socket | null = null;
  private serverUrl: string;
  
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }
  
  /**
   * Connects to the Pierre server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl);
        
        this.socket.on('connect', () => {
          logger.info('Connected to Pierre server');
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          logger.error('Connection error:', error);
          reject(error);
        });
        
        this.socket.on('disconnect', () => {
          logger.info('Disconnected from Pierre server');
        });
      } catch (error) {
        logger.error('Error connecting to Pierre server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Sends a message to the Pierre server
   */
  public sendMessage(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to Pierre server'));
        return;
      }
      
      this.socket.emit('message', { message });
      
      this.socket.once('response', (data) => {
        resolve(data.response);
      });
      
      this.socket.once('error', (data) => {
        reject(new Error(data.error));
      });
      
      // Set a timeout in case the server doesn't respond
      setTimeout(() => {
        reject(new Error('Response timeout'));
      }, 30000);
    });
  }
  
  /**
   * Disconnects from the Pierre server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}