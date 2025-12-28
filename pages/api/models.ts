import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OllamaTagsResponse, OllamaModel } from '@/types/ollama';
import { getOllamaApiUrl } from '@/lib/api-utils';

/**
 * GET /api/models
 * List all installed models
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OLLAMA_BASE_URL = getOllamaApiUrl(req);

  try {
    const response = await axios.get<OllamaTagsResponse>(`${OLLAMA_BASE_URL}/tags`);
    const models = response.data.models || [];

    // Transform models with computed fields
    const transformedModels: OllamaModel[] = models.map((model) => ({
      ...model,
      size: model.size || 0,
    }));

    return res.status(200).json({ models: transformedModels });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to fetch models',
    });
  }
}
