import { Command } from 'commander';
import { registerChatCommand } from './chat.js';

/**
 * Registers all commands with the commander program
 */
export function registerCommands(program: Command): void {
  registerChatCommand(program);
}