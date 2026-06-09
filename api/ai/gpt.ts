import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { model, messages, temperature, max_tokens, response_format } = req.body || {};

  const rawKey = process.env.OPENAI_API_KEY;
  const keyPresent = typeof rawKey === 'string' && rawKey.length > 0;
  const keyTrimmedLength = typeof rawKey === 'string' ? rawKey.trim().length : 0;
  const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

  if (!keyPresent || keyIsWhitespace) {
    console.error('[/api/ai/gpt] OPENAI_API_KEY missing/empty', {
      typeofKey: typeof rawKey,
      rawLength: typeof rawKey === 'string' ? rawKey.length : 0,
      nodeEnv: process.env.NODE_ENV || null,
    });
    return res.status(500).json({
      error: keyIsWhitespace
        ? 'OPENAI_API_KEY is set but contains only whitespace.'
        : 'OPENAI_API_KEY is not configured on the server.',
      code: keyIsWhitespace ? 'GPT_KEY_EMPTY' : 'GPT_KEY_MISSING',
      diagnostics: {
        envVarPresent: keyPresent,
        envVarTypeof: typeof rawKey,
        envVarRawLength: typeof rawKey === 'string' ? rawKey.length : 0,
        nodeEnv: process.env.NODE_ENV || null,
        hint: 'Set OPENAI_API_KEY in the Vercel project environment variables.',
      },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Field 'messages' is required and must be a non-empty array.",
      code: 'BAD_REQUEST',
    });
  }

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        max_tokens: typeof max_tokens === 'number' ? max_tokens : 4096,
        ...(response_format ? { response_format } : {}),
      }),
    });

    const bodyText = await apiResponse.text();
    let bodyJson: any = null;
    try { bodyJson = JSON.parse(bodyText); } catch {}

    if (!apiResponse.ok) {
      console.error('[/api/ai/gpt] OpenAI error:', apiResponse.status, bodyText.slice(0, 500));
      return res.status(apiResponse.status).json({
        error: bodyJson?.error?.message || `OpenAI request failed (${apiResponse.status})`,
        code: 'GPT_UPSTREAM_ERROR',
        upstream: {
          status: apiResponse.status,
          type: bodyJson?.error?.type || null,
          code: bodyJson?.error?.code || null,
        },
        requestedModel: model || 'gpt-4o',
        hint:
          apiResponse.status === 401 || apiResponse.status === 403
            ? 'OpenAI rejected the API key. Verify the key is valid and the project has GPT-4o access.'
            : apiResponse.status === 429
            ? 'Rate limited by OpenAI. Reduce request frequency or check quota.'
            : undefined,
      });
    }

    if (!bodyJson || !Array.isArray(bodyJson.choices) || bodyJson.choices.length === 0) {
      console.error('[/api/ai/gpt] OpenAI returned 2xx with no choices:', bodyText.slice(0, 500));
      return res.status(502).json({
        error: 'OpenAI returned an unexpected response shape (no choices).',
        code: 'GPT_EMPTY_RESPONSE',
      });
    }

    res.json(bodyJson);
  } catch (error: any) {
    console.error('[/api/ai/gpt] error:', error);
    res.status(500).json({ error: error.message, code: 'GPT_INTERNAL_ERROR' });
  }
}
