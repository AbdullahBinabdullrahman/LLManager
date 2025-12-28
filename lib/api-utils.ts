import type { NextApiRequest } from 'next';

const DEFAULT_OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434/api';

/**
 * Get the Ollama API base URL from the request header or fall back to default
 * The client can pass a custom URL via the 'x-ollama-api-url' header
 */
export function getOllamaApiUrl(req: NextApiRequest): string {
  const customUrl = req.headers['x-ollama-api-url'];
  
  if (customUrl && typeof customUrl === 'string') {
    // Validate the URL format
    try {
      new URL(customUrl);
      return customUrl;
    } catch {
      console.warn('Invalid custom Ollama API URL:', customUrl);
    }
  }
  
  return DEFAULT_OLLAMA_URL;
}

