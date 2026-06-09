import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaudeText, parseJsonLoose } from '../../lib/claude';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, campaigns } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  if (!Array.isArray(campaigns)) {
    return res.status(400).json({ error: 'campaigns must be an array.' });
  }

  try {
    const summarized = campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      platforms: c.platforms,
      status: c.status,
      budget: c.budget || 0,
      spend: c.spend || 0,
      leads: c.leads || 0,
      cpa: c.cpa || 0,
      roas: c.roas || 0,
      cvi: c.cvi || 0,
    }));

    const prompt = `以下はユーザーの保有キャンペーン一覧です。
CVIが低い（=資本効率が悪い）キャンペーンから、CVIが高いキャンペーンへ
予算を再配分する「提案」を作成してください。実際の更新は行いません。

【キャンペーン一覧】
${JSON.stringify(summarized)}

【ルール】
- 元キャンペーンの予算より大きい額の移動は提案しない。
- 同一キャンペーン内の移動は提案しない。
- 月予算合計は変えない（=ゼロサム再配分）。
- 提案件数は最大5件まで。

回答は以下のJSONのみで返してください（前置きや説明は付けないこと）:
{
  "summary": "全体の方針（日本語1-2文）",
  "proposals": [
    {
      "fromCampaignId": "...", "fromCampaignName": "...",
      "toCampaignId": "...", "toCampaignName": "...",
      "amount": 移動額（円, 整数）,
      "reason": "日本語の根拠",
      "expectedCVIDelta": 数値(例: +1.2)
    }
  ]
}`;

    const text = await callClaudeText({
      system: 'あなたはAMASの広告予算オプティマイザです。提案のみを返し、実行はしません。JSON形式のみで応答してください。',
      user: prompt,
    });

    const data = parseJsonLoose(text, { summary: text || '', proposals: [] });

    res.json({
      userId,
      generatedAt: Date.now(),
      applied: false,
      ...data,
    });
  } catch (error: any) {
    console.error('[budget-rebalance] error:', error);
    res.status(500).json({ error: error.message });
  }
}
