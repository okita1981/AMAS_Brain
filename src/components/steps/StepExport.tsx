// 出力ステップ。
// ad-campaign-studio の Step4Export.tsx を AMAS のライトテーマに移植し、
// CSV生成・直接入稿(モック)をサーバー側へ委譲する形にしたもの。
import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Loader2, Rocket, XCircle } from 'lucide-react';
import type { PlatformType } from '../../types';
import {
  downloadExportFile,
  exportToCsv,
  submitToMedia,
  type ExportPayload,
  type ExportUtmSettings,
  type SubmitResult,
} from '../../services/aiService';

// CSV出力に対応している媒体（PascalCase）
const CSV_SUPPORTED: PlatformType[] = [
  'GoogleSearch', 'GoogleDisplay', 'YahooSearch', 'Facebook', 'Instagram', 'LINE', 'X',
];

// 媒体ラベル/フォーマット説明
const PLATFORM_DISPLAY: Partial<Record<PlatformType, { name: string; format: string }>> = {
  GoogleSearch:  { name: 'Google検索広告',          format: 'Google Ads Editor 形式' },
  GoogleDisplay: { name: 'Googleディスプレイ（GDN）', format: 'Google Ads Editor 形式' },
  YahooSearch:   { name: 'Yahoo!検索広告',           format: 'Google Ads Editor 形式' },
  Facebook:      { name: 'Meta（Facebook）',          format: 'Meta Ads Manager 形式' },
  Instagram:     { name: 'Meta（Instagram）',         format: 'Meta Ads Manager 形式（FBと共通）' },
  LINE:          { name: 'LINE広告',                  format: 'LINE広告 CSV 形式' },
  X:             { name: 'X（旧Twitter）広告',         format: 'X広告 CSV 形式' },
};

export interface StepExportProps {
  // ExportPayload を組み立てるための入力（payload に詰める前の生データ）
  campaignName: string;
  productName?: string;
  landingPageUrl: string;
  platforms: PlatformType[];
  headlines: string[];
  descriptions: string[];
  primaryText?: string;
  keywords?: string[];
  matchType?: 'exact' | 'phrase' | 'broad';
  // 出力ステップが完了したら呼ばれる（任意）
  onComplete?: () => void;
}

