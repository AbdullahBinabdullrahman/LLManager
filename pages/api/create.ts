import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OllamaCreateRequest } from '@/types/ollama';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const CreateRequestSchema = z.object({
  from: z.string().optional(),
  model: z.string().min(1),
  system: z.string().optional(),
  template: z.string().optional(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  license: z.string().optional(),
  stream: z.boolean().optional().default(false),
  quantize: z.string().optional(),
});

/**
 * POST /api/create
 * Create a new model from base model or Modelfile
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
    const validation = CreateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const payload: OllamaCreateRequest = {
      ...validation.data,
      stream: validation.data.stream || false,
    };

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/create`,
      payload,
      {
        timeout: 600000, // 10 minutes for model creation
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error creating model:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to create model',
    });
  }
}
