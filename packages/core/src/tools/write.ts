import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';

export const writeFileTool = tool({
  description: 'Write content to a file, creating directories if needed',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to write'),
    content: z.string().describe('Content to write to the file'),
    encoding: z.enum(['utf8', 'binary']).default('utf8').describe('File encoding'),
    createDirs: z.boolean().default(true).describe('Create parent directories if they don\'t exist'),
  }),
  execute: async ({ path, content, encoding, createDirs }) => {
    try {
      const resolvedPath = resolve(path);
      
      if (createDirs) {
        const dir = dirname(resolvedPath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      await fs.writeFile(resolvedPath, content, encoding);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          size: content.length,
        },
        message: `Successfully wrote ${content.length} characters to: ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to write file: ${path}`,
      };
    }
  },
});