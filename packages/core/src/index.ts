import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { startServer } from './remote/server.js';
import { setupAI } from './ai/index.js';
import { clearScreenshotsDir } from './screen/capture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  try {
    logger.info(`Starting ${packageJson.name}...`);
    
    await clearScreenshotsDir();
    
    await setupAI();
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3333;
    const host = process.env.SERVER_HOST || 'localhost';
    await startServer(port, host);
    
    logger.info(`Pierre is now running`);
    logger.info(`Remote server available at http://${host}:${port}`);
  } catch (error) {
    logger.error(`Failed to start ${packageJson.name}:`, error);
    process.exit(1);
  }
}

main().catch(err => {
  logger.error('Unhandled error in main:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Shutting down Pierre...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});