export default function StepExport({
  campaignName,
  productName,
  landingPageUrl,
  platforms,
  headlines,
  descriptions,
  primaryText,
  keywords = [],
  matchType = 'phrase',
  onComplete,
}: StepExportProps) {
  // CSV出力に対応している媒体のみ抽出
  const exportablePlatforms = useMemo(
    () => platforms.filter(p => CSV_SUPPORTED.includes(p)),
    [platforms],
  );
  const unsupportedPlatforms = useMemo(
    () => platforms.filter(p => !CSV_SUPPORTED.includes(p)),
    [platforms],
  );
  const hasSearchPlatform = exportablePlatforms.some(p => p === 'GoogleSearch' || p === 'YahooSearch');

  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;
  const [utm, setUtm] = useState<ExportUtmSettings>({
    enabled: false,
    medium: 'cpc',
    campaign: `${productName || campaignName || 'campaign'}_${monthLabel}`,
    content: '',
    term: '',
  });

  const [busyPlatform, setBusyPlatform] = useState<PlatformType | 'ALL' | null>(null);
  const [submitting, setSubmitting] = useState<PlatformType | 'ALL' | null>(null);
  const [submitResults, setSubmitResults] = useState<SubmitResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buildPayload = (targetPlatforms: PlatformType[]): ExportPayload => ({
    campaignName,
    productName: productName || campaignName,
    landingPageUrl,
    platforms: targetPlatforms,
    headlines,
    descriptions,
    primaryText: primaryText ?? descriptions[0] ?? '',
    keywords,
    matchType,
    utm,
  });

  const handleDownload = async (target: PlatformType | 'ALL') => {
    setErrorMessage(null);
    setBusyPlatform(target);
    try {
      const targets = target === 'ALL' ? exportablePlatforms : [target];
      const files = await exportToCsv(buildPayload(targets));
      if (files.length === 0) {
        setErrorMessage('生成可能なCSVがありませんでした');
        return;
      }
      // 連続ダウンロードはブラウザがブロックすることがあるので150ms間隔で開始
      files.forEach((f, i) => setTimeout(() => downloadExportFile(f), i * 150));
    } catch (err: any) {
      setErrorMessage(err?.message || 'CSV出力に失敗しました');
    } finally {
      setBusyPlatform(null);
    }
  };

  const handleSubmit = async (target: PlatformType | 'ALL') => {
    setErrorMessage(null);
    setSubmitting(target);
    try {
      const targets = target === 'ALL' ? exportablePlatforms : [target];
      const results = await submitToMedia(buildPayload(targets));
      setSubmitResults(prev => {
        const filtered = prev.filter(r => !results.some(n => n.platform === r.platform));
        return [...filtered, ...results];
      });
    } catch (err: any) {
      setErrorMessage(err?.message || '直接入稿に失敗しました');
    } finally {
      setSubmitting(null);
    }
  };

  const resultFor = (p: PlatformType) => submitResults.find(r => r.platform === p);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-bold text-gray-900">出力・入稿準備</h3>
        <p className="text-xs text-gray-500 mt-1">
          媒体ごとの公式フォーマットでCSVをダウンロードできます。直接入稿は現時点ではモック動作です。
        </p>
      </div>

      {/* サマリ */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-900 truncate">{campaignName}</p>
          <p className="text-xs text-emerald-700">
            {exportablePlatforms.length}媒体
            {keywords.length > 0 && ` / キーワード ${keywords.length}件`}
          </p>
        </div>
      </div>

      {/* UTMパネル */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={utm.enabled}
            onClick={() => setUtm(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              utm.enabled ? 'bg-black' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                utm.enabled ? 'translate-x-4' : ''
              }`}
            />
          </button>
          <span className="text-sm font-bold text-gray-900">UTMパラメーターを付与する</span>
          {utm.enabled && (
            <span className="text-xs text-gray-500">CSV の最終URLに自動付与されます</span>
          )}
        </label>

        {utm.enabled && (
          <div className="grid gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-xs text-gray-500 text-right font-mono">utm_medium</label>
              <input
                type="text"
                value={utm.medium || ''}
                onChange={e => setUtm(prev => ({ ...prev, medium: e.target.value }))}
                placeholder="cpc"
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-xs text-gray-500 text-right font-mono">utm_campaign</label>
              <input
                type="text"
                value={utm.campaign || ''}
                onChange={e => setUtm(prev => ({ ...prev, campaign: e.target.value }))}
                placeholder="キャンペーン名"
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-xs text-gray-500 text-right font-mono">utm_content</label>
              <input
                type="text"
                value={utm.content || ''}
                onChange={e => setUtm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="空欄で媒体ごとに自動生成"
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            {hasSearchPlatform && (
              <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                <label className="text-xs text-gray-500 text-right font-mono">utm_term</label>
                <input
                  type="text"
                  value={utm.term || ''}
                  onChange={e => setUtm(prev => ({ ...prev, term: e.target.value }))}
                  placeholder="キーワード（検索広告のみ付与）"
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 出力対応外の媒体警告 */}
      {unsupportedPlatforms.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800">
          以下の媒体はCSV出力に未対応です：
          <span className="font-bold ml-1">{unsupportedPlatforms.join(', ')}</span>
        </div>
      )}

      {/* 媒体別カード */}
      <div className="space-y-3">
        {exportablePlatforms.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-8 text-center text-sm text-gray-500">
            CSV出力対応の媒体が選択されていません
          </div>
        ) : (
          exportablePlatforms.map(p => {
            const meta = PLATFORM_DISPLAY[p];
            const downloadBusy = busyPlatform === p;
            const submitBusy = submitting === p;
            const result = resultFor(p);
            return (
              <div
                key={p}
                className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{meta?.name ?? p}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{meta?.format ?? 'CSV'}</p>
                  {result && (
                    <div
                      className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        result.success
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {result.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {result.success ? `入稿OK (${result.externalId})` : result.message || '失敗'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(p)}
                    disabled={downloadBusy || submitBusy}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    {downloadBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(p)}
                    disabled={downloadBusy || submitBusy}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:bg-gray-300"
                    title="現時点ではモック動作です"
                  >
                    {submitBusy ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                    直接入稿
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 一括操作 */}
      {exportablePlatforms.length > 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-5">
          <p className="text-sm font-bold text-gray-700 mb-1">全媒体まとめて操作</p>
          <p className="text-xs text-gray-500 mb-3">
            選択中の {exportablePlatforms.length} 媒体に対して一括でCSV出力 / 直接入稿（モック）を実行します
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload('ALL')}
              disabled={busyPlatform === 'ALL' || submitting === 'ALL'}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors disabled:opacity-40"
            >
              {busyPlatform === 'ALL' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中…
                </>
              ) : (
                <>
                  <Download size={16} />
                  全媒体CSV ダウンロード
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('ALL')}
              disabled={busyPlatform === 'ALL' || submitting === 'ALL'}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:bg-gray-300"
            >
              {submitting === 'ALL' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  入稿中…
                </>
              ) : (
                <>
                  <Rocket size={16} />
                  全媒体に直接入稿（モック）
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {onComplete && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            完了してダッシュボードへ
          </button>
        </div>
      )}
    </div>
  );
}
