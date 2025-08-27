import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';

export const listDirectoryTool = tool({
  description: 'List contents of a directory',
  inputSchema: z.object({
    path: z.string().default('.').describe('Directory path to list'),
    recursive: z.boolean().default(false).describe('List contents recursively'),
    includeHidden: z.boolean().default(false).describe('Include hidden files and directories'),
    onlyFiles: z.boolean().default(false).describe('Only list files, not directories'),
    onlyDirs: z.boolean().default(false).describe('Only list directories, not files'),
  }),
  execute: async ({ path, recursive, includeHidden, onlyFiles, onlyDirs }) => {
    try {
      const resolvedPath = resolve(path);
      
      const listContents = async (dirPath: string, currentDepth = 0): Promise<string[]> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const results: string[] = [];
        
        for (const entry of entries) {
          if (!includeHidden && entry.name.startsWith('.')) {
            continue;
          }
          
          const fullPath = join(dirPath, entry.name);
          const relativePath = path === '.' ? 
            fullPath.replace(process.cwd() + '/', '') : 
            fullPath.replace(resolvedPath + '/', '');
          
          if (entry.isDirectory()) {
            if (!onlyFiles) {
              results.push(`${'  '.repeat(currentDepth)}📁 ${relativePath}/`);
            }
            
            if (recursive) {
              const subResults = await listContents(fullPath, currentDepth + 1);
              results.push(...subResults);
            }
          } else {
            if (!onlyDirs) {
              const stats = await fs.stat(fullPath);
              const size = stats.size;
              const sizeStr = size < 1024 ? `${size}B` : 
                            size < 1024 * 1024 ? `${Math.round(size / 1024)}KB` :
                            `${Math.round(size / (1024 * 1024))}MB`;
              
              results.push(`${'  '.repeat(currentDepth)}📄 ${relativePath} (${sizeStr})`);
            }
          }
        }
        
        return results;
      };
      
      const contents = await listContents(resolvedPath);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          contents,
          count: contents.length,
        },
        message: `Listed ${contents.length} paths`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to list directory: ${path}`,
      };
    }
  },
});