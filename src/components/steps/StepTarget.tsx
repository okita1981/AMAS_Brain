// ターゲット・キーワード設定ステップ。
// ad-campaign-studio (CLAUDE スイッチメディア配下) の Step3Target.tsx を
// AMAS のライトテーマ Tailwind に合わせて移植したもの。
import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronRight, Loader2, Plus, Sparkles, X } from 'lucide-react';
import type {
  PlatformType,
  TargetInfo,
  TargetGender,
  TargetDevice,
  TargetRegionType,
  PlatformTargetDetail,
  KeywordSuggestion,
} from '../../types';
import { estimateKeywordVolume } from '../../services/aiService';

// ── 都道府県（地方ブロック別） ────────────────
const PREFECTURE_GROUPS = [
  { label: '北海道・東北', prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { label: '関東', prefectures: ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'] },
  { label: '中部', prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
  { label: '近畿', prefectures: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { label: '中国・四国', prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'] },
  { label: '九州・沖縄', prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] },
];

const shortName = (pref: string) => pref.replace(/[都道府県]$/, '');
const AGE_GROUPS = ['10代', '20代', '30代', '40代', '50代', '60代以上'];

// ── PlatformType → 詳細UI種別 ────────────────
// 同じUIテンプレートを共有する媒体をまとめる
type DetailKind = 'google_search' | 'google_display' | 'meta' | 'yahoo_search' | 'line' | 'x' | null;

function detailKindOf(p: PlatformType): DetailKind {
  switch (p) {
    case 'GoogleSearch':  return 'google_search';
    case 'GoogleDisplay': return 'google_display';
    case 'Facebook':
    case 'Instagram':     return 'meta';
    case 'YahooSearch':   return 'yahoo_search';
    case 'LINE':          return 'line';
    case 'X':             return 'x';
    default:              return null; // TrueView/YahooDisplay/TikTok は詳細UI未対応
  }
}

const SEARCH_PLATFORMS: PlatformType[] = ['GoogleSearch', 'YahooSearch'];

// 媒体の日本語表示名（PLATFORM_LABELSは英字のenum値なので、こちらで上書き）
const PLATFORM_DISPLAY_NAMES: Partial<Record<PlatformType, string>> = {
  GoogleSearch:  'Google検索広告',
  GoogleDisplay: 'Googleディスプレイ（GDN）',
  YahooSearch:   'Yahoo!検索広告',
  YahooDisplay:  'Yahoo!ディスプレイ',
  TrueView:      'YouTube（TrueView）',
  Facebook:      'Facebook広告',
  Instagram:     'Instagram広告',
  LINE:          'LINE広告',
  X:             'X（旧Twitter）広告',
  TikTok:        'TikTok広告',
};

// ── 汎用 RadioPills（単一選択） ────────────────
function RadioPills<T extends string>({
  options, value, onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            value === opt.key ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── 複数選択 CheckPills ───────────────────────
function CheckPills({
  options, values, onChange,
}: {
  options: { key: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (key: string) =>
    onChange(values.includes(key) ? values.filter(k => k !== key) : [...values, key]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = values.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              active ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {active && '✓ '}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── 媒体別詳細設定 Expander ───────────────────
function PlatformDetailExpander({
  platformKey,
  label,
  targetInfo,
  setTargetInfo,
}: {
  platformKey: PlatformType;
  label: string;
  targetInfo: TargetInfo;
  setTargetInfo: React.Dispatch<React.SetStateAction<TargetInfo>>;
}) {
  const [open, setOpen] = useState(false);
  const kind = detailKindOf(platformKey);
  const detail: PlatformTargetDetail = targetInfo.platformDetails[platformKey] ?? {};

  const updateDetail = (updates: Partial<PlatformTargetDetail>) => {
    setTargetInfo(prev => ({
      ...prev,
      platformDetails: {
        ...prev.platformDetails,
        [platformKey]: { ...(prev.platformDetails[platformKey] ?? {}), ...updates },
      },
    }));
  };

  if (kind === null) return null;

  const MATCH_TYPES = [
    { key: 'exact',  label: '完全一致' },
    { key: 'phrase', label: 'フレーズ一致' },
    { key: 'broad',  label: 'インテント一致' },
  ];
  const BID_STRATEGIES = [
    { key: 'maximize_clicks', label: 'クリック最大化' },
    { key: 'target_cpa',      label: '目標CPA' },
    { key: 'target_roas',     label: '目標ROAS' },
  ];
  const YAHOO_BID = [
    { key: 'maximize_clicks', label: 'クリック最大化' },
    { key: 'target_cpa',      label: '目標CPA' },
  ];
  const META_PLACEMENTS = [
    { key: 'fb_feed', label: 'FB Feed' },
    { key: 'ig_feed', label: 'IG Feed' },
    { key: 'stories', label: 'Stories' },
    { key: 'reels',   label: 'Reels' },
  ];
  const CAMPAIGN_OBJECTIVES = [
    { key: 'awareness',  label: '認知' },
    { key: 'traffic',    label: 'トラフィック' },
    { key: 'conversion', label: 'CV' },
  ];
  const OPT_EVENTS = [
    { key: 'purchase', label: '購入' },
    { key: 'lead',     label: 'リード' },
    { key: 'signup',   label: '登録' },
    { key: 'other',    label: 'その他' },
  ];
  const AUDIENCE_TYPES = [
    { key: 'remarketing', label: 'リマーケティング' },
    { key: 'similar',     label: '類似オーディエンス' },
    { key: 'custom',      label: 'カスタムオーディエンス' },
    { key: 'keyword',     label: 'キーワードターゲティング' },
  ];
  const LINE_FORMATS = [
    { key: 'infeed',       label: 'インフィード' },
    { key: 'talkheadview', label: 'Talk Head View' },
    { key: 'carousel',     label: 'カルーセル' },
  ];
  const LINE_PLACEMENTS = [
    { key: 'timeline', label: 'タイムライン' },
    { key: 'talk',     label: 'トーク' },
  ];
  const X_OBJECTIVES = [
    { key: 'reach',         label: 'リーチ' },
    { key: 'engagement',    label: 'エンゲージメント' },
    { key: 'followers',     label: 'フォロワー獲得' },
    { key: 'website_visit', label: 'ウェブサイト訪問' },
  ];

  const renderContent = () => {
    if (kind === 'google_search') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">マッチタイプ（デフォルト）</p>
            <RadioPills
              options={MATCH_TYPES as { key: 'exact' | 'phrase' | 'broad'; label: string }[]}
              value={(detail.matchType ?? 'phrase') as 'exact' | 'phrase' | 'broad'}
              onChange={v => updateDetail({ matchType: v })}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">入札戦略</p>
            <RadioPills
              options={BID_STRATEGIES as { key: NonNullable<PlatformTargetDetail['bidStrategy']>; label: string }[]}
              value={(detail.bidStrategy ?? 'maximize_clicks') as NonNullable<PlatformTargetDetail['bidStrategy']>}
              onChange={v => updateDetail({ bidStrategy: v })}
            />
          </div>
          {detail.bidStrategy === 'target_cpa' && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">目標CPA</p>
              <input
                className="w-48 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-black focus:outline-none"
                placeholder="例: 3000（円）"
                value={detail.targetCpa ?? ''}
                onChange={e => updateDetail({ targetCpa: e.target.value })}
              />
            </div>
          )}
          {detail.bidStrategy === 'target_roas' && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">目標ROAS</p>
              <input
                className="w-48 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-black focus:outline-none"
                placeholder="例: 300（%）"
                value={detail.targetRoas ?? ''}
                onChange={e => updateDetail({ targetRoas: e.target.value })}
              />
            </div>
          )}
        </div>
      );
    }

    if (kind === 'google_display') {
      return (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">オーディエンス種別（複数選択可）</p>
          <CheckPills
            options={AUDIENCE_TYPES}
            values={detail.audiences ?? []}
            onChange={v => updateDetail({ audiences: v })}
          />
        </div>
      );
    }

    if (kind === 'meta') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">配置面（複数選択可）</p>
            <CheckPills
              options={META_PLACEMENTS}
              values={detail.placements ?? []}
              onChange={v => updateDetail({ placements: v })}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">キャンペーン目的</p>
            <RadioPills
              options={CAMPAIGN_OBJECTIVES as { key: NonNullable<PlatformTargetDetail['campaignObjective']>; label: string }[]}
              value={(detail.campaignObjective ?? 'traffic') as NonNullable<PlatformTargetDetail['campaignObjective']>}
              onChange={v => updateDetail({ campaignObjective: v })}
            />
          </div>
          {detail.campaignObjective === 'conversion' && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">最適化イベント</p>
              <RadioPills
                options={OPT_EVENTS}
                value={detail.optimizationEvent ?? 'purchase'}
                onChange={v => updateDetail({ optimizationEvent: v })}
              />
            </div>
          )}
        </div>
      );
    }

    if (kind === 'yahoo_search') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">マッチタイプ（複数選択可）</p>
            <CheckPills
              options={MATCH_TYPES}
              values={detail.matchTypes ?? ['phrase']}
              onChange={v => updateDetail({ matchTypes: v })}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">入札方式</p>
            <RadioPills
              options={YAHOO_BID as { key: NonNullable<PlatformTargetDetail['yahooBidStrategy']>; label: string }[]}
              value={(detail.yahooBidStrategy ?? 'maximize_clicks') as NonNullable<PlatformTargetDetail['yahooBidStrategy']>}
              onChange={v => updateDetail({ yahooBidStrategy: v })}
            />
          </div>
          {detail.yahooBidStrategy === 'target_cpa' && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">目標CPA</p>
              <input
                className="w-48 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-black focus:outline-none"
                placeholder="例: 3000（円）"
                value={detail.yahooTargetCpa ?? ''}
                onChange={e => updateDetail({ yahooTargetCpa: e.target.value })}
              />
            </div>
          )}
        </div>
      );
    }

    if (kind === 'line') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">広告フォーマット（複数選択可）</p>
            <CheckPills
              options={LINE_FORMATS}
              values={detail.lineFormats ?? []}
              onChange={v => updateDetail({ lineFormats: v })}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">配置（複数選択可）</p>
            <CheckPills
              options={LINE_PLACEMENTS}
              values={detail.linePlacements ?? []}
              onChange={v => updateDetail({ linePlacements: v })}
            />
          </div>
        </div>
      );
    }

    if (kind === 'x') {
      return (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">キャンペーン目的</p>
          <RadioPills
            options={X_OBJECTIVES as { key: NonNullable<PlatformTargetDetail['xObjective']>; label: string }[]}
            value={(detail.xObjective ?? 'website_visit') as NonNullable<PlatformTargetDetail['xObjective']>}
            onChange={v => updateDetail({ xObjective: v })}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-900">{label}</span>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          {renderContent()}
        </div>
      )}
    </div>
  );
}

