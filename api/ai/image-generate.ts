import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { prompt, size, style, quality } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required.' });
  }

  // gpt-image-1 supports 1024x1024 / 1024x1536 / 1536x1024 / auto.
  const sizeMap: Record<string, '1024x1024' | '1024x1536' | '1536x1024'> = {
    '1200x628': '1536x1024',
    '1080x1080': '1024x1024',
    '1080x1920': '1024x1536',
    '1024x1024': '1024x1024',
    '1024x1536': '1024x1536',
    '1536x1024': '1536x1024',
  };
  const apiSize = sizeMap[size] || '1024x1024';
  const fullPrompt = style ? `${prompt}\n\nStyle: ${style}` : prompt;

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        size: apiSize,
        n: 1,
        quality: quality || 'high',
      }),
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      console.error('[image-generate] OpenAI error:', apiResponse.status, errBody);
      return res.status(apiResponse.status).json({
        error: `OpenAI image generation failed (${apiResponse.status})`,
        detail: errBody,
      });
    }

    const data = await apiResponse.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({ error: 'No image returned from OpenAI.' });
    }

    res.json({
      url: `data:image/png;base64,${b64}`,
      b64_json: b64,
      size: apiSize,
      requestedSize: size || null,
    });
  } catch (error: any) {
    console.error('[image-generate] error:', error);
    res.status(500).json({ error: error.message });
  }
}
