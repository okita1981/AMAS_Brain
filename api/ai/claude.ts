import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { model, system, messages, temperature } = req.body || {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: system,
      messages: messages,
      temperature: temperature || 0.7,
    });

    res.json(response);
  } catch (error: any) {
    console.error('Claude API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