// ── ボリュームバッジ ──────────────────────────
const VOLUME_LABEL: Record<KeywordSuggestion['volume'], string> = { high: '高', medium: '中', low: '低' };
const VOLUME_STYLE: Record<KeywordSuggestion['volume'], string> = {
  high:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};
const COMPETITION_STYLE: Record<KeywordSuggestion['competition'], string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const TREND_ICON: Record<KeywordSuggestion['trend'], string> = { up: '↑', stable: '→', down: '↓' };
const TREND_STYLE: Record<KeywordSuggestion['trend'], string> = {
  up:     'text-emerald-600',
  stable: 'text-gray-500',
  down:   'text-red-600',
};

// ── キーワードセクション ──────────────────────
function KeywordSection({
  targetInfo,
  setTargetInfo,
  selectedKeywords,
  setSelectedKeywords,
  suggestedKeywords,
  industry,
  targetUrl,
}: {
  targetInfo: TargetInfo;
  setTargetInfo: React.Dispatch<React.SetStateAction<TargetInfo>>;
  selectedKeywords: string[];
  setSelectedKeywords: React.Dispatch<React.SetStateAction<string[]>>;
  suggestedKeywords: string[];
  industry: string;
  targetUrl?: string;
}) {
  const [input, setInput] = useState('');
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [volumeResults, setVolumeResults] = useState<KeywordSuggestion[] | null>(null);
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const MAX_KEYWORDS = 100;

  const handleEstimateVolume = async () => {
    if (selectedKeywords.length === 0) return;
    setVolumeLoading(true);
    setVolumeError(null);
    try {
      const items = await estimateKeywordVolume(selectedKeywords, industry, targetUrl);
      setVolumeResults(items);
    } catch (err: any) {
      setVolumeError(err?.message || 'ボリューム推定に失敗しました');
      setVolumeResults(null);
    } finally {
      setVolumeLoading(false);
    }
  };

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed || selectedKeywords.includes(trimmed) || selectedKeywords.length >= MAX_KEYWORDS) return;
    setSelectedKeywords(prev => [...prev, trimmed]);
  };
  const removeKeyword = (kw: string) =>
    setSelectedKeywords(prev => prev.filter(k => k !== kw));

  const MATCH_OPTIONS: { key: 'phrase' | 'exact' | 'broad'; label: string }[] = [
    { key: 'phrase', label: 'フレーズ一致' },
    { key: 'exact',  label: '完全一致' },
    { key: 'broad',  label: 'インテント一致' },
  ];

  const remainingSuggestions = suggestedKeywords.filter(kw => !selectedKeywords.includes(kw));

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-900">キーワード設定</h3>
        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">検索広告のみ</span>
        <span className="text-xs text-gray-400 ml-auto">{selectedKeywords.length}/{MAX_KEYWORDS}件</span>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-600 block mb-2">デフォルトマッチタイプ</label>
        <RadioPills
          options={MATCH_OPTIONS}
          value={targetInfo.keywordMatchType}
          onChange={v => setTargetInfo(prev => ({ ...prev, keywordMatchType: v }))}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-600 block mb-2">
          キーワードを入力（Enterで追加、最大{MAX_KEYWORDS}件）
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-black focus:outline-none"
            placeholder="例: インハウス化 広告運用"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword(input);
                setInput('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => { addKeyword(input); setInput(''); }}
            disabled={!input.trim() || selectedKeywords.length >= MAX_KEYWORDS}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-black text-white shadow-md disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center gap-1"
          >
            <Plus size={14} /> 追加
          </button>
        </div>
      </div>

      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedKeywords.map(kw => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
            >
              {kw}
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                className="text-white/60 hover:text-red-300 transition-colors leading-none"
                aria-label="削除"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {selectedKeywords.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleEstimateVolume}
            disabled={volumeLoading}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-40"
          >
            {volumeLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Geminiが分析中…
              </>
            ) : (
              <>
                <BarChart3 size={14} />
                ボリューム推定
              </>
            )}
          </button>
          {volumeError && (
            <p className="mt-2 text-xs text-red-600">{volumeError}</p>
          )}
          {volumeResults && volumeResults.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-gray-500 font-bold">キーワード</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-bold whitespace-nowrap">ボリューム</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-bold">競合</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-bold">トレンド</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-bold">推定根拠</th>
                  </tr>
                </thead>
                <tbody>
                  {volumeResults.map((it, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-3 py-2 text-gray-800 font-medium">{it.keyword}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${VOLUME_STYLE[it.volume]}`}>
                          {VOLUME_LABEL[it.volume]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${COMPETITION_STYLE[it.competition]}`}>
                          {VOLUME_LABEL[it.competition]}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-center font-bold ${TREND_STYLE[it.trend]}`}>
                        {TREND_ICON[it.trend]}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{it.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-2 text-[10px] text-gray-400 bg-gray-50">
                ※ Geminiによる推定値です。実際の数値はGoogleキーワードプランナー等でご確認ください。
              </p>
            </div>
          )}
        </div>
      )}

      {remainingSuggestions.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-blue-600" />
            <p className="text-xs font-bold text-gray-700">AI提案キーワード</p>
            <span className="text-[10px] text-gray-400">タップで追加</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {remainingSuggestions.map(kw => (
              <button
                key={kw}
                type="button"
                onClick={() => addKeyword(kw)}
                disabled={selectedKeywords.length >= MAX_KEYWORDS}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:border-black hover:text-black transition-all disabled:opacity-40"
              >
                + {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── メインコンポーネント ──────────────────────
export interface StepTargetProps {
  targetInfo: TargetInfo;
  setTargetInfo: React.Dispatch<React.SetStateAction<TargetInfo>>;
  platforms: PlatformType[];
  selectedKeywords: string[];
  setSelectedKeywords: React.Dispatch<React.SetStateAction<string[]>>;
  suggestedKeywords?: string[];
  platformLabels: Record<PlatformType, string>;
  industry: string;
  targetUrl?: string;
}

export default function StepTarget({
  targetInfo,
  setTargetInfo,
  platforms,
  selectedKeywords,
  setSelectedKeywords,
  suggestedKeywords = [],
  platformLabels,
  industry,
  targetUrl,
}: StepTargetProps) {
  const update = <K extends keyof TargetInfo>(key: K, val: TargetInfo[K]) =>
    setTargetInfo(prev => ({ ...prev, [key]: val }));

  const toggleAge = (age: string) => {
    const ages = targetInfo.ageGroups;
    update('ageGroups', ages.includes(age) ? ages.filter(a => a !== age) : [...ages, age]);
  };

  const GENDER_OPTIONS: { key: TargetGender; label: string }[] = [
    { key: 'all',    label: '全体' },
    { key: 'male',   label: '男性中心' },
    { key: 'female', label: '女性中心' },
  ];
  const DEVICE_OPTIONS: { key: TargetDevice; label: string }[] = [
    { key: 'pc',         label: 'PC' },
    { key: 'smartphone', label: 'スマートフォン' },
    { key: 'both',       label: '両方' },
  ];

  const hasSearchPlatform = platforms.some(p => SEARCH_PLATFORMS.includes(p));
  const platformsWithDetail = platforms.filter(p => detailKindOf(p) !== null);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-bold text-gray-900">ターゲット・キーワード設定</h3>
        <p className="text-xs text-gray-500 mt-1">
          ターゲット情報は審査と配信最適化の精度向上に使用されます（任意）
        </p>
      </div>

      {/* 基本ターゲット */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">性別</label>
          <RadioPills options={GENDER_OPTIONS} value={targetInfo.gender} onChange={v => update('gender', v)} />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            年代 <span className="text-gray-400 font-normal text-xs">複数選択可</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map(age => {
              const checked = targetInfo.ageGroups.includes(age);
              return (
                <button
                  key={age}
                  type="button"
                  onClick={() => toggleAge(age)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    checked ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {age}
                </button>
              );
            })}
          </div>
          {targetInfo.ageGroups.length === 0 && (
            <p className="text-[10px] text-gray-400 mt-2">未選択の場合は「全年代」として扱われます</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">地域</label>
          <div className="space-y-3">
            {(['nationwide', 'prefecture'] as TargetRegionType[]).map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => update('region', r)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    targetInfo.region === r ? 'border-black' : 'border-gray-300 group-hover:border-gray-500'
                  }`}
                >
                  {targetInfo.region === r && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
                <span className="text-sm text-gray-700" onClick={() => update('region', r)}>
                  {r === 'nationwide' ? '全国' : '都道府県を指定'}
                </span>
              </label>
            ))}

            {targetInfo.region === 'prefecture' && (
              <div className="space-y-3 pt-1">
                {targetInfo.prefectures.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {targetInfo.prefectures.map(pref => (
                      <span
                        key={pref}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full"
                      >
                        {shortName(pref)}
                        <button
                          type="button"
                          onClick={() => update('prefectures', targetInfo.prefectures.filter(p => p !== pref))}
                          className="text-gray-400 hover:text-red-500 transition-colors leading-none ml-0.5"
                          aria-label="削除"
                        >×</button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => update('prefectures', [])}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >すべて解除</button>
                  </div>
                )}
                {targetInfo.prefectures.length === 0 && (
                  <p className="text-xs text-gray-400">都道府県を選択してください（複数選択可）</p>
                )}

                <div className="space-y-2">
                  {PREFECTURE_GROUPS.map(group => {
                    const selectedInGroup = group.prefectures.filter(p => targetInfo.prefectures.includes(p));
                    const allSelected = selectedInGroup.length === group.prefectures.length;
                    const anySelected = selectedInGroup.length > 0;
                    const selectAll = () =>
                      update('prefectures', [...new Set([...targetInfo.prefectures, ...group.prefectures])]);
                    const deselectAll = () =>
                      update('prefectures', targetInfo.prefectures.filter(p => !group.prefectures.includes(p)));
                    return (
                      <div key={group.label} className="bg-gray-50 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold ${anySelected ? 'text-black' : 'text-gray-500'}`}>
                            {group.label}
                            {anySelected && <span className="ml-1 text-gray-400">({selectedInGroup.length})</span>}
                          </span>
                          <div className="flex gap-3">
                            {!allSelected && (
                              <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:underline">
                                全て選択
                              </button>
                            )}
                            {anySelected && (
                              <button type="button" onClick={deselectAll} className="text-xs text-gray-400 hover:text-gray-700">
                                解除
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.prefectures.map(pref => {
                            const checked = targetInfo.prefectures.includes(pref);
                            return (
                              <button
                                key={pref}
                                type="button"
                                onClick={() =>
                                  update(
                                    'prefectures',
                                    checked
                                      ? targetInfo.prefectures.filter(p => p !== pref)
                                      : [...targetInfo.prefectures, pref],
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  checked
                                    ? 'bg-black text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-black hover:text-black'
                                }`}
                              >
                                {shortName(pref)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">デバイス</label>
          <RadioPills options={DEVICE_OPTIONS} value={targetInfo.device} onChange={v => update('device', v)} />
        </div>
      </div>

      {/* 媒体別詳細設定 */}
      {platformsWithDetail.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900">媒体別詳細設定</h4>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">任意</span>
          </div>
          <div className="space-y-2">
            {platformsWithDetail.map(p => (
              <PlatformDetailExpander
                key={p}
                platformKey={p}
                label={PLATFORM_DISPLAY_NAMES[p] ?? platformLabels[p] ?? p}
                targetInfo={targetInfo}
                setTargetInfo={setTargetInfo}
              />
            ))}
          </div>
        </div>
      )}

      {/* キーワード設定（検索広告選択時のみ） */}
      {hasSearchPlatform && (
        <KeywordSection
          targetInfo={targetInfo}
          setTargetInfo={setTargetInfo}
          selectedKeywords={selectedKeywords}
          setSelectedKeywords={setSelectedKeywords}
          suggestedKeywords={suggestedKeywords}
          industry={industry}
          targetUrl={targetUrl}
        />
      )}
    </div>
  );
}
