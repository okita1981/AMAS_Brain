import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaudeText } from '../../lib/claude';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, campaigns } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  if (!Array.isArray(campaigns)) {
    return res.status(400).json({ error: 'campaigns must be an array.' });
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  try {
    // Schema has no daily snapshots; current aggregates are used as a proxy for recent perf.
    const recent = campaigns.filter((c: any) => {
      const created = typeof c.createdAt === 'number' ? c.createdAt : 0;
      return created >= sevenDaysAgo || c.status === 'active';
    });

    const totals = recent.reduce(
      (acc: any, c: any) => {
        acc.impressions += c.impressions || 0;
        acc.clicks += c.clicks || 0;
        acc.leads += c.leads || 0;
        acc.spend += c.spend || 0;
        acc.budget += c.budget || 0;
        acc.roasSum += c.roas || 0;
        acc.cpaSum += c.cpa || 0;
        acc.cviSum += c.cvi || 0;
        acc.count += 1;
        return acc;
      },
      { impressions: 0, clicks: 0, leads: 0, spend: 0, budget: 0, roasSum: 0, cpaSum: 0, cviSum: 0, count: 0 }
    );

    const avg = {
      cpa: totals.count ? Math.round(totals.cpaSum / totals.count) : 0,
      roas: totals.count ? +(totals.roasSum / totals.count).toFixed(2) : 0,
      cvi: totals.count ? +(totals.cviSum / totals.count).toFixed(2) : 0,
    };

    const prompt = `AMASユーザーの過去7日間の運用サマリーを、経営者向けに日本語で執筆してください。
語調は「です・ます」、4〜6文程度、専門用語は控えめに。
最後に「今週のハイライト」「来週の重点アクション」を箇条書きで添えてください。

【期間】
${new Date(sevenDaysAgo).toISOString().slice(0, 10)} 〜 ${new Date(now).toISOString().slice(0, 10)}

【合計】
インプレッション: ${totals.impressions} / クリック: ${totals.clicks} / リード: ${totals.leads}
広告費: ¥${totals.spend} / 予算上限: ¥${totals.budget}

【平均指標】
CPA: ¥${avg.cpa} / ROAS: ${avg.roas} / CVI: ${avg.cvi}

【参考: 対象キャンペーン数】
${totals.count}件`;

    const summary = await callClaudeText({
      system: 'あなたはAMASの広告運用レポートライターです。事実に基づき、誇張せず簡潔に書いてください。',
      user: prompt,
      temperature: 0.6,
    });

    res.json({
      userId,
      generatedAt: now,
      period: { from: sevenDaysAgo, to: now },
      totals: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        leads: totals.leads,
        spend: totals.spend,
        budget: totals.budget,
        campaignCount: totals.count,
      },
      averages: avg,
      summary,
    });
  } catch (error: any) {
    console.error('[weekly-report] error:', error);
    res.status(500).json({ error: error.message });
  }
}
