#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from 'commander';
import { initializeClient, closeClient } from './client.js';
import { registerCommands } from './commands/index.js';
import { outro } from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const program = new Command();

program
  .name(packageJson.name)
  .description('Pierre AI Desktop Assistant CLI')
  .version(packageJson.version);

async function main() {
  try {
    await initializeClient(program);
    registerCommands(program);
    await program.parseAsync(process.argv);
    
    if (process.argv.length <= 2) {
      program.help();
    }
  } catch (error) {
  }
}

main().catch(async () => {
  await closeClient();
});

process.on('SIGINT', async () => {
  outro('Chat session cancelled.');
  await closeClient();
  process.exit(0);
});