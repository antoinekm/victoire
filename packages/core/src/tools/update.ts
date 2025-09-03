import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

export const updateFileTool = tool({
  description: 'Update a file by replacing specific content with new content',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to update'),
    oldContent: z.string().describe('The exact content to find and replace'),
    newContent: z.string().describe('The new content to replace the old content with'),
    encoding: z.enum(['utf8', 'binary']).default('utf8').describe('File encoding'),
    replaceAll: z.boolean().default(false).describe('Replace all occurrences (default: replace only the first occurrence)'),
  }),
  execute: async ({ path, oldContent, newContent, encoding, replaceAll }) => {
    try {
      const resolvedPath = resolve(path);
      
      // Read the current file content
      const currentContent = await fs.readFile(resolvedPath, encoding);
      
      // Check if the old content exists in the file
      if (!currentContent.includes(oldContent)) {
        return {
          success: false,
          error: 'Content to replace not found in file',
          message: `Could not find the specified content in: ${path}`,
        };
      }
      
      // Perform the replacement
      let updatedContent: string;
      if (replaceAll) {
        updatedContent = currentContent.split(oldContent).join(newContent);
      } else {
        updatedContent = currentContent.replace(oldContent, newContent);
      }
      
      // Write the updated content back to the file
      await fs.writeFile(resolvedPath, updatedContent, encoding);
      
      const replacementCount = replaceAll 
        ? (currentContent.split(oldContent).length - 1)
        : (currentContent.includes(oldContent) ? 1 : 0);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          originalSize: currentContent.length,
          newSize: updatedContent.length,
          replacementCount,
        },
        message: `Successfully updated ${replacementCount} occurrence${replacementCount !== 1 ? 's' : ''} in: ${path}`,
        display: path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to update file: ${path}`,
      };
    }
  },
});