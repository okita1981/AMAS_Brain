import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Image as ImageIcon, 
  Youtube as YoutubeIcon, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Twitter, 
  Smartphone, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  MoreHorizontal,
  Heart,
  MessageSquare,
  Send,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronUp,
  Repeat2,
  Share
} from 'lucide-react';
import { PlatformType, AdContent, AIAdvice, IndustryType, PlanType, BannerType } from '../types';
import { getAIAdvice } from '../services/aiService';
import BannerPreview from './BannerPreview';

interface MediaSimulatorProps {
  content: AdContent;
  industry: IndustryType;
  plan: PlanType;
  allowedPlatforms?: PlatformType[];
  onUpgrade?: () => void;
}

const PLATFORMS: { id: PlatformType; label: string; icon: React.ReactNode }[] = [
  { id: 'GoogleSearch', label: 'Google 検索', icon: <Search size={16} /> },
  { id: 'GoogleDisplay', label: 'Google ディスプレイ', icon: <ImageIcon size={16} /> },
  { id: 'TrueView', label: 'TrueView (YouTube)', icon: <YoutubeIcon size={16} /> },
  { id: 'YahooSearch', label: 'Yahoo! 検索', icon: <Search size={16} /> },
  { id: 'YahooDisplay', label: 'Yahoo! ディスプレイ', icon: <ImageIcon size={16} /> },
  { id: 'Instagram', label: 'Instagram', icon: <Instagram size={16} /> },
  { id: 'Facebook', label: 'Facebook', icon: <Facebook size={16} /> },
  { id: 'X', label: 'X (Twitter)', icon: <Twitter size={16} /> },
  { id: 'LINE', label: 'LINE', icon: <MessageCircle size={16} /> },
  { id: 'TikTok', label: 'TikTok', icon: <Smartphone size={16} /> },
];

