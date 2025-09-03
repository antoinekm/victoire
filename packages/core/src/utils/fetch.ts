import { USER_AGENT } from '../constants/index.js';

export interface FetchWithRetryOptions {
  headers?: Record<string, string>;
  userAgents?: string[];
  fetchOptions?: Omit<RequestInit, 'headers'>;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { headers = {}, userAgents = [USER_AGENT.DEFAULT, USER_AGENT.FALLBACK], fetchOptions = {} } = options;
  
  let lastError: Error | null = null;
  
  for (const userAgent of userAgents) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'User-Agent': userAgent,
          ...headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
    }
  }
  
  throw lastError!;
}