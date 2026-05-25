export type AgentType = 'SEO' | 'Ads' | 'LPO' | 'CRM' | 'Orchestrator';
export type IndustryType = string;

export interface Client {
  id: string;
  name: string;
  industry: string;
  createdAt: number;
  ownerUid: string;
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  url: string;
  createdAt: number;
  ownerUid: string;
}

export interface Campaign {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  siteId?: string;
  siteName?: string;
  industry: IndustryType;
  budget: number;
  spend: number;
  clicks: number;
  impressions: number;
  leads: number;
  cpa: number;
  cpc: number;
  cvr: number;
  roas: number;
  cvi: number;
  status: 'active' | 'paused' | 'completed' | 'reviewing' | 'draft';
  ownerUid?: string;
  platforms: PlatformType[];
  reviewStatus?: {
    [key in PlatformType]?: 'pending' | 'approved' | 'disapproved';
  };
  targeting?: {
    gender: string[];
    age: string[];
    regions: string[];
  };
  adContent?: AdContent;
  keywords?: string[];
  mainSiteUrl?: string;
  businessDescription?: string;
  context?: string;
  ai_summary?: string;
  autoStart: boolean;
  tags: string[];
  createdAt: any;
  censorship?: AdCensorshipResult;
  isManualMode?: boolean;
  manualSettings?: {
    platformRatios?: Partial<Record<PlatformType, number>>;
    cpcLimit?: number;
    roasTarget?: number;
    excludedKeywords?: string[];
    excludedPlacements?: string[];
  };
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: 'idle' | 'working' | 'waiting_approval' | 'error';
  lastAction: string;
  description: string;
  isBeta?: boolean;
  metrics: {
    roi: number;
    conversion: number;
    spend: number;
    cvi: number; // Capital Velocity Index
  };
}

export interface AIActionReport {
  id: string;
  campaignId?: string;
  type: 'budget_shift' | 'ad_stop' | 'bid_adjust' | 'ab_test' | 'anomaly' | 'creative_update' | 'daily_spend';
  title: string;
  description: string;
  impact: string;
  timestamp: number;
  ownerUid?: string;
  platform?: string;
  campaignName?: string;
  amount?: number;
}

export interface MarketingTask {
  id: string;
  agentId: string;
  type: AgentType;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  brandSafetyScore: number;
  safetyFeedback: string;
  metadata?: any;
}

export interface StrategicPlan {
  analysis: string[];
  strategy: string;
  webhookPayload: any;
  cviProjection: number;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  cpa: number;
  averageCpc: number;
  averageCvr: number;
  roas: number;
  averageCvi: number;
}

export type PlanType = 'Free' | 'Lite' | 'Standard' | 'Pro' | 'Agency';

