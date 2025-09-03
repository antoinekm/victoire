import { tool } from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { USER_AGENT } from '../constants/index.js';

export const webFetchTool = tool({
  description: 'Fetch and extract content from a web page',
  inputSchema: z.object({
    url: z.string().url().describe('URL to fetch'),
    extractText: z.boolean().default(true).describe('Extract text content from the page'),
    extractLinks: z.boolean().default(false).describe('Extract all links from the page'),
  }),
  execute: async ({ url, extractText, extractLinks }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT.FALLBACK
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      let content = '';
      const links: string[] = [];
      
      if (extractText) {
        // Remove script and style elements
        $('script, style, nav, footer, header').remove();
        
        // Extract main content
        const mainContent = $('main, article, .content, #content').first();
        if (mainContent.length > 0) {
          content = mainContent.text().trim();
        } else {
          content = $('body').text().trim();
        }
        
        // Clean up whitespace
        content = content.replace(/\s+/g, ' ').trim();
      }
      
      if (extractLinks) {
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && href.startsWith('http')) {
            links.push(href);
          }
        });
      }

      return {
        success: true,
        data: {
          url,
          title: $('title').text().trim(),
          content: content.slice(0, 5000), // Limit to 5000 chars
          links: links.slice(0, 20), // Limit to 20 links
        },
        message: `Successfully fetched content from ${url}`,
        display: url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to fetch content from: ${url}`,
        display: url,
      };
    }
  },
});