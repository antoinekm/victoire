import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';

const execPromise = promisify(exec);

// List of potentially dangerous commands that should be blocked
const BLOCKED_COMMANDS = [
  'rm -rf', 'format', 'mkfs', 'dd', 'shred',  // Destructive filesystem operations
  ';', '&&', '||', '|', '>', '>>', '<',       // Command chaining/redirection
  'curl.*\\.sh.*\\| sh', 'wget.*\\| sh',      // Piping downloads to shell
  'chmod 777', 'sudo rm'                      // Dangerous permission changes
];

/**
 * Checks if a command contains blocked patterns
 */
function isCommandSafe(command: string): boolean {
  const lowerCommand = command.toLowerCase();
  
  return !BLOCKED_COMMANDS.some(blocked => lowerCommand.includes(blocked));
}

/**
 * Executes a system command safely
 */
export async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  // Safety check
  if (!isCommandSafe(command)) {
    logger.warn(`Blocked potentially unsafe command: ${command}`);
    return {
      stdout: '',
      stderr: 'This command was blocked for security reasons.'
    };
  }
  
  try {
    logger.info(`Executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    return { stdout, stderr };
  } catch (error: any) {
    logger.error(`Error executing command: ${command}`, error);
    return {
      stdout: '',
      stderr: error.message || 'Unknown error occurred'
    };
  }
}