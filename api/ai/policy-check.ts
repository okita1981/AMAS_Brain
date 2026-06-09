import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { headline, description, industry, platform } = req.body || {};
  if (!headline || !description) {
    return res.status(400).json({
      error: "Fields 'headline' and 'description' are required.",
      code: 'BAD_REQUEST',
    });
  }

  const rawKey = process.env.GEMINI_API_KEY;
  const keyPresent = typeof rawKey === 'string' && rawKey.length > 0;
  const keyTrimmedLength = typeof rawKey === 'string' ? rawKey.trim().length : 0;
  const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

  if (!keyPresent || keyIsWhitespace) {
    console.error('[/api/ai/policy-check] GEMINI_API_KEY missing/empty', {
      typeofKey: typeof rawKey,
      rawLength: typeof rawKey === 'string' ? rawKey.length : 0,
      nodeEnv: process.env.NODE_ENV || null,
    });
    return res.status(500).json({
      error: keyIsWhitespace
        ? 'GEMINI_API_KEY is set but contains only whitespace.'
        : 'GEMINI_API_KEY is not configured on the server.',
      code: keyIsWhitespace ? 'GEMINI_KEY_EMPTY' : 'GEMINI_KEY_MISSING',
    });
  }

  const prompt = `
        あなたは広告代理店の法務・審査担当AIです。
        以下の広告案が、日本の法律（薬機法、景表法）および${platform}の広告ポリシーに準拠しているか厳密に審査してください。

        【広告案】
        業種: ${industry}
        見出し: ${headline}
        説明文: ${description}

        【審査基準】
        1. 薬機法: 医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律。誇大広告や未承認の効能効果の標榜を禁止。
        2. 景表法: 不当景品類及び不当表示防止法。優良誤認（実際より著しく優良と見せかける）、有利誤認（実際より著しく有利と見せかける）を禁止。
        3. 媒体ポリシー: ${platform}の禁止コンテンツ（不適切な表現、過度な露出、虚偽の主張など）。

        【出力形式】
        JSON形式で出力してください。
        {
          "status": "approved" | "warning" | "rejected",
          "violations": [
            { "type": "薬機法" | "景表法" | "ポリシー", "reason": "具体的な理由", "suggestion": "修正案" }
          ],
          "score": 0-100 (100が最も安全)
        }
      `;

  let responseText: string | undefined;
  try {
    const ai = new GoogleGenAI({ apiKey: rawKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    responseText = response.text;
  } catch (error: any) {
    const upstreamStatus = error?.status || error?.response?.status || error?.cause?.status || null;
    const upstreamMessage =
      error?.response?.data?.error?.message || error?.error?.message || error?.message || 'Unknown upstream error';
    const upstreamCode = error?.response?.data?.error?.code || error?.code || error?.name || null;

    console.error('[/api/ai/policy-check] Gemini API Error:', {
      message: upstreamMessage, status: upstreamStatus, code: upstreamCode, stack: error?.stack,
    });

    const proxiedStatus =
      typeof upstreamStatus === 'number' && upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502;

    return res.status(proxiedStatus).json({
      error: upstreamMessage,
      code: 'POLICY_UPSTREAM_ERROR',
      upstream: { status: upstreamStatus, code: upstreamCode, name: error?.name || null },
      hint:
        upstreamStatus === 401 || upstreamStatus === 403
          ? 'The API key is rejected by Gemini. Verify the key is valid and that the Gemini API is enabled.'
          : upstreamStatus === 429
          ? 'Rate limited by Gemini. Reduce request frequency or check quota.'
          : undefined,
    });
  }

  if (!responseText) {
    return res.status(502).json({
      error: 'Gemini returned an empty response.',
      code: 'POLICY_EMPTY_RESPONSE',
    });
  }

  try {
    res.json(JSON.parse(responseText));
  } catch (parseError: any) {
    console.error('[/api/ai/policy-check] JSON parse failed:', {
      message: parseError?.message,
      sample: responseText.slice(0, 500),
    });
    res.status(502).json({
      error: 'Failed to parse Gemini response as JSON.',
      code: 'POLICY_PARSE_ERROR',
      parseMessage: parseError?.message || null,
      rawSample: responseText.slice(0, 500),
    });
  }
}
