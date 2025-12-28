import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { z } from 'zod';
import { getOllamaApiUrl } from '@/lib/api-utils';

const DeleteRequestSchema = z.object({
  model: z.string().min(1),
});

/**
 * DELETE /api/delete
 * Delete a model
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

    await axios.delete(`${OLLAMA_BASE_URL}/delete`, {
      data: { model: validation.data.model },
      timeout: 60000, // 1 minute for deletion
    });

    return res.status(200).json({ status: 'deleted', model: validation.data.model });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return res.status(500).json({
      error: error.response?.data?.error || 'Failed to delete model',
    });
  }
}
