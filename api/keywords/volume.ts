import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { parseJsonLoose } from '../../lib/claude';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { keywords, industry, targetUrl } = req.body || {};
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({
      error: "Field 'keywords' is required and must be a non-empty array.",
      code: 'BAD_REQUEST',
    });
  }
  if (typeof industry !== 'string') {
    return res.status(400).json({
      error: "Field 'industry' is required and must be a string.",
      code: 'BAD_REQUEST',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
      code: 'GEMINI_KEY_MISSING',
    });
  }

  const cleanKeywords = keywords
    .filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0)
    .slice(0, 50);
  if (cleanKeywords.length === 0) {
    return res.status(400).json({
      error: "No valid keyword strings in 'keywords'.",
      code: 'BAD_REQUEST',
    });
  }

  const urlHint = typeof targetUrl === 'string' && targetUrl
    ? `\n【LP/ターゲットURL】${targetUrl}`
    : '';

  const prompt = `あなたはデジタル広告のキーワードプランニング専門家です。
以下のキーワード一覧について、月間検索ボリューム・競合度・直近のトレンドを推定し、JSONで返してください。

【業種】${industry || '指定なし'}${urlHint}

【キーワード一覧】
${cleanKeywords.map((k) => `- ${k}`).join('\n')}

【分類基準】
- volume:
  - high: 月間1万回以上の検索想定（悩み系・大カテゴリ系など）
  - medium: 月間1千〜1万回の検索想定（比較・検討系など）
  - low: 月間1千回未満の検索想定（指名系・ニッチ系など）
- competition:
  - high: 大手競合多数・CPC高騰しがち
  - medium: 中規模競合
  - low: ニッチ・競合少
- trend:
  - up: 直近1年で検索量が増加傾向
  - stable: 横ばい
  - down: 減少傾向
- reason: 上記分類の根拠を40文字以内で簡潔に

出力はJSONのみ（前置き不要）：
{
  "items": [
    { "keyword": "キーワード文字列", "volume": "high|medium|low", "competition": "high|medium|low", "trend": "up|stable|down", "reason": "根拠40文字以内" }
  ]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const raw = response.text || '';
    const parsed = parseJsonLoose<{ items?: unknown }>(raw, {});
    const itemsRaw = Array.isArray(parsed.items) ? parsed.items : [];

    const VOLUME = new Set(['high', 'medium', 'low']);
    const TREND = new Set(['up', 'stable', 'down']);
    const items = itemsRaw
      .map((it: any) => {
        const keyword = typeof it?.keyword === 'string' ? it.keyword : '';
        const volume = VOLUME.has(it?.volume) ? it.volume : 'medium';
        const competition = VOLUME.has(it?.competition) ? it.competition : 'medium';
        const trend = TREND.has(it?.trend) ? it.trend : 'stable';
        const reason = typeof it?.reason === 'string' ? it.reason : '';
        return keyword ? { keyword, volume, competition, trend, reason } : null;
      })
      .filter((x: unknown): x is { keyword: string; volume: string; competition: string; trend: string; reason: string } => x !== null);

    res.json({ items });
  } catch (error: any) {
    const upstreamStatus = error?.status || error?.response?.status || error?.cause?.status || null;
    const upstreamMessage =
      error?.response?.data?.error?.message || error?.error?.message || error?.message || 'Unknown upstream error';
    console.error('[/api/keywords/volume] Gemini API Error:', { message: upstreamMessage, status: upstreamStatus });
    const proxiedStatus =
      typeof upstreamStatus === 'number' && upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502;
    res.status(proxiedStatus).json({
      error: upstreamMessage,
      code: 'KEYWORD_VOLUME_UPSTREAM_ERROR',
      upstream: { status: upstreamStatus },
    });
  }
}
