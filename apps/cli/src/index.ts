#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from 'commander';
import { initializeClient, closeClient, DEFAULT_SERVER_URL } from './client.js';
import { registerCommands } from './commands/index.js';
import { intro, log, outro } from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (process.argv.includes('--version') || process.argv.includes('-V') || process.argv.includes('-v')) {
  const version = packageJson.version;
  const nodeVersion = process.version;
  const platform = `${os.platform()} ${os.release()} (${os.arch()})`;
  const memory = `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`;
  const cpuInfo = os.cpus()[0];
  const serverUrl = process.env.PIERRE_SERVER_URL || DEFAULT_SERVER_URL;

  intro(`⬢ ${packageJson.name}`);
  log.message(`Version:    ${version}
Node:       ${nodeVersion}
Platform:   ${platform}
CPU:        ${cpuInfo?.model.trim()} (${os.cpus().length} cores)
Memory:     ${memory}
Server URL: ${serverUrl}`);
  outro();
  process.exit(0);
}

const program = new Command();

program
  .name(packageJson.name)
  .description('Pierre AI Desktop Assistant CLI')
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
      
      intro(`⬢ ${program.name()} ${program.version()}`);
      log.message(`${program.description()}\n
Options:
  -v, --version   output the version number
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