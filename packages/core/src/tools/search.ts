import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';
import { glob } from 'glob';

export const searchFilesTool = tool({
  description: 'Search for files using glob patterns',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern to search for files (e.g., "**/*.ts", "src/**/*.js")'),
    cwd: z.string().default('.').describe('Directory to search in'),
    maxResults: z.number().default(100).describe('Maximum number of results to return'),
    includeContent: z.boolean().default(false).describe('Include file content preview in results'),
  }),
  execute: async ({ pattern, cwd, maxResults, includeContent }) => {
    try {
      const resolvedCwd = resolve(cwd);
      
      const files = await glob(pattern, {
        cwd: resolvedCwd,
        absolute: false,
        nodir: true,
      });
      
      const limitedFiles = files.slice(0, maxResults);
      const results = [];
      
      for (const file of limitedFiles) {
        const fullPath = join(resolvedCwd, file);
        const stats = await fs.stat(fullPath);
        
        const result: {
          path: string;
          fullPath: string;
          size: number;
          modified: Date;
          preview?: string;
          lines?: number;
        } = {
          path: file,
          fullPath,
          size: stats.size,
          modified: stats.mtime,
        };
        
        if (includeContent) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            result.preview = content.slice(0, 500) + (content.length > 500 ? '...' : '');
            result.lines = content.split('\n').length;
          } catch {
            result.preview = '[Binary file or read error]';
          }
        }
        
        results.push(result);
      }
      
      return {
        success: true,
        data: {
          pattern,
          cwd: resolvedCwd,
          matches: results,
          totalFound: files.length,
          showing: limitedFiles.length,
        },
        message: `Found ${files.length} files matching pattern: ${pattern}`,
        display: pattern,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to search files with pattern: ${pattern}`,
        display: pattern,
      };
    }
  },
});

export const grepTool = tool({
  description: 'Search for text patterns within files',
  inputSchema: z.object({
    pattern: z.string().describe('Text pattern or regex to search for'),
    filePattern: z.string().default('**/*').describe('File pattern to search in (glob)'),
    cwd: z.string().default('.').describe('Directory to search in'),
    maxResults: z.number().default(50).describe('Maximum number of matches to return'),
    ignoreCase: z.boolean().default(false).describe('Ignore case when searching'),
    isRegex: z.boolean().default(false).describe('Treat pattern as regular expression'),
  }),
  execute: async ({ pattern, filePattern, cwd, maxResults, ignoreCase, isRegex }) => {
    try {
      const resolvedCwd = resolve(cwd);
      
      const files = await glob(filePattern, {
        cwd: resolvedCwd,
        absolute: false,
        nodir: true,
      });
      
      const searchRegex = isRegex ? 
        new RegExp(pattern, ignoreCase ? 'gi' : 'g') :
        new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignoreCase ? 'gi' : 'g');
      
      const matches = [];
      
      for (const file of files) {
        const fullPath = join(resolvedCwd, file);
        
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const lineMatches = [...line.matchAll(searchRegex)];
            
            for (const match of lineMatches) {
              if (matches.length >= maxResults) break;
              
              matches.push({
                file,
                line: i + 1,
                content: line.trim(),
                match: match[0],
                column: match.index ?? 0,
              });
            }
            
            if (matches.length >= maxResults) break;
          }
        } catch {
          // Skip binary files or files that can't be read
          continue;
        }
        
        if (matches.length >= maxResults) break;
      }
      
      return {
        success: true,
        data: {
          pattern,
          filePattern,
          cwd: resolvedCwd,
          matches,
          totalMatches: matches.length,
          filesSearched: files.length,
        },
        message: `Found ${matches.length} matches for pattern: ${pattern}`,
        display: pattern,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to search for pattern: ${pattern}`,
        display: pattern,
      };
    }
  },
});