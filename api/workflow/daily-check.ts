import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/firebase';
import { callClaudeText, parseJsonLoose } from '../../lib/claude';
import { methodGuard } from '../../lib/http';

function mediaBucket(platforms: string[] | undefined): 'google' | 'meta' | 'other' {
  if (!platforms || platforms.length === 0) return 'other';
  const isGoogle = platforms.some((p) =>
    ['GoogleSearch', 'GoogleDisplay', 'TrueView', 'YahooSearch', 'YahooDisplay'].includes(p)
  );
  const isMeta = platforms.some((p) => ['Instagram', 'Facebook'].includes(p));
  if (isGoogle && !isMeta) return 'google';
  if (isMeta && !isGoogle) return 'meta';
  if (isGoogle && isMeta) return 'google';
  return 'other';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    const snap = await db.collection('campaigns').where('ownerUid', '==', userId).get();

    const platformAgg: Record<string, {
      impressions: number; clicks: number; leads: number; spend: number; budget: number;
      roasSum: number; cpaSum: number; cviSum: number; count: number;
    }> = {};

    let totalImpressions = 0, totalClicks = 0, totalLeads = 0, totalSpend = 0, totalBudget = 0;
    let cviSumAll = 0, roasSumAll = 0, cpaSumAll = 0, activeCount = 0;

    snap.forEach((doc) => {
      const c = doc.data() as any;
      if (c.status !== 'active') return;
      const bucket = mediaBucket(c.platforms);
      if (bucket === 'other') return;

      const agg = platformAgg[bucket] || {
        impressions: 0, clicks: 0, leads: 0, spend: 0, budget: 0,
        roasSum: 0, cpaSum: 0, cviSum: 0, count: 0,
      };
      agg.impressions += c.impressions || 0;
      agg.clicks += c.clicks || 0;
      agg.leads += c.leads || 0;
      agg.spend += c.spend || 0;
      agg.budget += c.budget || 0;
      agg.roasSum += c.roas || 0;
      agg.cpaSum += c.cpa || 0;
      agg.cviSum += c.cvi || 0;
      agg.count += 1;
      platformAgg[bucket] = agg;

      totalImpressions += c.impressions || 0;
      totalClicks += c.clicks || 0;
      totalLeads += c.leads || 0;
      totalSpend += c.spend || 0;
      totalBudget += c.budget || 0;
      roasSumAll += c.roas || 0;
      cpaSumAll += c.cpa || 0;
      cviSumAll += c.cvi || 0;
      activeCount += 1;
    });

    const byPlatform = Object.fromEntries(
      Object.entries(platformAgg).map(([k, v]) => [
        k,
        {
          impressions: v.impressions, clicks: v.clicks, leads: v.leads,
          spend: v.spend, budget: v.budget,
          cpa: v.count ? Math.round(v.cpaSum / v.count) : 0,
          roas: v.count ? +(v.roasSum / v.count).toFixed(2) : 0,
          cvi: v.count ? +(v.cviSum / v.count).toFixed(2) : 0,
          campaignCount: v.count,
        },
      ])
    );

    const totals = {
      impressions: totalImpressions, clicks: totalClicks, leads: totalLeads,
      spend: totalSpend, budget: totalBudget,
      cpa: activeCount ? Math.round(cpaSumAll / activeCount) : 0,
      roas: activeCount ? +(roasSumAll / activeCount).toFixed(2) : 0,
      cvi: activeCount ? +(cviSumAll / activeCount).toFixed(2) : 0,
      activeCampaigns: activeCount,
    };

    let aiReport: any = null;
    try {
      const prompt = `以下はAMASユーザーの本日時点の媒体別パフォーマンスです。
異常な数値（CPA急騰、ROAS低下、CVI低下、リードゼロ等）を検知し、
3件以内の具体的な改善提案を日本語で出してください。

【全体】
${JSON.stringify(totals)}

【媒体別】
${JSON.stringify(byPlatform)}

回答は以下のJSONのみで返してください（前置きや説明は付けないこと）:
{
  "summary": "本日の総評（日本語1-2文）",
  "anomalies": [
    { "platform": "google|meta", "metric": "指標名", "severity": "low|medium|high", "detail": "日本語の説明" }
  ],
  "recommendations": [
    { "title": "施策名", "detail": "実行内容（日本語）", "expectedImpact": "期待効果（日本語）" }
  ]
}`;
      const text = await callClaudeText({
        system: 'あなたはAMASのパフォーマンス監査AIです。事実に基づき簡潔に回答してください。JSON形式のみで応答してください。',
        user: prompt,
      });
      aiReport = parseJsonLoose(text, { summary: text || '', anomalies: [], recommendations: [] });
    } catch (err: any) {
      console.error('[daily-check] Claude error:', err);
      aiReport = {
        summary: 'AIによる異常検知に失敗しました。',
        anomalies: [],
        recommendations: [],
        error: err.message,
      };
    }

    res.json({
      userId,
      generatedAt: Date.now(),
      totals,
      byPlatform,
      ...aiReport,
    });
  } catch (error: any) {
    console.error('[daily-check] error:', error);
    res.status(500).json({ error: error.message });
  }
}
