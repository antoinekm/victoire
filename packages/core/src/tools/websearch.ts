import { tool } from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { fetchWithRetry } from '../utils/index.js';

export const webSearchTool = tool({
  description: 'Search the web using DuckDuckGo',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().default(5).describe('Maximum number of results to return (max 10)'),
  }),
  execute: async ({ query, maxResults }) => {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetchWithRetry(searchUrl);

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const results: Array<{title: string, url: string, description: string}> = [];
      
      // Parse search results from DuckDuckGo HTML
      $('.result').each((index, element) => {
        if (index >= maxResults) return false;
        
        const $result = $(element);
        const titleElement = $result.find('.result__title a');
        const snippetElement = $result.find('.result__snippet');
        
        const title = titleElement.text().trim();
        const url = titleElement.attr('href') || '';
        const description = snippetElement.text().trim();
        
        if (title && url) {
          results.push({
            title,
            url: url.startsWith('//') ? `https:${url}` : url,
            description: description || 'No description available',
          });
        }
      });

      return {
        success: true,
        data: {
          query,
          results,
          totalResults: results.length,
        },
        message: `Found ${results.length} results for: ${query}`,
        display: query,
      };
    } catch (error) {
      console.error('WebSearch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to search for: ${query}`,
        display: query,
      };
    }
  },
});