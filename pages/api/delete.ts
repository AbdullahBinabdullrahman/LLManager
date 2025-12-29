import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const DeleteRequestSchema = z.object({
  model: z.string().min(1),
});

/**
 * DELETE /api/delete
 * Delete a model from Ollama
 * 
 * Ollama's delete endpoint returns empty response on success (200 OK with no body)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OLLAMA_BASE_URL = getOllamaApiUrl(req);

  try {
    const validation = DeleteRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    // Use fetch instead of axios to properly handle empty responses
    const response = await fetch(`${OLLAMA_BASE_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: validation.data.model }),
      signal: AbortSignal.timeout(60000), // 1 minute timeout
    });

    // Ollama returns 200 with empty body on success, 404 if model doesn't exist
    if (!response.ok) {
      let errorMessage = 'Failed to delete model';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response might not be JSON
        errorMessage = response.statusText || errorMessage;
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    // Success - model deleted
    return res.status(200).json({ status: 'deleted', model: validation.data.model });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    
    // Handle timeout specifically
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout - deletion may still be in progress' });
    }
    
    return res.status(500).json({
      error: error.message || 'Failed to delete model',
    });
  }
}