export interface PlanDefinition {
  name: PlanType;
  priceMonthly: number;
  priceAnnual: number;
  platforms: PlatformType[];
  optimizationLevel: string;
  conversionGoal: string;
  technicalSetup: string;
  spendLimit: number;
  maxCreatives: number;
  maxCampaigns: number;
  features: string[];
  maxAccounts: number;
  maxMembers: number;
  recommendedFor: string;
  aiModel: string;
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  Free: {
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    platforms: ['GoogleSearch'],
    optimizationLevel: '基本（CVI算出のみ）',
    conversionGoal: 'サイト遷移（クリック）',
    technicalSetup: '設定不要（URLのみ）',
    spendLimit: 30000,
    maxCreatives: 3,
    maxCampaigns: 3,
    features: [
      'SEOエージェント: サテライト案生成（月1回）',
      '入稿数：3クリエイティブ/月',
      'キャンペーン数：3件/月',
      '全体レポート出力',
      'タグ設置不要'
    ],
    maxAccounts: 1,
    maxMembers: 1,
    recommendedFor: 'まずは試してみたい、個人事業主・小規模店舗の方',
    aiModel: 'Gemini 1.5 Flash'
  },
  Lite: {
    name: 'Lite',
    priceMonthly: 9800,
    priceAnnual: 98000,
    platforms: ['GoogleSearch', 'GoogleDisplay', 'Instagram', 'Facebook'],
    optimizationLevel: '標準（媒体間配分）',
    conversionGoal: 'サイト遷移 ＋ AIヒアリング',
    technicalSetup: '設定不要（AIとの対話）',
    spendLimit: 100000,
    maxCreatives: 10,
    maxCampaigns: 10,
    features: [
      'SEOエージェント: サテライト案生成（月3回）',
      '入稿数：10クリエイティブ/月',
      'キャンペーン数：10件/月',
      'AIによる週次成果ヒアリング',
      '全体レポート出力'
    ],
    maxAccounts: 2,
    maxMembers: 3,
    recommendedFor: 'SNS広告も並行して、効率的に集客を始めたい方',
    aiModel: 'Gemini 1.5 Flash + Claude 3 Haiku'
  },
  Standard: {
    name: 'Standard',
    priceMonthly: 29800,
    priceAnnual: 298000,
    platforms: ['GoogleSearch', 'GoogleDisplay', 'Instagram', 'Facebook', 'YahooSearch', 'YahooDisplay', 'X'],
    optimizationLevel: '高度（クリエイティブ分析）',
    conversionGoal: '簡易アクション計測（AMASフォーム）',
    technicalSetup: '低（フォームコードの貼付）',
    spendLimit: 500000,
    maxCreatives: 30,
    maxCampaigns: 30,
    features: [
      'SEOエージェント: サテライト構成案（無制限）',
      '入稿数：30クリエイティブ/月',
      'キャンペーン数：30件/月',
      'AMAS専用問い合わせフォーム',
      '全体レポート出力',
      'CP別レポート出力'
    ],
    maxAccounts: 3,
    maxMembers: 5,
    recommendedFor: '本格的な運用と、問い合わせ獲得を重視する中小企業の方',
    aiModel: 'Gemini 1.5 Pro + Claude 3.5 Sonnet'
  },
  Pro: {
    name: 'Pro',
    priceMonthly: 98000,
    priceAnnual: 980000,
    platforms: ['GoogleSearch', 'GoogleDisplay', 'Instagram', 'Facebook', 'YahooSearch', 'YahooDisplay', 'X', 'TikTok', 'TrueView', 'LINE'],
    optimizationLevel: '自律（フルオート運用）',
    conversionGoal: '完全自動計測（タグ・GA4連携）',
    technicalSetup: '高（タグ・GA4・Pixel連携）',
    spendLimit: 2000000,
    maxCreatives: 100,
    maxCampaigns: 100,
    features: [
      'SEOエージェント: サテライト自動生成・公開',
      '入稿数：100クリエイティブ/月',
      'キャンペーン数：100件/月',
      'GA4/各媒体Pixel連携',
      'オフラインCV連携',
      '全体レポート出力'
    ],
    maxAccounts: 20,
    maxMembers: 20,
    recommendedFor: '多媒体でのフルオート運用と、データ連携を極めたい企業の方',
    aiModel: 'GPT-4o + Claude 3.5 Sonnet + Gemini 1.5 Pro'
  },
  Agency: {
    name: 'Agency',
    priceMonthly: 198000,
    priceAnnual: 1980000,
    platforms: ['GoogleSearch', 'GoogleDisplay', 'Instagram', 'Facebook', 'YahooSearch', 'YahooDisplay', 'X', 'TikTok', 'TrueView', 'LINE'],
    optimizationLevel: '自律（フルオート運用）',
    conversionGoal: '完全自動計測（タグ・GA4連携）',
    technicalSetup: '高（タグ・GA4・Pixel連携）',
    spendLimit: Infinity,
    maxCreatives: Infinity,
    maxCampaigns: Infinity,
    features: [
      'SEOエージェント: マルチドメイン自動展開',
      '入稿数：無制限',
      'キャンペーン数：無制限',
      'マルチクライアント管理ビュー',
      'ホワイトラベル対応',
      'API連携 (Make.com/Zapier)'
    ],
    maxAccounts: 50,
    maxMembers: 100,
    recommendedFor: '複数のクライアント案件を、AIで効率化したい代理店・制作会社の方',
    aiModel: 'Custom Fine-tuned Models + Full Ensemble'
  }
};

export type PlatformType = 
  | 'GoogleSearch' | 'GoogleDisplay' | 'TrueView'
  | 'YahooSearch' | 'YahooDisplay'
  | 'Instagram' | 'Facebook' | 'X' | 'LINE' | 'TikTok';

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  GoogleSearch: 'GoogleSearch',
  GoogleDisplay: 'GoogleDisplay',
  TrueView: 'TrueView',
  YahooSearch: 'YahooSearch',
  YahooDisplay: 'YahooDisplay',
  Instagram: 'Instagram',
  Facebook: 'Facebook',
  X: 'X',
  LINE: 'LINE',
  TikTok: 'TikTok'
};

export interface AdContent {
  headline: string;
  description: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  cta?: string;
  banners?: BannerMaster[];
}

export enum BannerType {
  Square = 'square',
  Wide = 'wide',
  Vertical = 'vertical'
}

export enum BannerDesignPreset {
  Impact = 'impact',
  Catalog = 'catalog',
  Minimal = 'minimal'
}

export interface BannerMaster {
  type: BannerType;
  url: string; // The final composed image URL (Data URL)
  backgroundUrl: string; // The raw AI generated background URL
  preset: BannerDesignPreset;
  headline: string;
  cta: string;
  backgroundPrompt: string;
}

export interface AIAdvice {
  score: number;
  comment: string;
  platformComparison: string;
}

export interface AdCensorshipResult {
  passed: boolean;
  score: number;
  feedback: string;
  violations: string[];
  checkedAt: number;
}

