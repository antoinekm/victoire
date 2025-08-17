import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

export const readFileTool = tool({
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.enum(['utf8', 'binary']).default('utf8').describe('File encoding'),
  }),
  execute: async ({ path, encoding }) => {
    try {
      const resolvedPath = resolve(path);
      const content = await fs.readFile(resolvedPath, encoding === 'utf8' ? 'utf8' : undefined);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          content: encoding === 'utf8' ? content as string : content as Buffer,
          size: content.length,
        },
        message: `Successfully read file: ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to read file: ${path}`,
      };
    }
  },
});