import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const PullRequestSchema = z.object({
  model: z.string().min(1),
  stream: z.boolean().optional().default(false),
});

/**
 * POST /api/pull
 * Pull/download a model from Ollama registry
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
    const validation = PullRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/pull`,
      {
        model: validation.data.model,
        stream: validation.data.stream,
      },
      {
        timeout: 600000, // 10 minutes for model pulls
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error pulling model:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to pull model',
    });
  }
}
