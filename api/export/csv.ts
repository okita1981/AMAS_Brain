import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  platformKindOf, applyUtm, buildCsvForKind, sanitizeFilename,
  CsvCommon, UtmInput,
} from '../../lib/csv';
import { methodGuard } from '../../lib/http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const body = req.body || {};
  const platforms: string[] = Array.isArray(body.platforms) ? body.platforms : [];
  if (platforms.length === 0) {
    return res.status(400).json({ error: 'platforms is required.', code: 'BAD_REQUEST' });
  }
  const campaignName: string = typeof body.campaignName === 'string' && body.campaignName.trim()
    ? body.campaignName.trim() : 'campaign';
  const productName: string = typeof body.productName === 'string' && body.productName.trim()
    ? body.productName.trim() : campaignName;
  const adGroupName: string = typeof body.adGroupName === 'string' && body.adGroupName.trim()
    ? body.adGroupName.trim() : `${campaignName}_広告グループ01`;
  const baseFinalUrl: string = typeof body.landingPageUrl === 'string' ? body.landingPageUrl : '';
  const path1: string = typeof body.path1 === 'string' ? body.path1 : '';
  const path2: string = typeof body.path2 === 'string' ? body.path2 : '';
  const headlines: string[] = Array.isArray(body.headlines)
    ? body.headlines.filter((h: unknown) => typeof h === 'string') : [];
  const descriptions: string[] = Array.isArray(body.descriptions)
    ? body.descriptions.filter((d: unknown) => typeof d === 'string') : [];
  const longHeadline: string = typeof body.longHeadline === 'string'
    ? body.longHeadline : (descriptions[0] ?? '');
  const primaryText: string = typeof body.primaryText === 'string' ? body.primaryText : (descriptions[0] ?? '');
  const keywords: string[] = Array.isArray(body.keywords)
    ? body.keywords.filter((k: unknown) => typeof k === 'string') : [];
  const matchType: string = typeof body.matchType === 'string' ? body.matchType : 'phrase';
  const utm: UtmInput | undefined = body.utm && typeof body.utm === 'object' ? body.utm : undefined;

  const files: { platform: string; filename: string; content: string }[] = [];
  const seenKinds = new Set<string>();
  for (const platform of platforms) {
    const kind = platformKindOf(platform);
    if (!kind) continue;
    // Facebook と Instagram は同じ meta CSV を二重生成しないよう抑制
    if (kind === 'meta' && seenKinds.has('meta')) continue;
    seenKinds.add(kind);

    const finalUrl = applyUtm(baseFinalUrl, kind, utm);
    const common: CsvCommon = {
      campaignName, adGroupName, finalUrl, path1, path2, productName,
      headlines, longHeadline, descriptions, primaryText,
      keywords, matchType,
    };
    const lines = buildCsvForKind(kind, common);
    const bom = '﻿';
    const content = bom + lines.join('\r\n');
    files.push({
      platform: kind === 'meta' ? 'Meta' : platform,
      filename: `${sanitizeFilename(productName)}_${kind}.csv`,
      content,
    });
  }

  if (files.length === 0) {
    return res.status(400).json({
      error: 'Selected platforms do not support CSV export.',
      code: 'EXPORT_NO_SUPPORTED_PLATFORM',
    });
  }
  res.json({ files });
}
