#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from 'commander';
import { initializeClient, closeClient } from './client.js';
import { registerCommands } from './commands/index.js';
import { intro, log, outro } from '@clack/prompts';
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
  .description(packageJson.description)
  .version(packageJson.version);

program.configureHelp({
  formatHelp: (cmd, helper) => {
    return '';
  }
});

async function main() {
  try {
    await initializeClient(program);
    registerCommands(program);
    
    if (process.argv.length <= 2 || process.argv.includes('--help') || process.argv.includes('-h')) {
      const commands = program.commands.map(cmd => {
        return `  ${cmd.name()}${' '.repeat(14 - cmd.name().length)} ${cmd.description()}`;
      }).join('\n');
      
      intro(`▲ ${program.name()} ${program.version()}`);
      log.message(`${program.description()}\n
Options:
  -V, --version   output the version number
  -h, --help      display help for command
  
Commands:
${commands}

help [command]    display help for command`);
      outro();
      
      process.exit(0);
    }
    
    await program.parseAsync(process.argv);
  } catch (error) {
    // Error handling
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