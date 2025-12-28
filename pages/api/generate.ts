import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getOllamaApiUrl } from '@/lib/api-utils';

export interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  keep_alive?: string | number;
}

/**
 * POST /api/generate
 * Generate a response from a model (also loads the model if not loaded)
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
    const { model, prompt, stream = false, keep_alive } = req.body as GenerateRequest;

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/generate`,
      {
        model,
        prompt: prompt || '',
        stream,
        keep_alive,
      },
      {
        timeout: 300000, // 5 minute timeout for loading large models
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error generating:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to generate response',
    });
  }
}

