import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

/**
 * Schema for validating HF image download requests
 */
const HFImageRequestSchema = z.object({
  dataset: z.string().min(1, 'Dataset path is required'),
  imagePath: z.string().min(1, 'Image path is required'),
  action: z.enum(['preview', 'download']).default('preview'),
});

/**
 * Response type for HF image operations
 */
interface HFImageResponse {
  success: boolean;
  url?: string;
  filename?: string;
  savedPath?: string;
  contentType?: string;
  size?: number;
  error?: string;
}

/**
 * Build the Hugging Face resolve URL for a dataset image
 */
function buildHFResolveUrl(dataset: string, imagePath: string): string {
  // Clean up the dataset path (remove leading/trailing slashes)
  const cleanDataset = dataset.replace(/^\/+|\/+$/g, '');
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  return `https://huggingface.co/datasets/${cleanDataset}/resolve/main/${cleanPath}`;
}

/**
 * Extract filename from path
 */
function extractFilename(imagePath: string): string {
  return path.basename(imagePath);
}

/**
 * Ensure the download directory exists
 */
function ensureDownloadDir(): string {
  const downloadDir = path.join(process.cwd(), 'public', 'downloads', 'hf-images');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  return downloadDir;
}

/**
 * Generate a unique filename to avoid overwrites
 */
function generateUniqueFilename(downloadDir: string, originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  let filename = originalFilename;
  let counter = 1;
  
  while (fs.existsSync(path.join(downloadDir, filename))) {
    filename = `${baseName}_${counter}${ext}`;
    counter++;
  }
  
  return filename;
}

/**
 * POST /api/hf-images
 * Fetch metadata or download images from Hugging Face datasets
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HFImageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const validation = HFImageRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors.map(e => e.message).join(', '),
      });
    }

    const { dataset, imagePath, action } = validation.data;
    const resolveUrl = buildHFResolveUrl(dataset, imagePath);
    const filename = extractFilename(imagePath);

    if (action === 'preview') {
      // For preview, just verify the image exists and return metadata
      const headResponse = await fetch(resolveUrl, { method: 'HEAD' });
      
      if (!headResponse.ok) {
        return res.status(404).json({
          success: false,
          error: `Image not found: ${headResponse.status} ${headResponse.statusText}`,
        });
      }

      const contentType = headResponse.headers.get('content-type') || 'image/unknown';
      const contentLength = headResponse.headers.get('content-length');
      
      // Validate it's actually an image
      if (!contentType.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: `Not an image file. Content-Type: ${contentType}`,
        });
      }

      return res.status(200).json({
        success: true,
        url: resolveUrl,
        filename,
        contentType,
        size: contentLength ? parseInt(contentLength, 10) : undefined,
      });
    }

    if (action === 'download') {
      // Download the image
      const response = await fetch(resolveUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Failed to download: ${response.status} ${response.statusText}`,
        });
      }

      const contentType = response.headers.get('content-type') || 'image/unknown';
      
      // Validate it's actually an image
      if (!contentType.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: `Not an image file. Content-Type: ${contentType}`,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save to local storage
      const downloadDir = ensureDownloadDir();
      const uniqueFilename = generateUniqueFilename(downloadDir, filename);
      const savePath = path.join(downloadDir, uniqueFilename);
      
      fs.writeFileSync(savePath, buffer);

      return res.status(200).json({
        success: true,
        url: resolveUrl,
        filename: uniqueFilename,
        savedPath: `/downloads/hf-images/${uniqueFilename}`,
        contentType,
        size: buffer.length,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process image request';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}

