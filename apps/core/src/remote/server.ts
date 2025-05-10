import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { logger } from '../utils/logger.js';
import { processUserInput } from '../ai/index.js';
import { streamAssistantResponse } from '../ai/llm.js';
import { authenticate } from '../security/auth.js';

// Server instance
let io: Server;
let server: http.Server;

/**
 * Starts the remote server for Pierre
 */
export async function startServer(port: number, host: string): Promise<void> {
  try {
    const app = express();
    server = http.createServer(app);
    
    // Set up Socket.IO with CORS configured
    io = new Server(server, {
      cors: {
        origin: '*', // In production, this should be restricted
        methods: ['GET', 'POST'],
      },
    });
    
    // Set up authentication middleware for API routes
    app.use('/api', authenticate);
    
    // Serve static files for the web interface
    app.use(express.static(path.join(process.cwd(), 'public')));
    
    // API endpoint for text-based communication
    app.post('/api/message', express.json(), async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        
        const response = await processUserInput(message);
        return res.json({ response });
      } catch (error) {
        logger.error('Error processing message:', error);
        return res.status(500).json({ error: 'Failed to process message' });
      }
    });
    
    // API endpoint for streaming responses
    app.post('/api/stream', express.json(), async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
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
                res.write('event: done\\ndata: {}\\n\\n');
                res.end();
                break;
              }
              
              const chunk = new TextDecoder().decode(value);
              res.write(`data: ${JSON.stringify({ text: chunk })}\\n\\n`);
            }
          } catch (error) {
            logger.error('Error processing stream:', error);
            res.write(`event: error\\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\\n\\n`);
            res.end();
          }
        };
        
        processStream();
      } catch (error) {
        logger.error('Error initializing stream:', error);
        return res.status(500).json({ error: 'Failed to initialize stream' });
      }
    });
    
    // Socket.IO connection handling
    io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);
      
      // Handle incoming messages
      socket.on('message', async (data) => {
        try {
          const response = await processUserInput(data.message);
          socket.emit('response', { response });
        } catch (error) {
          logger.error('Error handling socket message:', error);
          socket.emit('error', { error: 'Failed to process message' });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
    
    // Start the server
    server.listen(port, host, () => {
      logger.info(`Remote server started at http://${host}:${port}`);
    });
  } catch (error) {
    logger.error('Error starting remote server:', error);
    throw error;
  }
}

/**
 * Stops the remote server
 */
export async function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    
    server.close((err) => {
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