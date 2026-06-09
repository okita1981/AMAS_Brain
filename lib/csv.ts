// CSV export logic shared by /api/export/csv and /api/export/submit.
// AMAS PlatformType(PascalCase) → media category used to pick a CSV layout.
export type PlatformKind = 'google_search' | 'google_display' | 'meta' | 'yahoo_search' | 'line' | 'x' | null;

export function platformKindOf(p: string): PlatformKind {
  switch (p) {
    case 'GoogleSearch':  return 'google_search';
    case 'GoogleDisplay': return 'google_display';
    case 'Facebook':
    case 'Instagram':     return 'meta';
    case 'YahooSearch':   return 'yahoo_search';
    case 'LINE':          return 'line';
    case 'X':             return 'x';
    default:              return null;
  }
}

export const PLATFORM_LABEL_JA: Record<string, string> = {
  GoogleSearch:  'Google検索',
  GoogleDisplay: 'GDN',
  Facebook:      'Meta(Facebook)',
  Instagram:     'Meta(Instagram)',
  YahooSearch:   'Yahoo!検索',
  LINE:          'LINE',
  X:             'X',
};

function csvCell(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}
function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}
function padArr(arr: string[], len: number): string[] {
  const copy = [...arr];
  while (copy.length < len) copy.push('');
  return copy.slice(0, len);
}
const MATCH_LABEL: Record<string, string> = { exact: 'Exact', phrase: 'Phrase', broad: 'Broad' };

export interface UtmInput {
  enabled?: boolean;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}