export interface Transaction {
  id: string;
  userUid: string;
  amount: number;
  type: 'credit_card' | 'bank_transfer' | 'charge' | 'spend';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  description?: string;
  approvedAt?: number;
  approvedBy?: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  targetUid?: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  jobTitle?: string;
  photoURL?: string;
  joinedAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  campaignId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'campaign';
  createdAt: number;
  authorId: string;
  authorEmail: string;
}

export interface HearingSession {
  id: string;
  timestamp: number;
  status: 'pending' | 'completed';
  questions: string[];
  answers: Record<string, string>;
  summary?: string;
}

export interface HearingResponse {
  question: string;
  suggestedAnswers?: string[];
}

export interface SatellitePage {
  id: string;
  ownerUid: string;
  campaignId?: string;
  title: string;
  slug: string;
  targetKeywords: string[];
  mainSiteUrl: string;
  htmlContent: string;
  cssContent: string;
  status: 'draft' | 'published' | 'archived';
  metrics: {
    views: number;
    clicks: number;
    conversions: number;
    cvi: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  logoUrl?: string;
  jobTitle?: string;
  role: 'admin' | 'user' | 'agent';
  plan: PlanType;
  billingCycle: 'monthly' | 'yearly';
  planExpiresAt?: number;
  scheduledPlan?: PlanType;
  scheduledBillingCycle?: 'monthly' | 'yearly';
  google_ad_account_id?: string;
  google_ads_connected?: boolean;
  meta_ad_account_id?: string;
  meta_ads_connected?: boolean;
  lastSeenAnnouncementAt?: number;
  createdAt: number;
  accessibleClientIds?: string[];
}

export interface UsageMetrics {
  monthlyDeposit: number;
  monthlyCreatives: number;
  monthlyCampaigns: number;
  adjustmentCreatives?: number;
  adjustmentCampaigns?: number;
  lastResetAt: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  cardHolder: string;
}

export interface WalletState {
  balance_total: number;
  balance_ad_budget: number;
  tax_holding: number;
  status: 'active' | 'paused' | 'inactive';
  autoChargeEnabled: boolean;
  autoChargeThreshold: number;
  autoChargeAmount: number;
  transactions: Transaction[];
  monthlyUsage: UsageMetrics;
  paymentMethods?: PaymentMethod[];
}

// ── 媒体スペック（ad-campaign-studio から移植） ──────────
// 既存の PlatformType（GoogleSearch 等 PascalCase）とは別名前空間。
// 入稿仕様（文字数・本数等）の定義に特化。
export type PlatformSpecKey =
  | 'google_ads'
  | 'google_display'
  | 'meta'
  | 'yahoo_search'
  | 'line_ads'
  | 'x_ads';

export interface PlatformField {
  key: string;
  label: string;
  maxChars: number;
  maxCount: number;
  isList: boolean;
  countMethod: 'simple' | 'jp_double' | 'half_width';
  note?: string;
  isTextarea?: boolean;
}

export interface PlatformSpec {
  key: PlatformSpecKey;
  displayName: string;
  shortName: string;
  color: string;
  badgeBg: string;
  fields: PlatformField[];
}

// ── ターゲット設定（ad-campaign-studio から移植） ──────────
export type TargetGender = 'all' | 'male' | 'female';
export type TargetDevice = 'pc' | 'smartphone' | 'both';
export type TargetRegionType = 'nationwide' | 'prefecture';

export interface PlatformTargetDetail {
  // Google検索
  matchType?: 'exact' | 'phrase' | 'broad';
  bidStrategy?: 'maximize_clicks' | 'target_cpa' | 'target_roas';
  targetCpa?: string;
  targetRoas?: string;
  // GDN
  audiences?: string[];
  // Meta
  placements?: string[];
  campaignObjective?: 'awareness' | 'traffic' | 'conversion';
  optimizationEvent?: string;
  // Yahoo!
  matchTypes?: string[];
  yahooBidStrategy?: 'maximize_clicks' | 'target_cpa';
  yahooTargetCpa?: string;
  // LINE
  linePlacements?: string[];
  lineFormats?: string[];
  // X
  xPlacements?: string[];
  xObjective?: 'reach' | 'engagement' | 'followers' | 'website_visit';
}

export interface TargetInfo {
  gender: TargetGender;
  ageGroups: string[];
  region: TargetRegionType;
  prefectures: string[];
  device: TargetDevice;
  platformDetails: Partial<Record<PlatformType, PlatformTargetDetail>>;
  keywords: string[];
  keywordMatchType: 'exact' | 'phrase' | 'broad';
}

export const DEFAULT_TARGET_INFO: TargetInfo = {
  gender: 'all',
  ageGroups: [],
  region: 'nationwide',
  prefectures: [],
  device: 'both',
  platformDetails: {},
  keywords: [],
  keywordMatchType: 'phrase',
};

// AIが提案するキーワードの情報
export interface KeywordSuggestion {
  keyword: string;
  volume?: 'high' | 'medium' | 'low';
  competition?: 'high' | 'medium' | 'low';
  reason?: string;
}
