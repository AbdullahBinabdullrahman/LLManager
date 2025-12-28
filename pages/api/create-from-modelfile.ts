import type { NextApiRequest, NextApiResponse } from 'next';
import { parseModelfile } from '@/lib/modelfile-parser';
import { z } from 'zod';

const CreateFromModelfileSchema = z.object({
  modelfile: z.string().min(1),
  model: z.string().min(1), // Required model name
});

/**
 * POST /api/create-from-modelfile
 * Parse Modelfile and create model
 * This endpoint parses the Modelfile and then calls the create endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validation = CreateFromModelfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    // Parse the Modelfile
    const parsed = parseModelfile(validation.data.modelfile);

    if (parsed.errors && parsed.errors.length > 0) {
      return res.status(400).json({
        error: 'Modelfile parsing errors',
        details: parsed.errors,
      });
    }

    // Prepare create payload
    const createPayload = {
      ...parsed,
      model: validation.data.model, // Use provided model name
      stream: false,
    };

    // Forward to create endpoint
    const createResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return res.status(createResponse.status).json(errorData);
    }

    const result = await createResponse.json();
    return res.status(200).json({
      ...result,
      parsedModelfile: parsed,
    });
  } catch (error: any) {
    console.error('Error creating model from Modelfile:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create model from Modelfile',
    });
  }
}
