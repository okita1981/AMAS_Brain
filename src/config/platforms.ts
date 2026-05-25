// 媒体スペック定義（ad-campaign-studio から移植）。
// 各媒体の入稿仕様（フィールド・文字数・本数・カウント方式）を集約。
import type { PlatformField, PlatformSpec, PlatformSpecKey } from '../types';

export const PLATFORM_SPECS: Record<PlatformSpecKey, PlatformSpec> = {
  google_ads: {
    key: 'google_ads',
    displayName: 'Google検索広告',
    shortName: 'Google検索',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    fields: [
      { key: 'headline',    label: '見出し', maxChars: 30, maxCount: 15, isList: true, countMethod: 'jp_double', note: '最大15本' },
      { key: 'description', label: '説明文', maxChars: 90, maxCount: 4,  isList: true, countMethod: 'jp_double', note: '最大4本', isTextarea: true },
    ],
  },
  google_display: {
    key: 'google_display',
    displayName: 'Googleディスプレイ（GDN）',
    shortName: 'GDN',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    fields: [
      { key: 'headline',      label: '短い見出し', maxChars: 30, maxCount: 5, isList: true,  countMethod: 'jp_double', note: '最大5本' },
      { key: 'long_headline', label: '長い見出し', maxChars: 90, maxCount: 1, isList: false, countMethod: 'jp_double', isTextarea: true },
      { key: 'description',   label: '説明文',     maxChars: 90, maxCount: 5, isList: true,  countMethod: 'jp_double', note: '最大5本', isTextarea: true },
    ],
  },
  meta: {
    key: 'meta',
    displayName: 'Meta（Facebook / Instagram）',
    shortName: 'Meta',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    fields: [
      { key: 'primary_text', label: '本文',   maxChars: 125, maxCount: 1, isList: false, countMethod: 'simple', note: '125文字超過で省略表示', isTextarea: true },
      { key: 'headline',     label: '見出し', maxChars: 40,  maxCount: 1, isList: false, countMethod: 'simple' },
      { key: 'description',  label: '説明文', maxChars: 30,  maxCount: 1, isList: false, countMethod: 'simple' },
    ],
  },
  yahoo_search: {
    key: 'yahoo_search',
    displayName: 'Yahoo!検索広告',
    shortName: 'Yahoo!',
    color: 'text-red-400',
    badgeBg: 'bg-red-500/10 border-red-500/30',
    fields: [
      { key: 'headline',    label: 'タイトル', maxChars: 30, maxCount: 15, isList: true, countMethod: 'jp_double', note: '最大15本' },
      { key: 'description', label: '説明文',   maxChars: 90, maxCount: 4,  isList: true, countMethod: 'jp_double', note: '最大4本', isTextarea: true },
    ],
  },
  line_ads: {
    key: 'line_ads',
    displayName: 'LINE広告',
    shortName: 'LINE',
    color: 'text-green-400',
    badgeBg: 'bg-green-500/10 border-green-500/30',
    fields: [
      { key: 'title',       label: 'タイトル',     maxChars: 20, maxCount: 1, isList: false, countMethod: 'simple' },
      { key: 'description', label: '説明文',       maxChars: 75, maxCount: 1, isList: false, countMethod: 'simple', isTextarea: true },
      { key: 'long_title',  label: '長いタイトル', maxChars: 35, maxCount: 1, isList: false, countMethod: 'simple', note: '画像（小）選択時に必須' },
    ],
  },
  x_ads: {
    key: 'x_ads',
    displayName: 'X（旧Twitter）広告',
    shortName: 'X',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    fields: [
      { key: 'post_text',        label: '投稿本文',     maxChars: 280, maxCount: 1, isList: false, countMethod: 'half_width', note: 'リンク付き時は実質257文字', isTextarea: true },
      { key: 'card_headline',    label: 'カード見出し', maxChars: 70,  maxCount: 1, isList: false, countMethod: 'half_width' },
      { key: 'card_description', label: 'カード説明文', maxChars: 200, maxCount: 1, isList: false, countMethod: 'half_width', isTextarea: true },
    ],
  },
};

// 全角=2 / 半角=1 を考慮した文字数カウント。
// 'simple' は素の文字数。'jp_double' / 'half_width' は和文系コードポイントを2として加算。
export function countChars(text: string, method: PlatformField['countMethod']): number {
  if (method === 'simple') return text.length;
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);
    count += isWide ? 2 : 1;
  }
  return count;
}
