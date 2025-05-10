import { Command } from 'commander';
import { registerExecCommand } from './exec.js';
import { registerCaptureCommand } from './capture.js';
import { registerAskCommand } from './ask.js';
import { registerStatusCommand } from './status.js';

/**
 * Registers all commands with the commander program
 */
export function registerCommands(program: Command): void {
  // Register each command
  registerExecCommand(program);
  registerCaptureCommand(program);
  registerAskCommand(program);
  registerStatusCommand(program);
}