#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from 'commander';
import chalk from 'chalk';
import { initializeClient, closeClient } from './client.js';
import { registerCommands } from './commands/index.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Create the command program
const program = new Command();

// Setup program metadata
program
  .name('pierre')
  .description('Pierre AI Desktop Assistant CLI')
  .version('0.1.0');

async function main() {
  try {
    logger.info('Starting Pierre CLI...');
    
    // Initialize client connection to Pierre core
    await initializeClient();
    
    // Register all commands
    registerCommands(program);
    
    // Parse command line arguments
    await program.parseAsync(process.argv);
    
    // If no command was provided, show help
    if (process.argv.length <= 2) {
      program.help();
    }
    
  } catch (error) {
    logger.error('Error starting Pierre CLI:', error);
    console.error(chalk.red('Failed to start Pierre CLI. See logs for details.'));
    process.exit(1);
  }
}

// Run the CLI
main().catch(async (err) => {
  logger.error('Unhandled error in main:', err);
  await closeClient();
  process.exit(1);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  logger.info('Shutting down Pierre CLI...');
  await closeClient();
  process.exit(0);
});

process.on('uncaughtException', async (err) => {
  logger.error('Uncaught exception:', err);
  await closeClient();
  process.exit(1);
});