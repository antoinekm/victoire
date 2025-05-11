import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getAssistantResponse, streamAssistantResponse } from '../ai/llm.js';
import { authenticate } from '../security/auth.js';
import { 
  initializeConversationManager,
  processConversationMessage,
  addConversationResource
} from '../ai/conversation.js';

// Define proper types for the server and io instances
let io: Server;
let server: http.Server;

export async function startServer(port: number, host: string): Promise<void> {
  try {
    const app = express();
    server = http.createServer(app);
    
    initializeConversationManager();
    
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    app.use('/api', authenticate);
    app.use(express.static(path.join(process.cwd(), 'public')));
    
    app.post('/api/message', express.json(), async (req, res) => {
      try {
        const { message, conversationId } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        
        const actualConversationId = conversationId || `api-${Date.now()}`;
        
        let response;
        if (conversationId) {
          response = await processConversationMessage(actualConversationId, message);
        } else {
          response = await getAssistantResponse(message);
        }
        
        return res.json({ response, conversationId: actualConversationId });
      } catch (error) {
        logger.error('Error processing message:', error);
        return res.status(500).json({ error: 'Failed to process message' });
      }
    });
    
    app.post('/api/stream', express.json(), async (req, res) => {
      try {
        const { message, conversationId } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        
        const actualConversationId = conversationId || `api-stream-${Date.now()}`;
        
        // Process the message in the conversation context (for history)
        if (conversationId) {
          await processConversationMessage(actualConversationId, message);
        }
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const stream = await streamAssistantResponse(message);
        
        // Pass the stream to the response
        const reader = stream.getReader();
        
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                res.write('event: done\ndata: {}\n\n');
                res.end();
                break;
              }
              
              const chunk = new TextDecoder().decode(value);
              res.write(`data: ${JSON.stringify({ text: chunk, conversationId: actualConversationId })}\n\n`);
            }
          } catch (error) {
            logger.error('Error processing stream:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`);
            res.end();
          }
        };
        
        processStream();
      } catch (error) {
        logger.error('Error initializing stream:', error);
        return res.status(500).json({ error: 'Failed to initialize stream' });
      }
    });
    
    io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);
      
      socket.on('message', async (data) => {
        try {
          const { message, conversationId, timestamp } = data;
          const actualConversationId = conversationId || `socket-${socket.id}-${Date.now()}`;
          
          logger.info(`Message from client ${socket.id} (conversation: ${actualConversationId}): ${message}`);
          
          const response = await processConversationMessage(actualConversationId, message);
          
          socket.emit('response', { 
            response,
            conversationId: actualConversationId,
            timestamp: Date.now()
          });
          
        } catch (error) {
          logger.error('Error handling socket message:', error);
          socket.emit('error', { error: 'Failed to process message' });
        }
      });
      
      socket.on('screenshot_captured', (data) => {
        const { conversationId, screenshotPath, description } = data;
        
        if (conversationId && screenshotPath) {
          addConversationResource(conversationId, 'screenshot', {
            path: screenshotPath,
            description: description || 'Screenshot captured by user'
          });
        }
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
    
    server.listen(port, host, () => {
      logger.info(`Remote server started at http://${host}:${port}`);
    });
  } catch (error) {
    logger.error('Error starting remote server:', error);
    throw error;
  }
}

export async function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    
    server.close((err: Error | undefined) => {
      if (err) {
        logger.error('Error stopping server:', err);
        reject(err);
      } else {
        logger.info('Remote server stopped');
        resolve();
      }
    });
  });
}