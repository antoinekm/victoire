import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const shellTool = tool({
  description: 'Execute a shell command',
  parameters: z.object({
    command: z.string().describe('Shell command to execute'),
    cwd: z.string().optional().describe('Working directory for the command'),
    timeout: z.number().default(30000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ command, cwd, timeout }) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024, // 1MB
      });
      
      return {
        success: true,
        data: {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command,
          cwd,
        },
        message: `Command executed successfully: ${command}`,
      };
    } catch (error: unknown) {
      const execError = error as any; // exec errors have specific properties
      return {
        success: false,
        error: execError.message,
        data: {
          stdout: execError.stdout?.trim() || '',
          stderr: execError.stderr?.trim() || '',
          command,
          cwd,
          exitCode: execError.code,
        },
        message: `Command failed: ${command}`,
      };
    }
  },
});