import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { model, contents, config } = req.body || {};

  const rawKey = process.env.GEMINI_API_KEY;
  const keyPresent = typeof rawKey === 'string' && rawKey.length > 0;
  const keyTrimmedLength = typeof rawKey === 'string' ? rawKey.trim().length : 0;
  const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

  if (!keyPresent || keyIsWhitespace) {
    console.error('[/api/ai/gemini] GEMINI_API_KEY missing/empty', {
      typeofKey: typeof rawKey,
      rawLength: typeof rawKey === 'string' ? rawKey.length : 0,
      nodeEnv: process.env.NODE_ENV || null,
    });
    return res.status(500).json({
      error: keyIsWhitespace
        ? 'GEMINI_API_KEY is set but contains only whitespace.'
        : 'GEMINI_API_KEY is not configured on the server.',
      code: keyIsWhitespace ? 'GEMINI_KEY_EMPTY' : 'GEMINI_KEY_MISSING',
      diagnostics: {
        envVarPresent: keyPresent,
        envVarTypeof: typeof rawKey,
        envVarRawLength: typeof rawKey === 'string' ? rawKey.length : 0,
        nodeEnv: process.env.NODE_ENV || null,
        hint: 'Set GEMINI_API_KEY in the Vercel project environment variables.',
      },
    });
  }

  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: "Field 'model' is required and must be a string.", code: 'BAD_REQUEST' });
  }
  if (!contents) {
    return res.status(400).json({ error: "Field 'contents' is required.", code: 'BAD_REQUEST' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: rawKey });
    const response = await ai.models.generateContent({ model, contents, config });
    res.json({ text: response.text, candidates: response.candidates });
  } catch (error: any) {
    const upstreamStatus = error?.status || error?.response?.status || error?.cause?.status || null;
    const upstreamMessage =
      error?.response?.data?.error?.message || error?.error?.message || error?.message || 'Unknown upstream error';
    const upstreamCode = error?.response?.data?.error?.code || error?.code || error?.name || null;

    console.error('[/api/ai/gemini] Gemini API Error:', {
      message: upstreamMessage, status: upstreamStatus, code: upstreamCode, model, stack: error?.stack,
    });

    const proxiedStatus =
      typeof upstreamStatus === 'number' && upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502;

    res.status(proxiedStatus).json({
      error: upstreamMessage,
      code: 'GEMINI_UPSTREAM_ERROR',
      upstream: { status: upstreamStatus, code: upstreamCode, name: error?.name || null },
      requestedModel: model,
      hint:
        upstreamStatus === 401 || upstreamStatus === 403
          ? 'The API key is rejected by Gemini. Verify the key is valid and that the Gemini API is enabled for this Google Cloud project.'
          : upstreamStatus === 429
          ? 'Rate limited by Gemini. Reduce request frequency or check quota.'
          : undefined,
    });
  }
}
