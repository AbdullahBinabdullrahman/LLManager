import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const PullStreamRequestSchema = z.object({
  model: z.string().min(1),
});

/**
 * POST /api/pull-stream
 * Pull/download a model from Ollama registry with streaming progress updates
 * Returns Server-Sent Events (SSE) for real-time progress
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OLLAMA_BASE_URL = getOllamaApiUrl(req);

  try {
    const validation = PullStreamRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const modelName = validation.data.model;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Start the pull request to Ollama with streaming enabled
    const response = await fetch(`${OLLAMA_BASE_URL}/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        stream: true,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to pull model';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      // Send error event
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
      return;
    }

    if (!response.body) {
      res.write(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
      res.end();
      return;
    }

    // Stream the response from Ollama
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines (Ollama sends JSON objects separated by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              // Format progress data
              const progressData: {
                status: string;
                digest?: string;
                total?: number;
                completed?: number;
                percent?: number;
                done?: boolean;
                error?: string;
              } = {
                status: data.status || 'unknown',
              };

              if (data.digest) {
                progressData.digest = data.digest;
              }

              if (data.total !== undefined) {
                progressData.total = data.total;
              }

              if (data.completed !== undefined) {
                progressData.completed = data.completed;
              }

              // Calculate percentage if we have both values
              if (data.total && data.completed) {
                progressData.percent = Math.round((data.completed / data.total) * 100);
              }

              // Check if download is complete
              if (data.status === 'success') {
                progressData.done = true;
              }

              if (data.error) {
                progressData.error = data.error;
              }

              // Send SSE event
              res.write(`data: ${JSON.stringify(progressData)}\n\n`);
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          res.write(`data: ${JSON.stringify({
            status: data.status || 'unknown',
            done: data.status === 'success',
          })}\n\n`);
        } catch {
          // Skip invalid JSON
        }
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ done: true, status: 'success' })}\n\n`);
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ error: streamError.message || 'Stream error' })}\n\n`);
    } finally {
      res.end();
    }
  } catch (error: any) {
    console.error('Error pulling model:', error);
    
    // Try to send error as SSE if headers haven't been sent
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    
    res.write(`data: ${JSON.stringify({ 
      error: error.message || 'Failed to pull model',
      done: true 
    })}\n\n`);
    res.end();
  }
}

// Disable body parser timeout for streaming
export const config = {
  api: {
    responseLimit: false,
  },
};

