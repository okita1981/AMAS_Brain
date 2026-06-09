import type { VercelRequest, VercelResponse } from '@vercel/node';
import { platformKindOf, PLATFORM_LABEL_JA } from '../../lib/csv';
import { methodGuard } from '../../lib/http';

// Mock submission endpoint. Will be wired to Google Ads / Meta Marketing APIs later.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const body = req.body || {};
  const platforms: string[] = Array.isArray(body.platforms) ? body.platforms : [];
  if (platforms.length === 0) {
    return res.status(400).json({ error: 'platforms is required.', code: 'BAD_REQUEST' });
  }
  const now = Date.now();
  const results = platforms.map((platform) => {
    const kind = platformKindOf(platform);
    if (!kind) {
      return {
        platform,
        success: false,
        mode: 'mock' as const,
        message: `${platform} は直接入稿に未対応です`,
      };
    }
    return {
      platform,
      platformLabel: PLATFORM_LABEL_JA[platform] ?? platform,
      success: true,
      mode: 'mock' as const,
      externalId: `MOCK-${kind.toUpperCase()}-${now}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      message: 'モックレスポンス（媒体API未接続）',
    };
  });
  res.json({ results, generatedAt: now });
}
