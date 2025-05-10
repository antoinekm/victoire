import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { startServer } from './remote/server.js';
import { setupAI } from './ai/index.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('Starting Pierre AI Desktop Assistant...');
    
    // Initialize AI components
    await setupAI();
    
    // Start remote server if enabled
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3333;
    const host = process.env.SERVER_HOST || 'localhost';
    await startServer(port, host);
    
    logger.info(`Pierre is now running`);
    logger.info(`Remote server available at http://${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start Pierre:', error);
    process.exit(1);
  }
}

main().catch(err => {
  logger.error('Unhandled error in main:', err);
  process.exit(1);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  logger.info('Shutting down Pierre...');
  // Cleanup resources here
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});