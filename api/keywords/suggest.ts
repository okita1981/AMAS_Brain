import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { parseJsonLoose } from '../../lib/claude';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { industry, targetUrl, platforms, keywords: seedKeywords } = req.body || {};
  if (typeof industry !== 'string' || industry.trim().length === 0) {
    return res.status(400).json({
      error: "Field 'industry' is required and must be a non-empty string.",
      code: 'BAD_REQUEST',
    });
  }

  const seedHint = Array.isArray(seedKeywords) && seedKeywords.length > 0
    ? `\n【既存キーワード（重複避ける）】${seedKeywords.join('、')}`
    : '';
  const urlHint = typeof targetUrl === 'string' && targetUrl
    ? `\n【LP/ターゲットURL】${targetUrl}`
    : '';
  const platformHint = Array.isArray(platforms) && platforms.length > 0
    ? `\n【配信媒体】${platforms.join('、')}`
    : '';

  const userPrompt = `以下の情報をもとに、Google検索広告 / Yahoo!検索広告向けのキーワード候補を15件提案してください。

【業種】${industry}${urlHint}${platformHint}${seedHint}

条件：
- 実際の検索キーワードとして使われそうな自然な表現
- 2〜5語程度（短すぎず長すぎない）
- ブランド指名・一般・課題系ワードをバランスよく
- 日本語キーワードを中心に

JSON形式のみで出力（説明や前置きは不要）：
{ "keywords": ["キーワード1", "キーワード2", ...] }`;

  async function viaGpt(): Promise<string[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'あなたは検索広告のキーワードプランナーです。JSON形式のみで応答してください。' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    });
    if (!apiResponse.ok) throw new Error(`OpenAI ${apiResponse.status}`);
    const data = await apiResponse.json();
    const text: string = data?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonLoose<{ keywords?: unknown }>(text, {});
    const list = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    return list.filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0).slice(0, 15);
  }

  async function viaGemini(): Promise<string[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = parseJsonLoose<{ keywords?: unknown }>(response.text || '', {});
    const list = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    return list.filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0).slice(0, 15);
  }

  try {
    let result: string[];
    try {
      result = await viaGpt();
    } catch (err: any) {
      console.warn('[/api/keywords/suggest] GPT-4o failed, falling back to Gemini:', err?.message);
      result = await viaGemini();
    }
    res.json({ keywords: result });
  } catch (error: any) {
    console.error('[/api/keywords/suggest] error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to suggest keywords',
      code: 'KEYWORD_SUGGEST_ERROR',
    });
  }
}