const UTM_SOURCES: Record<string, string> = {
  google_search:  'google',
  google_display: 'google',
  meta:           'facebook',
  yahoo_search:   'yahoo',
  line:           'line',
  x:              'twitter',
};
const UTM_CONTENT_AUTO: Record<string, string> = {
  google_search:  'google_search_rsa_01',
  google_display: 'gdn_responsive_01',
  meta:           'meta_feed_01',
  yahoo_search:   'yahoo_search_rsa_01',
  line:           'line_infeed_01',
  x:              'x_timeline_01',
};
export function applyUtm(url: string, kind: NonNullable<PlatformKind>, utm: UtmInput | undefined): string {
  if (!url || !utm || !utm.enabled) return url || '';
  const contentValue = utm.content || UTM_CONTENT_AUTO[kind] || '';
  try {
    const parsed = new URL(url);
    if (UTM_SOURCES[kind]) parsed.searchParams.set('utm_source', UTM_SOURCES[kind]);
    if (utm.medium)   parsed.searchParams.set('utm_medium',   utm.medium);
    if (utm.campaign) parsed.searchParams.set('utm_campaign', utm.campaign);
    if (contentValue) parsed.searchParams.set('utm_content',  contentValue);
    if (utm.term && (kind === 'google_search' || kind === 'yahoo_search')) {
      parsed.searchParams.set('utm_term', utm.term);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export interface CsvCommon {
  campaignName: string;
  adGroupName: string;
  finalUrl: string;
  path1: string;
  path2: string;
  productName: string;
  headlines: string[];
  longHeadline: string;
  descriptions: string[];
  primaryText: string;
  keywords: string[];
  matchType: string;
}

function buildSearchCsv(kind: 'google_search' | 'yahoo_search', d: CsvCommon): string[] {
  const headlines    = padArr(d.headlines, 15);
  const descriptions = padArr(d.descriptions, 4);
  const lines: string[] = [];
  lines.push(csvRow(['# 広告テキスト（Google Ads Editor 形式）', ...Array(30).fill('')]));
  lines.push(csvRow([
    'Campaign', 'Campaign Type', 'Campaign Status',
    'Ad Group', 'Ad Group Status',
    ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`),
    ...Array.from({ length: 4  }, (_, i) => `Description ${i + 1}`),
    'Final URL', 'Path 1', 'Path 2', 'Ad Type', 'Status',
  ]));
  lines.push(csvRow([
    d.campaignName, 'Search', 'Enabled',
    d.adGroupName,  'Enabled',
    ...headlines, ...descriptions,
    d.finalUrl, d.path1, d.path2, 'Responsive search ad', 'Enabled',
  ]));
  if (d.keywords.length > 0) {
    lines.push('');
    lines.push(csvRow(['# キーワード', '', '', '', '']));
    lines.push(csvRow(['Campaign', 'Ad Group', 'Keyword', 'Match Type', 'Status']));
    for (const kw of d.keywords) {
      lines.push(csvRow([d.campaignName, d.adGroupName, kw, MATCH_LABEL[d.matchType] ?? 'Phrase', 'Enabled']));
    }
  }
  return lines;
}
function buildGdnCsv(d: CsvCommon): string[] {
  const shortHeadlines = padArr(d.headlines, 5);
  const descriptions   = padArr(d.descriptions, 5);
  const lines: string[] = [];
  lines.push(csvRow(['# 広告テキスト（Google Ads Editor / GDN 形式）', ...Array(20).fill('')]));
  lines.push(csvRow([
    'Campaign', 'Campaign Type', 'Campaign Status',
    'Ad Group', 'Ad Group Status',
    'Short Headline 1', 'Short Headline 2', 'Short Headline 3', 'Short Headline 4', 'Short Headline 5',
    'Long Headline',
    'Description 1', 'Description 2', 'Description 3', 'Description 4', 'Description 5',
    'Final URL', 'Ad Type', 'Status',
  ]));
  lines.push(csvRow([
    d.campaignName, 'Display', 'Enabled',
    d.adGroupName,  'Enabled',
    ...shortHeadlines, d.longHeadline,
    ...descriptions,
    d.finalUrl, 'Responsive display ad', 'Enabled',
  ]));
  return lines;
}
function buildMetaCsv(d: CsvCommon): string[] {
  const lines: string[] = [];
  lines.push(csvRow(['# ※ Image URL は入稿前に差し替えてください', ...Array(8).fill('')]));
  lines.push(csvRow([
    'Campaign Name', 'Ad Set Name', 'Ad Name',
    'Primary Text', 'Headline', 'Description',
    'CTA Type', 'Image URL', 'Landing Page URL',
  ]));
  lines.push(csvRow([
    d.campaignName, d.adGroupName, `${d.productName}_ad01`,
    d.primaryText, d.headlines[0] ?? '', d.descriptions[0] ?? '',
    'LEARN_MORE', '（要差し替え）', d.finalUrl,
  ]));
  return lines;
}
function buildLineCsv(d: CsvCommon): string[] {
  const lines: string[] = [];
  lines.push(csvRow(['# ※ 画像URLは入稿前に差し替えてください', ...Array(5).fill('')]));
  lines.push(csvRow(['キャンペーン名', '広告グループ名', '広告名', 'タイトル', '説明文', 'リンク先URL']));
  lines.push(csvRow([
    d.campaignName, d.adGroupName, `${d.productName}_ad01`,
    d.headlines[0] ?? '', d.descriptions[0] ?? '', d.finalUrl,
  ]));
  return lines;
}
function buildXCsv(d: CsvCommon): string[] {
  const lines: string[] = [];
  lines.push(csvRow(['# ※ card_image_url は入稿前に差し替えてください', ...Array(6).fill('')]));
  lines.push(csvRow([
    'campaign_name', 'ad_group_name',
    'tweet_text', 'card_title', 'card_description',
    'website_url', 'card_image_url',
  ]));
  lines.push(csvRow([
    d.campaignName, d.adGroupName,
    d.primaryText, d.headlines[0] ?? '', d.descriptions[0] ?? '',
    d.finalUrl, '（要差し替え）',
  ]));
  return lines;
}

export function buildCsvForKind(kind: NonNullable<PlatformKind>, d: CsvCommon): string[] {
  switch (kind) {
    case 'google_search':
    case 'yahoo_search':
      return buildSearchCsv(kind, d);
    case 'google_display':
      return buildGdnCsv(d);
    case 'meta':
      return buildMetaCsv(d);
    case 'line':
      return buildLineCsv(d);
    case 'x':
      return buildXCsv(d);
  }
}

// ファイル名に使いにくい記号を除去（日本語は通す）
export function sanitizeFilename(s: string): string {
  return (s || 'campaign').replace(/[^\w　ぁ-んァ-ン一-龥-]/g, '_').slice(0, 60);
}
