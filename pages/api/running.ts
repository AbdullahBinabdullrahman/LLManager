import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OllamaPsResponse, OllamaRunningModel } from '@/types/ollama';
import { getOllamaApiUrl } from '@/lib/api-utils';

/**
 * GET /api/running
 * List all running/loaded models
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
    const response = await axios.get<OllamaPsResponse>(`${OLLAMA_BASE_URL}/ps`);
    const models = response.data.models || [];

    // Transform running models
    const transformedModels: OllamaRunningModel[] = models.map((model) => ({
      ...model,
      size: model.size || 0,
      size_vram: model.size_vram || 0,
    }));

    return res.status(200).json({ models: transformedModels });
  } catch (error: any) {
    console.error('Error fetching running models:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to fetch running models',
    });
  }
}