export default function MediaSimulator({ content, industry, plan, allowedPlatforms = [], onUpgrade }: MediaSimulatorProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformType>(allowedPlatforms[0] || PLATFORMS[0].id);
  const [activeBannerUrl, setActiveBannerUrl] = useState<string | null>(null);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // Get available banner types for the current platform
  const getSupportedBannerTypes = (platform: PlatformType): BannerType[] => {
    switch (platform) {
      case 'GoogleDisplay':
      case 'YahooDisplay':
        return [BannerType.Wide, BannerType.Square];
      case 'Instagram':
      case 'Facebook':
        return [BannerType.Square, BannerType.Vertical];
      case 'X':
        return [BannerType.Wide, BannerType.Square, BannerType.Vertical];
      case 'TikTok':
        return [BannerType.Vertical];
      case 'LINE':
        return [BannerType.Square];
      case 'TrueView':
        return [BannerType.Wide];
      default:
        return [];
    }
  };

  const supportedTypes = getSupportedBannerTypes(activePlatform);
  const availableBanners = content.banners?.filter(b => supportedTypes.includes(b.type)) || [];

  // Reset active banner URL when platform changes
  useEffect(() => {
    if (availableBanners.length > 0) {
      // Prefer the first available banner that is supported by the platform
      setActiveBannerUrl(availableBanners[0].url);
    } else {
      setActiveBannerUrl(null);
    }
  }, [activePlatform, content.banners]);

  // Update active platform if allowedPlatforms changes (e.g. when wizard starts)
  useEffect(() => {
    if (allowedPlatforms.length > 0 && !allowedPlatforms.includes(activePlatform)) {
      setActivePlatform(allowedPlatforms[0]);
    }
  }, [allowedPlatforms]);

  const isPlatformLocked = !allowedPlatforms.includes(activePlatform);

  const getRequiredPlan = (platform: PlatformType): string => {
    if (['TrueView', 'TikTok', 'LINE'].includes(platform)) return 'Pro';
    if (['YahooSearch', 'YahooDisplay', 'X'].includes(platform)) return 'Standard';
    if (['GoogleDisplay', 'Instagram', 'Facebook'].includes(platform)) return 'Lite';
    return 'Free';
  };

  useEffect(() => {
    const fetchAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const result = await getAIAdvice(activePlatform, content, industry, plan);
        setAdvice(result);
      } catch (error) {
        console.error('Failed to fetch AI advice:', error);
      } finally {
        setIsLoadingAdvice(false);
      }
    };

    fetchAdvice();
  }, [activePlatform, content, industry]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Platform Tabs */}
      <div className="flex items-center gap-1 p-2 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar">
        {PLATFORMS.filter(p => allowedPlatforms.includes(p.id)).map((p) => {
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
                activePlatform === p.id
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.icon}
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* AI Advice Panel (Top) - More compact */}
        <div className="w-full bg-black/60 border-b border-white/5 p-4 flex flex-col gap-4 overflow-y-auto max-h-[200px]">
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap size={12} className="text-emerald-400" />
              AI 診断レポート
            </h3>
            
            {isLoadingAdvice ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-12 bg-white/5 rounded-xl"></div>
                <div className="h-16 bg-white/5 rounded-xl"></div>
              </div>
            ) : advice ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">期待効果スコア</span>
                      <span className={`text-sm font-bold ${advice.score > 80 ? 'text-emerald-400' : advice.score > 50 ? 'text-orange-400' : 'text-red-400'}`}>
                        {advice.score}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${advice.score}%` }}
                        className={`h-full rounded-full ${advice.score > 80 ? 'bg-emerald-400' : advice.score > 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-400/5 rounded-xl border border-emerald-400/20">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1.5 flex items-center gap-1">
                      <ShieldCheck size={10} />
                      AMAS 推奨アクション
                    </p>
                    <p className="text-[11px] text-emerald-100/80 italic leading-relaxed">
                      {advice.comment}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0">
                      <TrendingUp size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">最適化アドバイス</p>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{advice.comment}</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center shrink-0">
                      <Smartphone size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">媒体比較</p>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{advice.platformComparison}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">診断データを取得できませんでした</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Area (Bottom) */}
        <div className="flex-1 p-6 flex flex-col bg-gray-800/50 overflow-y-auto relative">
          {/* Banner Size Info & Selector */}
          <div className="mb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SQUARE */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/10">
                <h4 className="text-[10px] font-black text-white uppercase mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-sm" />
                  ■ SQUARE (1:1)
                </h4>
                <ul className="text-[9px] text-gray-400 space-y-1.5 mb-3">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Google (RDA)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Meta (FB/IG Feed)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    X (Timeline)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Yahoo (YDAレスポンシブ)
                  </li>
                </ul>
                <p className="text-[9px] font-bold text-gray-300 border-t border-white/5 pt-2">
                  【一言】 最も汎用性が高い「必須バナー」です。
                </p>
              </div>

              {/* WIDE */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/10">
                <h4 className="text-[10px] font-black text-white uppercase mb-3 flex items-center gap-2">
                  <div className="w-3 h-2 bg-white rounded-sm" />
                  ■ WIDE (1.91:1)
                </h4>
                <ul className="text-[9px] text-gray-400 space-y-1.5 mb-3">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Google (RDA)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    X (Web Card)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Meta (FB Feed)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Yahoo (YDA 1.91:1枠)
                  </li>
                </ul>
                <p className="text-[9px] font-bold text-gray-300 border-t border-white/5 pt-2">
                  【一言】 クリック率（CTR）を稼ぐための「主力バナー」です。
                </p>
              </div>

              {/* VERTICAL */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/10">
                <h4 className="text-[10px] font-black text-white uppercase mb-3 flex items-center gap-2">
                  <div className="w-2 h-3 bg-white rounded-sm" />
                  ■ VERTICAL (9:16)
                </h4>
                <ul className="text-[9px] text-gray-400 space-y-1.5 mb-3">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Instagram (Stories/Reels)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Meta (FB Stories)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    X (Vertical Ads)
                  </li>
                </ul>
                <p className="text-[9px] font-bold text-gray-300 border-t border-white/5 pt-2">
                  【一言】 スマホ全画面で視覚に訴える「没入型バナー」です。
                </p>
              </div>
            </div>

            {/* Banner Selector */}
            {availableBanners.length > 0 && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">バナーを選択してプレビュー</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableBanners.map((b) => {
                    const sameTypeBanners = availableBanners.filter(ab => ab.type === b.type);
                    const typeIndex = sameTypeBanners.indexOf(b) + 1;
                    const showIndex = sameTypeBanners.length > 1;

                    // Compatibility check for active platform
                    const isCompatible = (
                      (activePlatform === 'GoogleDisplay' || activePlatform === 'YahooDisplay') && (b.type === BannerType.Square || b.type === BannerType.Wide) ||
                      (activePlatform === 'Instagram' || activePlatform === 'Facebook') && (b.type === BannerType.Square || b.type === BannerType.Vertical) ||
                      (activePlatform === 'X') ||
                      (activePlatform === 'TrueView' && b.type === BannerType.Wide) ||
                      (activePlatform === 'LINE' && b.type === BannerType.Square) ||
                      (activePlatform === 'TikTok' && b.type === BannerType.Vertical) ||
                      (['GoogleSearch', 'YahooSearch'].includes(activePlatform))
                    );

                    return (
                      <button
                        key={b.url}
                        onClick={() => setActiveBannerUrl(b.url)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 shadow-sm ${
                          activeBannerUrl === b.url
                            ? 'bg-white text-black border-white scale-105 ring-2 ring-blue-500/50'
                            : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:bg-black/60'
                        } ${!isCompatible && activeBannerUrl === b.url ? 'ring-2 ring-red-500' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          b.type === BannerType.Square ? 'bg-blue-400' : 
                          b.type === BannerType.Wide ? 'bg-green-400' : 'bg-purple-400'
                        }`} />
                        {b.type === BannerType.Square ? 'SQUARE (1:1)' : 
                         b.type === BannerType.Wide ? 'WIDE (1.91:1)' : 'VERTICAL (9:16)'}
                        {showIndex && <span className="opacity-50">#{typeIndex}</span>}
                        {!isCompatible && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="この媒体には非対応です" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Platform Mapping for Selected Banner */}
                {activeBannerUrl && (
                  <div className="flex flex-wrap justify-center gap-3 mt-2 py-2 px-4 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <ArrowRightLeft size={10} className="text-gray-400" />
                      配信先マッピング:
                    </span>
                    {PLATFORMS.map(p => {
                      const banner = content.banners?.find(b => b.url === activeBannerUrl);
                      if (!banner) return null;
                      
                      const isCompatible = (
                        (p.id === 'GoogleDisplay' || p.id === 'YahooDisplay') && (banner.type === BannerType.Square || banner.type === BannerType.Wide) ||
                        (p.id === 'Instagram' || p.id === 'Facebook') && (banner.type === BannerType.Square || banner.type === BannerType.Vertical) ||
                        (p.id === 'X') ||
                        (p.id === 'TrueView' && banner.type === BannerType.Wide) ||
                        (p.id === 'LINE' && banner.type === BannerType.Square) ||
                        (p.id === 'TikTok' && banner.type === BannerType.Vertical) ||
                        (['GoogleSearch', 'YahooSearch'].includes(p.id))
                      );

                      if (!isCompatible) return null;

                      return (
                        <div key={p.id} className="flex items-center gap-1 text-[9px] font-bold text-gray-300">
                          <div className="w-1 h-1 rounded-full bg-emerald-400" />
                          {p.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[500px] py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activePlatform}-${activeBannerUrl}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-full max-w-2xl"
              >
                <PreviewRenderer 
                  platform={activePlatform} 
                  content={content} 
                  selectedBannerUrl={activeBannerUrl}
                />
              </motion.div>
            </AnimatePresence>

            {isPlatformLocked && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{getRequiredPlan(activePlatform)}プランで実施できます</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                この媒体への配信とAI最適化を有効にするには、プランのアップグレードが必要です。
              </p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                プランをアップグレード
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRenderer({ platform, content, selectedBannerUrl }: { platform: PlatformType; content: AdContent; selectedBannerUrl: string | null }) {
  const getBannerByUrl = (url: string | null) => {
    if (!url) return null;
    return content.banners?.find(b => b.url === url) || null;
  };

  const getBannerByType = (type: BannerType) => {
    return content.banners?.find(b => b.type === type);
  };

  const renderImage = (type: BannerType, fallbackSeed: string) => {
    // Use the selected banner if its URL matches, otherwise fallback to the first banner of the requested type
    const selectedBanner = getBannerByUrl(selectedBannerUrl);
    const banner = (selectedBanner && selectedBanner.type === type) ? selectedBanner : getBannerByType(type);
    
    if (banner) {
      return (
        <BannerPreview 
          backgroundUrl={banner.url}
          type={banner.type}
          preset={banner.preset}
          headline={banner.headline}
          cta={banner.cta}
          className="w-full h-full"
        />
      );
    }

    // If no banner is available for this specific type, show a placeholder with a message
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
        <ImageIcon size={32} className="text-gray-300 mb-2" />
        <p className="text-[10px] text-gray-400 font-bold">
          {type === BannerType.Square ? 'SQUARE (1:1)' : 
           type === BannerType.Wide ? 'WIDE (1.91:1)' : 'VERTICAL (9:16)'}
          <br />
          バナーが生成されていません
        </p>
      </div>
    );
  };

  const renderCompatibleImage = (allowedTypes: BannerType[], defaultType: BannerType) => {
    const selectedBanner = getBannerByUrl(selectedBannerUrl);
    if (selectedBanner && allowedTypes.includes(selectedBanner.type)) {
      return renderImage(selectedBanner.type, 'compatible');
    }
    // If selected banner is NOT compatible, but we have a banner of the default type, use it
    const defaultBanner = getBannerByType(defaultType);
    if (defaultBanner) {
      return renderImage(defaultType, 'default');
    }
    // If even default type is missing, try ANY compatible banner
    const anyCompatible = content.banners?.find(b => allowedTypes.includes(b.type));
    if (anyCompatible) {
      return renderImage(anyCompatible.type, 'any-compatible');
    }
    return renderImage(defaultType, 'fallback');
  };

  const getAspectClass = (type: BannerType | undefined) => {
    switch (type) {
      case BannerType.Square: return 'aspect-square';
      case BannerType.Wide: return 'aspect-[1.91/1]';
      case BannerType.Vertical: return 'aspect-[9/16]';
      default: return 'aspect-square';
    }
  };

  const selectedBanner = getBannerByUrl(selectedBannerUrl);
  const currentBannerType = selectedBanner?.type;

  switch (platform) {
    case 'GoogleSearch':
    case 'YahooSearch':
      return (
        <div className="bg-white rounded-xl p-5 shadow-xl space-y-3 text-left">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[8px] font-bold">G</div>
            <div className="text-[10px] text-gray-500">広告・{content.headline ? 'https://amas-marketing.jp' : 'URL'}</div>
          </div>
          <div className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer leading-tight">
            {content.headline || 'ここに広告の見出しが表示されます'}
          </div>
          <div className="text-[#4d5156] text-sm leading-relaxed line-clamp-2">
            {content.description || 'ここに広告の説明文が表示されます。ユーザーの検索意図に合わせた魅力的なテキストを。'}
          </div>
          <div className="flex gap-4 pt-1">
            {content.cta ? content.cta.split(' / ').map((cta, i) => (
              <div key={i} className="text-[#1a0dab] text-xs font-medium">{cta}</div>
            )) : (
              <>
                <div className="text-[#1a0dab] text-xs font-medium">詳細を見る</div>
                <div className="text-[#1a0dab] text-xs font-medium">お問い合わせ</div>
              </>
            )}
          </div>
        </div>
      );

    case 'GoogleDisplay':
    case 'YahooDisplay':
      return (
        <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-sm mx-auto">
          <div className="aspect-[1.91/1] w-full relative">
            {renderCompatibleImage([BannerType.Wide, BannerType.Square], BannerType.Wide)}
          </div>
          <div className="p-4 space-y-2 text-left">
            <div className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
              {content.headline || 'ここに広告の見出しが表示されます'}
            </div>
            <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
              {content.description || 'ここに広告の説明文が表示されます。'}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-[10px] text-gray-400 font-medium">広告・AMAS</div>
              <div className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                {content.cta || '詳細を見る'}
              </div>
            </div>
          </div>
        </div>
      );

    case 'Instagram':
    case 'Facebook':
      return (
        <div className="space-y-8 pb-8">
          {/* Feed Preview */}
          <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-sm mx-auto">
            <div className="p-3 flex items-center gap-2 border-b border-gray-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1px]">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gray-200" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-900">amas_marketing</div>
                <div className="text-[8px] text-gray-500">広告</div>
              </div>
              <MoreHorizontal size={14} className="text-gray-400" />
            </div>
            <div className={`${getAspectClass(currentBannerType && [BannerType.Square, BannerType.Vertical].includes(currentBannerType) ? currentBannerType : BannerType.Square)} w-full relative`}>
              {renderCompatibleImage([BannerType.Square, BannerType.Vertical], BannerType.Square)}
            </div>
            <div className="p-3 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart size={20} className="text-gray-700" />
                  <MessageCircle size={20} className="text-gray-700" />
                  <Send size={20} className="text-gray-700" />
                </div>
                <Bookmark size={20} className="text-gray-700" />
              </div>
              <div className="text-[10px] text-gray-900">
                <span className="font-bold mr-2">amas_marketing</span>
                {content.description || 'ここに広告の説明文が表示されます。'}
              </div>
            </div>
          </div>

          {/* Stories Preview */}
          <div className="bg-black rounded-xl overflow-hidden shadow-xl aspect-[9/16] max-w-[280px] mx-auto relative group">
            <div className="absolute inset-0">
              {renderCompatibleImage([BannerType.Vertical], BannerType.Vertical)}
            </div>
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/40 to-transparent flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-400 border border-white/20" />
              <div className="flex-1">
                <div className="text-[8px] font-bold text-white">amas_marketing</div>
                <div className="text-[6px] text-white/80">広告</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent text-center">
              <div className="inline-block px-8 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[10px] font-bold mb-3">
                {content.cta || '詳細を見る'}
              </div>
              <div className="text-white text-[8px] font-medium flex items-center justify-center gap-1">
                上にスワイプ <ChevronUp size={10} />
              </div>
            </div>
          </div>
        </div>
      );

    case 'X':
      return (
        <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 max-w-sm mx-auto text-left">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1">
                <div className="text-sm font-bold text-gray-900">AMAS Marketing</div>
                <div className="text-xs text-gray-500">@amas_ai</div>
                <div className="text-xs text-gray-500">· 広告</div>
              </div>
              <div className="text-sm text-gray-900 leading-relaxed">
                {content.description || 'ここに広告の説明文が表示されます。'}
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className={`${getAspectClass(currentBannerType || BannerType.Wide)} w-full relative`}>
                  {renderCompatibleImage([BannerType.Wide, BannerType.Square, BannerType.Vertical], BannerType.Wide)}
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">amas-marketing.jp</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {content.headline || 'ここに広告の見出しが表示されます'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 text-gray-500">
                <MessageCircle size={16} />
                <Repeat2 size={16} />
                <Heart size={16} />
                <Share size={16} />
              </div>
            </div>
          </div>
        </div>
      );

    case 'TrueView':
      return (
        <div className="bg-black rounded-xl overflow-hidden shadow-xl aspect-video max-w-sm mx-auto relative group">
          <div className="absolute inset-0">
            {renderCompatibleImage([BannerType.Wide], BannerType.Wide)}
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded flex items-center gap-2">
              広告をスキップ
              <div className="w-4 h-4 bg-white/20 rounded-sm flex items-center justify-center">
                <ChevronRight size={10} />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
            <div>
              <div className="text-[10px] font-bold text-white">{content.cta || '詳細を見る'}</div>
              <div className="text-[8px] text-gray-300">amas-marketing.jp</div>
            </div>
          </div>
        </div>
      );

    case 'LINE':
      return (
        <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-sm mx-auto text-left">
          <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-[#00b900]">
            <div className="text-white text-xs font-bold">LINE 広告</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-xs font-bold text-gray-900">AMAS Marketing</div>
                <div className="text-[10px] text-gray-500">Sponsored</div>
              </div>
            </div>
            <div className="text-sm text-gray-900 leading-relaxed">
              {content.description || 'ここに広告の説明文が表示されます。'}
            </div>
            <div className="aspect-square w-full relative rounded-lg overflow-hidden">
              {renderCompatibleImage([BannerType.Square], BannerType.Square)}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-bold text-gray-900">
                {content.headline || 'ここに広告の見出しが表示されます'}
              </div>
              <div className="px-4 py-2 bg-[#00b900] text-white text-[10px] font-bold rounded-full">
                {content.cta || '詳細を見る'}
              </div>
            </div>
          </div>
        </div>
      );

    case 'TikTok':
      return (
        <div className="bg-black rounded-xl overflow-hidden shadow-xl aspect-[9/16] max-w-[280px] mx-auto relative group">
          <div className="absolute inset-0">
            {renderCompatibleImage([BannerType.Vertical], BannerType.Vertical)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-left">
            <div className="text-white text-sm font-bold mb-1">@amas_marketing</div>
            <div className="text-white text-xs mb-4 line-clamp-3">
              {content.description || 'ここに広告の説明文が表示されます。#AMAS #AIマーケティング'}
            </div>
            <div className="flex items-center justify-between bg-blue-600 p-3 rounded-lg">
              <div className="text-white text-xs font-bold">{content.cta || '詳細を見る'}</div>
              <ChevronRight size={16} className="text-white" />
            </div>
          </div>
          <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white relative">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]">+</div>
            </div>
            <div className="flex flex-col items-center">
              <Heart size={28} className="text-white fill-white" />
              <span className="text-white text-[10px] font-bold">12.4K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle size={28} className="text-white fill-white" />
              <span className="text-white text-[10px] font-bold">856</span>
            </div>
            <div className="flex flex-col items-center">
              <Share size={28} className="text-white fill-white" />
              <span className="text-white text-[10px] font-bold">2.1K</span>
            </div>
          </div>
        </div>
      );

    default:
      return <div className="text-white">Preview not available</div>;
  }
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function ArrowRightLeft({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
    </svg>
  );
}
