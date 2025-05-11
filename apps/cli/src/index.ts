#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from 'commander';
import { initializeClient, closeClient } from './client.js';
import { registerCommands } from './commands/index.js';
import { cancel, intro, log, outro } from '@clack/prompts';

// Load environment variables
dotenv.config();

// Create the command program
const program = new Command();

// Setup program metadata
program
  .name('@pierre/cli')
  .description('Pierre AI Desktop Assistant CLI')
  .version('0.1.0');

async function main() {
  try {
    // Initialize client connection to Pierre core
    await initializeClient(program);
    
    // Register all commands
    registerCommands(program);
    
    // Parse command line arguments
    await program.parseAsync(process.argv);
    
    // If no command was provided, show help
    if (process.argv.length <= 2) {
      program.help();
    }
    
  } catch (error) {
    cancel(`Failed to start @pierre/cli: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main().catch(async (err) => {
  log.error(`Unhandled error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  await closeClient();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await closeClient();
  process.exit(0);
});

process.on('uncaughtException', async (err) => {
  log.error(`Uncaught exception: ${err.message}`);
  await closeClient();
  process.exit(1);
});