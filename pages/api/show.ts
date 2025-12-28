import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OllamaShowResponse } from '@/types/ollama';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const ShowRequestSchema = z.object({
  model: z.string().min(1),
});

/**
 * POST /api/show
 * Get detailed information about a model
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
    const validation = ShowRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const response = await axios.post<OllamaShowResponse>(
      `${OLLAMA_BASE_URL}/show`,
      { model: validation.data.model }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error showing model:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to show model details',
    });
  }
}
