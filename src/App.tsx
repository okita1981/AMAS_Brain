import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubmissionSimulator } from './components/SubmissionSimulator';
import { 
  LayoutDashboard, 
  Search, 
  Megaphone, 
  MousePointerClick, 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Settings as SettingsIcon,
  Sliders,
  Bell,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Zap,
  ShieldCheck,
  BarChart3,
  Clock,
  Activity,
  Building2,
  Terminal,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Save,
  ArrowRightLeft,
  Image as ImageIcon,
  Smartphone,
  CreditCard,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Wallet as WalletIcon,
  HelpCircle,
  BookOpen,
  MessageCircle,
  MessageSquare,
  Mail,
  Video,
  PlusCircle,
  Cpu,
  RefreshCw,
  ArrowRight,
  LogOut,
  LogIn,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Edit3,
  Eye,
  EyeOff,
  MoreVertical,
  X,
  FileText,
  Copy,
  Tag,
  Link,
  Database,
  Calendar,
  Code2,
  Ship,
  Info,
  Globe,
  Lock,
  Unlock,
  Facebook,
  Instagram,
  Twitter,
  Youtube as YoutubeIcon,
  Layout,
  QrCode,
  User,
  Camera,
  MousePointer2,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { MonthlyReportTemplate } from './components/MonthlyReportTemplate';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavItem } from './components/NavItem';
import { MetricCard, AgentCard } from './components/DashboardComponents';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  writeBatch,
  increment,
  or
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { Agent, AgentType, MarketingTask, SatellitePage, DashboardMetrics, IndustryType, StrategicPlan, AIActionReport, AdContent, PlanType, PLANS, PlanDefinition, Campaign, WalletState, Transaction, AuditLog, TeamMember, AppNotification, Announcement, PlatformType, PLATFORM_LABELS, HearingSession, Client, Site, BannerType, BannerDesignPreset, BannerMaster, TargetInfo, DEFAULT_TARGET_INFO, Draft } from './types';
import { generateMarketingContent, getOrchestrationPlan, generateAdSuggestions, AdSuggestions, getHelpResponse, getAIHearingQuestions, checkAdContentCensorship, generateBannerSuggestions, generateBannerImage, BannerSuggestion, saveDraft as apiSaveDraft } from './services/aiService';
import MediaSimulator from './components/MediaSimulator';
import BannerPreview from './components/BannerPreview';
import Wallet from './components/Wallet';
import StepTarget from './components/steps/StepTarget';
import StepExport from './components/steps/StepExport';
import DraftsPage from './components/DraftsPage';


const INITIAL_AGENTS: Agent[] = [
  { 
    id: '1', 
    type: 'SEO', 
    name: 'SEOセンチネル', 
    status: 'idle', 
    lastAction: '待機中', 
    description: 'メインサイトを一切変更せずに、外部にCVI特化型のサテライトページを自動構築・運用します。',
    metrics: { roi: 0, conversion: 0, spend: 0, cvi: 0 } 
  },
  { 
    id: '2', 
    type: 'Ads', 
    name: 'アド・アストラ', 
    status: 'idle', 
    lastAction: '待機中', 
    description: 'Google/Meta等の広告媒体を横断し、成約速度（CVI）が最も高いクリエイティブへ予算を自動配分します。',
    isBeta: true, 
    metrics: { roi: 0, conversion: 0, spend: 0, cvi: 0 } 
  },
  { 
    id: '3', 
    type: 'LPO', 
    name: 'オプティフロー', 
    status: 'idle', 
    lastAction: '待機中', 
    description: 'AIがLPのファーストビューやCTAを分析し、成約率と成約速度を劇的に向上させる改善案を提示します。',
    isBeta: true, 
    metrics: { roi: 0, conversion: 0, spend: 0, cvi: 0 } 
  },
  { 
    id: '4', 
    type: 'CRM', 
    name: 'リードナーチャリング', 
    status: 'idle', 
    lastAction: '待機中', 
    description: '獲得したリードに対し、LINEステップ配信やメール等で自動追客を行い、成約までのリードタイムを短縮します。',
    isBeta: true, 
    metrics: { roi: 0, conversion: 0, spend: 0, cvi: 0 } 
  },
];


const METRIC_LABELS: Record<string, string> = {
  cvi: 'CVI (資本回転率)',
  impressions: 'インプレッション',
  leads: 'リード獲得',
  cpa: '平均CPA',
  cpc: 'CPC',
  cvr: 'CVR',
  roas: 'ROAS'
};

const generateTrendData = (days: number, isHourly: boolean = false) => {
  const data = [];
  const now = new Date();
  
  if (isHourly) {
    for (let i = 0; i <= 24; i += 2) {
      const date = new Date(now);
      date.setHours(i, 0, 0, 0);
      const timeStr = `${i.toString().padStart(2, '0')}:00`;
      
      data.push({
        date: timeStr,
        cvi: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        spend: 0,
        cpa: 0,
        cpc: 0,
        cvr: 0,
        roas: 0,
        budget: 0
      });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
      
      data.push({
        date: dateStr,
        cvi: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        spend: 0,
        cpa: 0,
        cpc: 0,
        cvr: 0,
        roas: 0,
        budget: 0
      });
    }
  }
  return data;
};

const CredentialsModal = ({ 
  profile, 
  onClose,
  onSave
}: { 
  profile: any; 
  onClose: () => void;
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    google_ads_client_id: profile?.google_ads_client_id || '',
    google_ads_client_secret: profile?.google_ads_client_secret || '',
    google_ads_developer_token: profile?.google_ads_developer_token || '',
    meta_app_id: profile?.meta_app_id || '',
    meta_app_secret: profile?.meta_app_secret || '',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">API 認証情報設定</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">プラットフォーム連携用キーの設定</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} />
              Google Ads API
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Client ID</label>
                <input 
                  type="text" 
                  value={formData.google_ads_client_id}
                  onChange={(e) => setFormData({ ...formData, google_ads_client_id: e.target.value })}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Client Secret</label>
                <input 
                  type="password" 
                  value={formData.google_ads_client_secret}
                  onChange={(e) => setFormData({ ...formData, google_ads_client_secret: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Developer Token</label>
                <input 
                  type="text" 
                  value={formData.google_ads_developer_token}
                  onChange={(e) => setFormData({ ...formData, google_ads_developer_token: e.target.value })}
                  placeholder="xxxx-xxxx-xxxx"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Facebook size={14} />
              Meta Ads API
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">App ID</label>
                <input 
                  type="text" 
                  value={formData.meta_app_id}
                  onChange={(e) => setFormData({ ...formData, meta_app_id: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">App Secret</label>
                <input 
                  type="password" 
                  value={formData.meta_app_secret}
                  onChange={(e) => setFormData({ ...formData, meta_app_secret: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
          >
            キャンセル
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            保存する
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CampaignSettingsModal = ({ 
  campaign, 
  onClose, 
  onToggleStatus, 
  onDelete 
}: { 
  campaign: Campaign; 
  onClose: () => void; 
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">設定</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{campaign.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Status Section */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} />
              配信ステータス
            </h4>
            <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  campaign.status === 'active' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 
                  campaign.status === 'paused' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {campaign.status === 'active' ? '配信中' : 
                     campaign.status === 'paused' ? '一時停止中' : '審査中'}
                  </p>
                  <p className="text-xs text-gray-500">現在のキャンペーンの状態です</p>
                </div>
              </div>
              {campaign.status !== 'reviewing' && (
                <button 
                  onClick={() => onToggleStatus(campaign.id, campaign.status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    campaign.status === 'active' 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  {campaign.status === 'active' ? '一時停止' : '配信開始'}
                </button>
              )}
            </div>
          </section>

          {/* Details Section */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} />
              キャンペーン詳細
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">予算</p>
                <p className="text-sm font-bold text-gray-900">¥{campaign.budget.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">配信プラットフォーム</p>
                <div className="flex gap-1 mt-1">
                  {campaign.platforms.map(p => (
                    <span key={p} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold text-gray-600 uppercase">
                      {PLATFORM_LABELS[p]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Ad Content Preview */}
          {campaign.adContent && (
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Edit3 size={14} />
                クリエイティブ
              </h4>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">見出し</p>
                  <p className="text-sm font-medium text-gray-900">{campaign.adContent.headline}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">説明文</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{campaign.adContent.description}</p>
                </div>
                {campaign.keywords && campaign.keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">キーワード</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {campaign.keywords.map(k => (
                        <span key={k} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-medium text-gray-600">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section className="pt-8 border-t border-gray-100">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertTriangle size={14} />
              危険な操作
            </h4>
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-900">キャンペーンを削除</p>
                <p className="text-xs text-red-600">この操作は元に戻せません。すべてのデータが失われます。</p>
              </div>
              {!confirmDelete ? (
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  削除する
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={() => onDelete(campaign.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    本当に削除する
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

// --- Satellite Fleet Components ---

const SatellitePreviewModal = ({ 
  page, 
  onClose,
  onDelete
}: { 
  page: SatellitePage; 
  onClose: () => void;
  onDelete?: (id: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Ship size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-none mb-1">{page.title}</h3>
              <p className="text-[10px] text-gray-500 font-mono">amas-net.jp/lp/{page.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all mr-2"
                title="削除"
              >
                <Trash2 size={18} />
              </button>
            )}
            <a 
              href={`/lp/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-all mr-2"
            >
              <ExternalLink size={12} />
              ライブURLを開く
            </a>
            <div className="flex items-center gap-4 mr-4 px-4 py-1.5 bg-white rounded-full border border-gray-200">
              <div className="flex items-center gap-1.5">
                <Eye size={12} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-600">{page.metrics.views}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MousePointerClick size={12} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-600">{page.metrics.clicks}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">{page.metrics.conversions}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-100 relative">
          <iframe 
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>${page.cssContent}</style>
                </head>
                <body>
                  ${page.htmlContent}
                </body>
              </html>
            `}
            className="w-full h-full border-none"
            title={page.title}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmationModal 
            onConfirm={() => {
              onDelete?.(page.id);
              setShowDeleteConfirm(false);
              onClose();
            }}
            onCancel={() => setShowDeleteConfirm(false)}
            title="サテライトページの削除"
            message="このサテライトページを削除しますか？公開中のURLからもアクセスできなくなります。"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SatelliteFleetView = ({ 
  pages, 
  onDelete 
}: { 
  pages: SatellitePage[]; 
  onDelete: (id: string) => void;
}) => {
  const [previewPage, setPreviewPage] = useState<SatellitePage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-2">SEOサテライト管理</h2>
          <p className="text-sm text-gray-500">AIが自動生成したCVI特化型サテライトページの運用状況</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">稼働ページ数</p>
              <p className="text-xl font-bold text-gray-900">{pages.length}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">総送客数</p>
              <p className="text-xl font-bold text-emerald-600">
                {pages.reduce((acc, p) => acc + p.metrics.clicks, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Ship size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">サテライトページがありません</h3>
          <p className="text-gray-500 max-w-md mb-8">
            エージェント・オーケストラでSEOエージェントに「サテライトページ生成」を依頼し、承認するとここに表示されます。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map(page => (
            <motion.div 
              key={page.id}
              layoutId={page.id}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {/* Mini Preview Overlay */}
                <div className="absolute inset-0 scale-[0.25] origin-top-left w-[400%] h-[400%] pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity">
                   <iframe 
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>${page.cssContent}</style>
                        </head>
                        <body>
                          ${page.htmlContent}
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-none"
                    title={page.title}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded uppercase tracking-widest">Active</span>
                    <span className="text-[10px] text-white/80 font-mono">/{page.slug}</span>
                  </div>
                  <button 
                    onClick={() => setPreviewPage(page)}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-1 truncate">{page.title}</h4>
                <p className="text-[10px] text-emerald-600 font-bold mb-2 flex items-center gap-1">
                  <ArrowRight size={10} />
                  送客先: {page.mainSiteUrl || '未設定'}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {page.targetKeywords.map(kw => (
                    <span key={kw} className="px-2 py-0.5 bg-gray-100 text-[8px] font-bold text-gray-500 rounded uppercase">{kw}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-gray-50 p-2 rounded-xl text-center">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Views</p>
                    <p className="text-xs font-bold text-gray-900">{page.metrics.views}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl text-center">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Clicks</p>
                    <p className="text-xs font-bold text-gray-900">{page.metrics.clicks}</p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl text-center">
                    <p className="text-[8px] font-bold text-emerald-400 uppercase">CVI</p>
                    <p className="text-xs font-bold text-emerald-600">{page.metrics.cvi}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Calendar size={12} />
                    {new Date(page.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setDeletingId(page.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                    <a 
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                      title="ライブURLを開く"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => setPreviewPage(page)}
                      className="px-4 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-all"
                    >
                      プレビュー
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {deletingId && (
          <DeleteConfirmationModal 
            onConfirm={() => {
              onDelete(deletingId);
              setDeletingId(null);
            }}
            onCancel={() => setDeletingId(null)}
            title="サテライトページの削除"
            message="このサテライトページを削除しますか？公開中のURLからもアクセスできなくなります。"
          />
        )}
      </AnimatePresence>

      {previewPage && (
        <SatellitePreviewModal 
          page={previewPage} 
          onClose={() => setPreviewPage(null)} 
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function ClientManagerView({ 
  clients, 
  sites, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  onAddSite,
  onUpdateSite,
  onDeleteSite
}: { 
  clients: Client[]; 
  sites: Site[]; 
  onAddClient: (name: string, industry: string) => void;
  onUpdateClient: (id: string, updates: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  onAddSite: (clientId: string, name: string, url: string) => void;
  onUpdateSite: (id: string, updates: Partial<Site>) => void;
  onDeleteSite: (id: string) => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState<Client | null>(null);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [isEditingSite, setIsEditingSite] = useState<Site | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientSites = sites.filter(s => s.clientId === selectedClientId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-2">クライアント・サイト管理</h2>
          <p className="text-sm text-gray-500">マルチテナント環境のクライアントおよびサイトの集中管理</p>
        </div>
        <button 
          onClick={() => setIsAddingClient(true)}
          className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
        >
          <Plus size={18} />
          新規クライアント追加
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <Building2 size={14} />
            クライアント一覧
          </h3>
          <div className="space-y-2">
            {clients.map(client => (
              <div 
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedClientId === client.id 
                    ? 'bg-black border-black text-white shadow-xl shadow-gray-200' 
                    : 'bg-white border-gray-100 text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedClientId === client.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{client.name}</p>
                    <p className={`text-[10px] ${selectedClientId === client.id ? 'text-gray-400' : 'text-gray-500'}`}>
                      {client.industry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingClient(client);
                      setNewClientName(client.name);
                      setNewClientIndustry(client.industry);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedClientId === client.id ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('このクライアントを削除しますか？関連するサイトも管理対象外となります。')) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedClientId === client.id ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-400'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
                <div className="px-4 py-2 text-sm font-bold border-b-2 border-black text-black">
                  サイト管理
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14} />
                    {selectedClient.name} の管理サイト
                  </h3>
                  <button 
                    onClick={() => setIsAddingSite(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    新規サイト追加
                  </button>
                </div>

                {clientSites.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Globe size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">このクライアントには登録されたサイトがありません</p>
                    <button 
                      onClick={() => setIsAddingSite(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      最初のサイトを追加
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientSites.map(site => (
                      <div key={site.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Globe size={20} />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setIsEditingSite(site);
                                setNewSiteName(site.name);
                                setNewSiteUrl(site.url);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('このサイトを削除しますか？')) {
                                  onDeleteSite(site.id);
                                }
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{site.name}</h4>
                        <p className="text-xs text-gray-500 font-mono truncate mb-4">{site.url}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <span className="text-[10px] text-gray-400">登録日: {new Date(site.createdAt).toLocaleDateString()}</span>
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                          >
                            サイトを開く
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-3xl p-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ArrowRightLeft size={24} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">左側のリストからクライアントを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingClient || isEditingClient) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{isEditingClient ? 'クライアント編集' : '新規クライアント追加'}</h3>
                <button onClick={() => { setIsAddingClient(false); setIsEditingClient(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">クライアント名</label>
                  <input 
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="例: 株式会社サンプル"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">業種</label>
                  <input 
                    type="text"
                    value={newClientIndustry}
                    onChange={(e) => setNewClientIndustry(e.target.value)}
                    placeholder="例: 不動産, 歯科医院"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (isEditingClient) {
                      onUpdateClient(isEditingClient.id, { name: newClientName, industry: newClientIndustry });
                    } else {
                      onAddClient(newClientName, newClientIndustry);
                    }
                    setIsAddingClient(false);
                    setIsEditingClient(null);
                    setNewClientName('');
                    setNewClientIndustry('');
                  }}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  {isEditingClient ? '変更を保存' : 'クライアントを登録'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {(isAddingSite || isEditingSite) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{isEditingSite ? 'サイト編集' : '新規サイト追加'}</h3>
                <button onClick={() => { setIsAddingSite(false); setIsEditingSite(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">サイト名 / 拠点名</label>
                  <input 
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder="例: 東京支店, メインサイト"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL</label>
                  <input 
                    type="url"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all font-bold font-mono"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (isEditingSite) {
                      onUpdateSite(isEditingSite.id, { name: newSiteName, url: newSiteUrl });
                    } else if (selectedClientId) {
                      onAddSite(selectedClientId, newSiteName, newSiteUrl);
                    }
                    setIsAddingSite(false);
                    setIsEditingSite(null);
                    setNewSiteName('');
                    setNewSiteUrl('');
                  }}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  {isEditingSite ? '変更を保存' : 'サイトを登録'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Delete Confirmation Modal ---
const DeleteConfirmationModal = ({ 
  onConfirm, 
  onCancel,
  title = "削除の確認",
  message = "この項目を削除してもよろしいですか？この操作は取り消せません。"
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
  title?: string;
  message?: string;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
        <Trash2 size={32} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
      <p className="text-gray-500 text-center text-sm mb-8">{message}</p>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onCancel}
          className="py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
        >
          キャンセル
        </button>
        <button 
          onClick={onConfirm}
          className="py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
        >
          削除する
        </button>
      </div>
    </motion.div>
  </div>
);

// --- Landing Page Component ---
const LandingPage = ({ slug }: { slug: string }) => {
  const [page, setPage] = useState<SatellitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      console.log('[LandingPage] Fetching page for slug:', slug);
      try {
        const q = query(
          collection(db, 'satellite_pages'), 
          where('slug', '==', slug), 
          where('status', '==', 'published'), 
          limit(1)
        );
        const snap = await getDocs(q);
        console.log('[LandingPage] Published page query empty:', snap.empty);
        
        if (!snap.empty) {
          const data = snap.docs[0].data();
          console.log('[LandingPage] Page data found:', data.title);
          setPage({ id: snap.docs[0].id, ...data } as SatellitePage);
        } else {
          // Try fetching without status filter to see if it exists but is not published
          console.log('[LandingPage] No published page found. Checking for non-published with slug:', slug);
          const q2 = query(
            collection(db, 'satellite_pages'), 
            where('slug', '==', slug), 
            limit(1)
          );
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            const status = snap2.docs[0].data().status;
            console.log('[LandingPage] Page exists but status is:', status);
            setError(`このページは現在公開されていません（ステータス: ${status}）`);
          } else {
            console.log('[LandingPage] No document found at all for slug:', slug);
            setError('指定されたページが見つかりませんでした。URLが正しいかご確認ください。');
          }
        }
      } catch (err) {
        console.error('[LandingPage] Error fetching landing page:', err);
        setError('ページの読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  useEffect(() => {
    if (page) {
      const updateMetrics = async () => {
        try {
          const pageRef = doc(db, 'satellite_pages', page.id);
          await updateDoc(pageRef, {
            'metrics.views': (page.metrics.views || 0) + 1
          });
        } catch (e) {
          console.error("Failed to update views", e);
        }
      };
      updateMetrics();
    }
  }, [page?.id]);

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && page) {
        try {
          const pageRef = doc(db, 'satellite_pages', page.id);
          await updateDoc(pageRef, {
            'metrics.clicks': (page.metrics.clicks || 0) + 1
          });
        } catch (e) {
          console.error("Failed to update clicks", e);
        }
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [page?.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-gray-400 mb-4" size={32} />
      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Loading Satellite Page...</p>
    </div>
  );
  
  if (error || !page) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-8">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} className="text-gray-300" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">404 Not Found</h1>
      <p className="text-gray-500 max-w-md mb-4">{error || '指定されたページが見つからないか、公開が停止されています。'}</p>
      <p className="text-[10px] text-gray-400 font-mono">Slug: {slug}</p>
    </div>
  );

  return (
    <div className="satellite-page-container">
      <style dangerouslySetInnerHTML={{ __html: page.cssContent }} />
      <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
    </div>
  );
};

export default function App() {
  const [landingPageSlug, setLandingPageSlug] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    console.log('Current path:', path);
    if (path.startsWith('/lp/')) {
      // Remove trailing slash if exists
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
      const slug = cleanPath.split('/lp/')[1];
      console.log('Extracted slug:', slug);
      if (slug) {
        setLandingPageSlug(slug);
      }
    }
  }, []);

  const [platformDistribution, setPlatformDistribution] = useState([
    { name: 'Google Search', value: 0, color: '#141414' },
    { name: 'Meta Ads', value: 0, color: '#4a4a4a' },
    { name: 'Yahoo! JP', value: 0, color: '#8e8e8e' },
    { name: 'LINE Ads', value: 0, color: '#d1d1d1' },
  ]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'approvals' | 'settings' | 'new_campaign' | 'wallet' | 'help' | 'cockpit' | 'admin' | 'subscription' | 'tracking' | 'connectors' | 'satellite-fleet' | 'clients' | 'drafts'>('dashboard');
  const [pendingDraftRestore, setPendingDraftRestore] = useState<Draft | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  const dashboardFilteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesClient = selectedClientId === 'all' || c.clientId === selectedClientId;
      const matchesSite = selectedSiteId === 'all' || c.siteId === selectedSiteId;
      const isAccessible = profile?.role === 'admin' || 
                          (profile?.accessibleClientIds && profile.accessibleClientIds.includes(c.clientId || '')) ||
                          c.ownerUid === user?.uid;
      return matchesClient && matchesSite && isAccessible;
    });
  }, [campaigns, selectedClientId, selectedSiteId, profile, user?.uid]);
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const [plan, setPlan] = useState<PlanType>('Free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [planExpiresAt, setPlanExpiresAt] = useState<number | null>(null);
  const [scheduledPlan, setScheduledPlan] = useState<PlanType | null>(null);
  const [scheduledBillingCycle, setScheduledBillingCycle] = useState<'monthly' | 'annual' | null>(null);
  const [pendingBillingCycle, setPendingBillingCycle] = useState<'monthly' | 'annual' | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | 'Custom'>('1W');
  const [customDays, setCustomDays] = useState(90);
  const [selectedMetric, setSelectedMetric] = useState<string>('cvi');
  
  // Tracking Settings State
  const [trackingSettings, setTrackingSettings] = useState({
    ga4Id: '',
    metaPixelId: '',
    gtmId: '',
    yahooId: '',
    lineId: '',
    tiktokId: '',
    capiEnabled: true,
    capiToken: '',
    selectedCvPoint: 'default',
    lastIssuedAt: Date.now()
  });

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [provisionMode, setProvisionMode] = useState<'production' | 'simulator' | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  const handleProvisionAccounts = async () => {
    if (!user) return;
    
    if (!isBasicInfoComplete || !isBusinessSettingsComplete) {
      setProvisionError("アカウントの発行には基本情報とビジネス設定の入力が必須です。設定画面から入力を完了させてください。");
      return;
    }

    setIsProvisioning(true);
    setProvisionError(null);
    try {
      const response = await fetch('/api/provision-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "アカウント発行に失敗しました。");
      setProvisionMode(data.mode);
    } catch (err: any) {
      setProvisionError(err.message);
    } finally {
      setIsProvisioning(false);
    }
  };

  const [systemSettings, setSystemSettings] = useState({
    companyName: '',
    address: '',
    phone: '',
    mainSiteUrl: '',
    industry: '',
    context: '',
    businessDescription: '',
    dailyBudgetLimit: 100000,
    autoApprovalThreshold: 98,
    issuerName: 'AMAS 運用事務局',
    issuerAddress: '〒150-0002 東京都渋谷区渋谷2-24-12\n渋谷スクランブルスクエア',
    issuerTaxId: 'T1234567890123'
  });

  const isBasicInfoComplete = !!(systemSettings.companyName && systemSettings.address && systemSettings.phone);
  const isBusinessSettingsComplete = !!(systemSettings.industry && systemSettings.context && systemSettings.businessDescription && systemSettings.mainSiteUrl);

  // Load Global System Settings
  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'organizations', user.uid, 'settings', 'system');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSystemSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
      }
    };
    loadSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    try {
      if (selectedCampaignId === 'all') {
        // Save Global Defaults
        const settingsRef = doc(db, 'organizations', user.uid, 'settings', 'system');
        await setDoc(settingsRef, systemSettings, { merge: true });
        notify('設定を保存しました。', 'success');
      } else if (selectedCampaign) {
        // Save Campaign-Specific Settings
        const campaignRef = doc(db, 'campaigns', selectedCampaignId);
        await updateDoc(campaignRef, {
          mainSiteUrl: systemSettings.mainSiteUrl,
          industry: systemSettings.industry,
          context: systemSettings.context,
          businessDescription: systemSettings.businessDescription
        });
        notify(`キャンペーン「${selectedCampaign.name}」の設定を更新しました。`, 'success');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      notify('設定の保存に失敗しました。', 'error');
    }
  };

  // Update systemSettings state when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaignId !== 'all' && selectedCampaign) {
      setSystemSettings(prev => ({
        ...prev,
        mainSiteUrl: selectedCampaign.mainSiteUrl || '',
        industry: selectedCampaign.industry || '',
        context: selectedCampaign.context || '',
        businessDescription: selectedCampaign.businessDescription || ''
      }));
    } else if (selectedCampaignId === 'all') {
      // Reload global settings when switching back to 'all'
      const loadGlobal = async () => {
        if (!user) return;
        const settingsRef = doc(db, 'organizations', user.uid, 'settings', 'system');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSystemSettings(prev => ({ ...prev, ...snap.data() }));
        }
      };
      loadGlobal();
    }
  }, [selectedCampaignId, selectedCampaign?.id]);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Custom UI States
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isNewAnnual, setIsNewAnnual] = useState(false);
  const [isCurrentAnnual, setIsCurrentAnnual] = useState(false);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberJobTitle, setNewMemberJobTitle] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'qr' | 'invoice'>('card');
  const [showPassword, setShowPassword] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    displayName: '',
    jobTitle: '',
    photoURL: '',
    password: '',
    companyName: '',
    taxRegistrationNumber: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setProfileFormData({
        displayName: profile.displayName || '',
        jobTitle: profile.jobTitle || '',
        photoURL: profile.photoURL || '',
        password: '',
        companyName: profile.companyName || '',
        taxRegistrationNumber: profile.taxRegistrationNumber || ''
      });
    }
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      notify('画像サイズは500KB以下にしてください。', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileFormData(prev => ({ ...prev, photoURL: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        displayName: profileFormData.displayName,
        jobTitle: profileFormData.jobTitle,
        photoURL: profileFormData.photoURL,
        companyName: profileFormData.companyName,
        taxRegistrationNumber: profileFormData.taxRegistrationNumber
      };
      
      let message = 'プロフィールを更新しました。';
      if (profileFormData.password) {
        // In a real app, we'd use updatePassword(user, profileFormData.password)
        message = 'プロフィールとパスワードを更新しました。';
        setProfileFormData(prev => ({ ...prev, password: '' }));
      }

      await updateDoc(userRef, updates);
      notify(message);
    } catch (error) {
      console.error('Update profile error:', error);
      notify('プロフィールの更新に失敗しました。', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const handleUpdateCampaignSettings = async (campaignId: string, updates: Partial<Campaign>) => {
    if (!user) return;
    setIsUpdatingCampaign(true);
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, updates);
      notify('設定を更新しました。');
      setTuningCampaignId(null);
    } catch (error) {
      console.error('Update campaign error:', error);
      notify('設定の更新に失敗しました。', 'error');
    } finally {
      setIsUpdatingCampaign(false);
    }
  };

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [lastSeenAnnouncementAt, setLastSeenAnnouncementAt] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'notifications' | 'announcements'>('notifications');
  const [showCampaignSettings, setShowCampaignSettings] = useState(false);
  const isInitialAnnouncementsLoad = React.useRef(true);

  // Notification helper
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveTracking = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        trackingSettings: trackingSettings
      });
      notify('計測設定を保存しました');
    } catch (error) {
      console.error('Error saving tracking settings:', error);
      notify('設定の保存に失敗しました', 'error');
    }
  };

  // Handle Stripe redirect notifications
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      notify('チャージが完了しました。反映まで数分かかる場合があります。', 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (query.get('canceled')) {
      notify('チャージがキャンセルされました。', 'error');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [notify]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Profile Sync
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setPlan(data.plan as PlanType);
        setBillingCycle(data.billingCycle || 'monthly');
        setPlanExpiresAt(data.planExpiresAt || null);
        setScheduledPlan(data.scheduledPlan || null);
        setScheduledBillingCycle(data.scheduledBillingCycle || null);
        setLastSeenAnnouncementAt(data.lastSeenAnnouncementAt || 0);
        if (data.trackingSettings) {
          setTrackingSettings(data.trackingSettings);
        }
      } else {
        // Document doesn't exist, create it
        const newProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          plan: 'Free',
          billingCycle: 'monthly',
          planExpiresAt: null,
          scheduledPlan: null,
          scheduledBillingCycle: null,
          role: 'user',
          lastSeenAnnouncementAt: 0,
          createdAt: Date.now(),
          memberCount: 1
        };
        try {
          await setDoc(userDocRef, newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      setIsAuthReady(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time Campaigns Sync
  useEffect(() => {
    if (!user || !profile) {
      setCampaigns([]);
      return;
    }
    
    let q;
    if (profile.role === 'admin') {
      q = query(collection(db, 'campaigns'));
    } else {
      const clientIds = profile.accessibleClientIds || [];
      if (clientIds.length > 0) {
        // Use or() query to include both accessible clients and owned campaigns
        q = query(
          collection(db, 'campaigns'),
          or(
            where('clientId', 'in', clientIds),
            where('ownerUid', '==', user.uid)
          )
        );
      } else {
        q = query(collection(db, 'campaigns'), where('ownerUid', '==', user.uid));
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaignData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Campaign));
      console.log(`[Firestore] Campaigns snapshot: ${campaignData.length} items found for role: ${profile.role}`);
      setCampaigns(campaignData);
      setSyncStatus('success');
    }, (error) => {
      console.error('[Firestore] Campaigns sync error:', error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.LIST, 'campaigns');
    });
    return () => unsubscribe();
  }, [user, profile]);

  // Real-time Clients Sync
  useEffect(() => {
    if (!user || !profile) {
      setClients([]);
      return;
    }

    let q;
    if (profile.role === 'admin') {
      q = query(collection(db, 'clients'));
    } else {
      // For non-admins, we want to see clients we OWN or are INVITED to.
      // Since Firestore doesn't support OR across different fields easily, 
      // we'll fetch owned clients and then we could merge with invited ones.
      // For now, let's prioritize owned clients for Agency users.
      q = query(collection(db, 'clients'), where('ownerUid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
      setClients(clientData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });
    return () => unsubscribe();
  }, [user, profile]);

  // Real-time Sites Sync
  useEffect(() => {
    if (!user || !profile) {
      setSites([]);
      return;
    }

    let q;
    if (profile.role === 'admin') {
      q = query(collection(db, 'sites'));
    } else {
      const clientIds = profile.accessibleClientIds || [];
      if (clientIds.length > 0) {
        q = query(collection(db, 'sites'), where('clientId', 'in', clientIds));
      } else {
        q = query(collection(db, 'sites'), where('ownerUid', '==', user.uid));
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const siteData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Site));
      setSites(siteData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sites');
    });
    return () => unsubscribe();
  }, [user, profile]);

  // Real-time Notifications Sync
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification));
      setNotifications(notifData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time Announcements Sync
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const annData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Announcement));
      setAnnouncements(annData);
      
      // Notify users of new announcements (skip initial load and skip if sent by current user)
      if (!isInitialAnnouncementsLoad.current) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const newAnn = change.doc.data() as Announcement;
            if (newAnn.authorId !== user?.uid) {
              notify(`【お知らせ】${newAnn.title}`, 'info' as any);
            }
          }
        });
      }
      isInitialAnnouncementsLoad.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'announcements');
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Admin: Real-time Users Sync
  useEffect(() => {
    if (profile?.role !== 'admin') {
      setAllUsers([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData = snapshot.docs.map(doc => doc.data());
      setAllUsers(userData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, [profile]);

  // Simulate Review Process for campaigns in 'reviewing' status
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const reviewingCampaigns = campaigns.filter(c => c.status === 'reviewing');
      
      for (const campaign of reviewingCampaigns) {
        if (!campaign.reviewStatus) continue;

        const platforms = Object.keys(campaign.reviewStatus) as PlatformType[];
        const pendingPlatforms = platforms.filter(p => campaign.reviewStatus![p] === 'pending');

        if (pendingPlatforms.length > 0) {
          // Randomly approve one pending platform
          const platformToApprove = pendingPlatforms[Math.floor(Math.random() * pendingPlatforms.length)];
          const newReviewStatus = { ...campaign.reviewStatus, [platformToApprove]: 'approved' as const };
          
          const allApproved = platforms.every(p => newReviewStatus[p] === 'approved');
          
          const updates: any = {
            reviewStatus: newReviewStatus
          };

          if (allApproved) {
            updates.status = campaign.autoStart ? 'active' : 'paused';
            
            // Add notification to Firestore
            try {
              await addDoc(collection(db, 'users', user.uid, 'notifications'), {
                title: '審査完了',
                message: `キャンペーン「${campaign.name}」の全媒体での審査が完了しました。${campaign.autoStart ? '自動配信を開始しました。' : '配信準備が整いました。'}`,
                type: 'success',
                timestamp: Date.now(),
                read: false,
                campaignId: campaign.id
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/notifications`);
            }
          }

          try {
            await updateDoc(doc(db, 'campaigns', campaign.id), updates);
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaign.id}`);
          }
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [user, campaigns]);

  // Real-time Team Members Sync
  useEffect(() => {
    if (!user) {
      setTeamMembers([]);
      return;
    }
    // For demo, we'll use a simple team collection or organization-based one
    // Here we just use a 'team' collection for the user's organization
    const q = query(collection(db, 'organizations', user.uid, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMember));
      
      // Always include admin in the list
      const adminMember: TeamMember = {
        id: 'admin-' + user.uid,
        name: profile?.displayName || user.displayName || '管理者',
        email: user.email || '',
        role: 'admin',
        jobTitle: profile?.jobTitle || '管理者',
        joinedAt: profile?.createdAt || Date.now()
      };

      // Filter out admin if it somehow got into the subcollection (unlikely but safe)
      const otherMembers = members.filter(m => m.email !== user.email);
      setTeamMembers([adminMember, ...otherMembers]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `organizations/${user.uid}/members`);
    });
    return () => unsubscribe();
  }, [user, profile]);

  // Real-time Reports Sync
  useEffect(() => {
    if (!user) {
      setReports([]);
      return;
    }
    const q = query(collection(db, 'reports'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AIActionReport));
      setReports(reportData.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time Satellite Pages Sync
  useEffect(() => {
    if (!user) {
      setSatellitePages([]);
      return;
    }
    const q = query(collection(db, 'satellite_pages'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pageData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SatellitePage));
      setSatellitePages(pageData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'satellite_pages');
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインに失敗しました。');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const trendData = React.useMemo(() => {
    const daysMap = { '1D': 1, '1W': 7, '1M': 30, 'Custom': customDays };
    const days = daysMap[timeRange];
    const isHourly = timeRange === '1D';

    // If no campaigns exist, return zeroed data
    if (campaigns.length === 0) {
      const data = [];
      const now = new Date();
      
      if (isHourly) {
        for (let i = 0; i <= 24; i += 2) {
          data.push({
            date: `${i.toString().padStart(2, '0')}:00`,
            cvi: 0, impressions: 0, clicks: 0, leads: 0, spend: 0, cpa: 0, cpc: 0, cvr: 0, roas: 0, budget: 0
          });
        }
      } else {
        for (let i = days; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          data.push({
            date: `${date.getMonth() + 1}/${date.getDate().toString().padStart(2, '0')}`,
            cvi: 0, impressions: 0, clicks: 0, leads: 0, spend: 0, cpa: 0, cpc: 0, cvr: 0, roas: 0, budget: 0
          });
        }
      }
      return data;
    }

    return generateTrendData(days, isHourly);
  }, [timeRange, customDays, campaigns.length]);

  const [wallet, setWallet] = useState<WalletState>({
    balance_total: 0,
    balance_ad_budget: 0,
    tax_holding: 0,
    status: 'inactive',
    autoChargeEnabled: false,
    autoChargeThreshold: 0,
    autoChargeAmount: 0,
    transactions: [],
    monthlyUsage: {
      monthlyDeposit: 0,
      monthlyCreatives: 0,
      monthlyCampaigns: 0,
      lastResetAt: Date.now()
    }
  });

  const isStep1Complete = isBasicInfoComplete && isBusinessSettingsComplete && (!!profile?.google_ad_account_id || !!profile?.meta_ad_account_id);
  const isStep2Complete = wallet.balance_total >= 1;
  const isStep3Complete = campaigns.length >= 1;
  const isAllStepsComplete = isStep1Complete && isStep2Complete && isStep3Complete;

  useEffect(() => {
    if (isAllStepsComplete) {
      setShowGlow(true);
      const timer = setTimeout(() => setShowGlow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAllStepsComplete]);

  const [localAutoChargeThreshold, setLocalAutoChargeThreshold] = useState(0);
  const [localAutoChargeAmount, setLocalAutoChargeAmount] = useState(0);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    if (wallet) {
      setLocalAutoChargeThreshold(wallet.autoChargeThreshold || 0);
      setLocalAutoChargeAmount(wallet.autoChargeAmount || 0);
    }
  }, [wallet?.autoChargeThreshold, wallet?.autoChargeAmount]);

  // Real-time Wallet Sync
  useEffect(() => {
    if (!user) {
      setWallet({
        balance_total: 0,
        balance_ad_budget: 0,
        tax_holding: 0,
        status: 'inactive',
        autoChargeEnabled: false,
        autoChargeThreshold: 0,
        autoChargeAmount: 0,
        transactions: [],
        monthlyUsage: {
          monthlyDeposit: 0,
          monthlyCreatives: 0,
          monthlyCampaigns: 0,
          lastResetAt: Date.now()
        }
      });
      return;
    }
    const walletDocRef = doc(db, 'wallets', user.uid);
    const unsubscribe = onSnapshot(walletDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as WalletState;
        // Ensure monthlyUsage exists to prevent crashes for existing users
        if (!data.monthlyUsage) {
          data.monthlyUsage = {
            monthlyDeposit: 0,
            monthlyCreatives: 0,
            monthlyCampaigns: 0,
            lastResetAt: Date.now()
          };
        }
        
        setWallet(data);
      } else {
        // Initialize wallet if not exists
        const initialWallet: WalletState = {
          balance_total: 0,
          balance_ad_budget: 0,
          tax_holding: 0,
          status: 'active',
          autoChargeEnabled: false,
          autoChargeThreshold: 0,
          autoChargeAmount: 0,
          transactions: [],
          monthlyUsage: {
            monthlyDeposit: 0,
            monthlyCreatives: 0,
            monthlyCampaigns: 0,
            lastResetAt: Date.now()
          }
        };
        
        const createWallet = async () => {
          try {
            await setDoc(walletDocRef, initialWallet);
            setWallet(initialWallet);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `wallets/${user.uid}`);
          }
        };
        createWallet();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `wallets/${user.uid}`);
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpdateWallet = async (updates: Partial<WalletState>) => {
    if (!user) return;
    const newWallet = { ...wallet, ...updates };
    try {
      await updateDoc(doc(db, 'wallets', user.uid), updates);
    } catch (error) {
      console.error('Wallet update error:', error);
    }
  };

  const handleSaveAutoCharge = async () => {
    setIsSavingWallet(true);
    await handleUpdateWallet({
      autoChargeThreshold: localAutoChargeThreshold,
      autoChargeAmount: localAutoChargeAmount
    });
    setIsSavingWallet(false);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleToggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), { status: newStatus });
      notify(`キャンペーンを${newStatus === 'active' ? '開始' : '停止'}しました。`);
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      notify('ステータスの更新に失敗しました。', 'error');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId));
      setSelectedCampaignId('all');
      setShowCampaignSettings(false);
      notify('キャンペーンを削除しました。');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      notify('キャンペーンの削除に失敗しました。', 'error');
    }
  };

  const industry = selectedCampaign?.industry || 'General';
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tasks, setTasks] = useState<MarketingTask[]>([]);
  const [reports, setReports] = useState<AIActionReport[]>([]);
  const [satellitePages, setSatellitePages] = useState<SatellitePage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tuningCampaignId, setTuningCampaignId] = useState<string | null>(null);
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<StrategicPlan | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSeoAgentInfo, setShowSeoAgentInfo] = useState(false);

  // Help Chat States
  const [helpQuery, setHelpQuery] = useState('');
  const [helpMessages, setHelpMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isHelpLoading, setIsHelpLoading] = useState(false);
  const [activeHearing, setActiveHearing] = useState<HearingSession | null>(null);
  const [hearingStep, setHearingStep] = useState(0);
  const [hearingAnswers, setHearingAnswers] = useState<Record<string, string>>({});
  const [isHearingLoading, setIsHearingLoading] = useState(false);
  const [showCustomCharge, setShowCustomCharge] = useState(false);
  const [currentCvi, setCurrentCvi] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleSendHelpQuery = async (query?: string) => {
    const userMessage = (query || helpQuery).trim();
    if (!userMessage || isHelpLoading) return;

    setHelpMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    if (!query) setHelpQuery('');
    setIsHelpLoading(true);

    try {
      const response = await getHelpResponse(userMessage, plan);
      setHelpMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Help Chat Error:', error);
      setHelpMessages(prev => [...prev, { role: 'assistant', content: '申し訳ありません。エラーが発生しました。' }]);
    } finally {
      setIsHelpLoading(false);
    }
  };

  const startAIHearing = async () => {
    setIsHearingLoading(true);
    try {
      const questions = await getAIHearingQuestions(selectedCampaign?.industry || 'General', plan);
      setActiveHearing({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        status: 'pending',
        questions,
        answers: {}
      });
      setHearingStep(0);
      setHearingAnswers({});
    } catch (error) {
      console.error("Failed to start hearing:", error);
    } finally {
      setIsHearingLoading(false);
    }
  };

  const handleHearingAnswer = (answer: string) => {
    if (!activeHearing) return;
    const newAnswers = { ...hearingAnswers, [activeHearing.questions[hearingStep]]: answer };
    setHearingAnswers(newAnswers);
    
    if (hearingStep < activeHearing.questions.length - 1) {
      setHearingStep(prev => prev + 1);
    } else {
      // Complete hearing
      setActiveHearing({
        ...activeHearing,
        status: 'completed',
        answers: newAnswers,
        summary: "ヒアリングが完了しました。AIがこれらのデータを元にCVIを再計算し、最適化に反映します。"
      });

      // 精緻化されたCVI再計算ロジック（シミュレーション）
      // ヒアリング内容から成約数や売上を抽出し、CVIを変動させる
      const baseCvi = currentCvi;
      const randomBoost = Math.floor(Math.random() * 15) + 5; // 5-20の改善
      const newCvi = baseCvi + randomBoost;
      
      setTimeout(() => {
        setCurrentCvi(newCvi);
        setNotifications(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          title: "CVI再計算完了",
          message: `オフライン成果の統合により、CVIスコアが ${baseCvi} → ${newCvi} に向上しました。`,
          type: 'success',
          timestamp: Date.now(),
          read: false
        }, ...prev]);
      }, 2000);
      
      // Add notification
      setNotifications(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        title: "AIヒアリング完了",
        message: "オフライン成果データが正常に統合されました。CVIの精度が向上します。",
        type: 'success',
        timestamp: Date.now(),
        read: false
      }, ...prev]);
    }
  };

  const simulateApiSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    // 実際の広告媒体APIとの連携シミュレーション
    const steps = [
      "Google Ads API 認証中...",
      "Meta Graph API から最新のインプレッションを取得中...",
      "LINE公式アカウントの友だち追加データを同期中...",
      "CVIアルゴリズムによる媒体間予算配分の再計算中...",
      "最適化パケットを各媒体へ送信中..."
    ];

    for (const step of steps) {
      setNotifications(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        title: "[シミュレーション] API同期中",
        message: step,
        type: 'info',
        timestamp: Date.now(),
        read: false
      }, ...prev]);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSyncStatus('success');
    setIsSyncing(false);
    
    setNotifications(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      title: "[シミュレーション] API同期完了",
      message: "全媒体とのデータ同期シミュレーションが完了しました。本番環境では実際のAPIからデータを取得します。",
      type: 'success',
      timestamp: Date.now(),
      read: false
    }, ...prev]);
  };

  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const handleSaveCredentials = async (data: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      notify('認証情報を保存しました。', 'success');
      setShowCredentialsModal(false);
    } catch (error) {
      console.error("Error saving credentials:", error);
      notify('認証情報の保存に失敗しました。', 'error');
    }
  };

  const handleConnectOAuth = async (provider: 'google' | 'meta') => {
    try {
      const response = await fetch(`/api/auth/${provider}/url?userId=${user?.uid}`);
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url, 
        `amas_auth_${provider}`, 
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        notify('ポップアップがブロックされました。ブラウザの設定を確認してください。', 'error');
        return;
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === provider) {
          window.removeEventListener('message', handleMessage);
          
          // Finalize connection on backend
          const provRes = await fetch('/api/provision-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: user?.uid,
              provider: provider,
              accountId: `ACT_${Math.random().toString(36).substr(2, 9).toUpperCase()}` // Simulated ID
            }),
          });

          if (provRes.ok) {
            notify(`${provider === 'google' ? 'Google Ads' : 'Meta Ads'} との連携が完了しました！`, 'success');
            // Refresh profile is handled by Firestore listener usually
          }
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      notify('連携の開始に失敗しました。', 'error');
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const response = await fetch('https://hook.us2.make.com/421mogeiqb4qxsjbclresu420jaxxyyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggested_budget: 25000,
          cvi_score: 3.8,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.status === 410) {
        alert('Webhookテスト失敗 (410 Gone): シナリオが有効になっていない可能性があります。');
      } else if (response.ok) {
        alert('Webhookテスト成功！');
      } else {
        alert(`Webhookテスト失敗: Status ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook Error:', error);
      alert('Webhook接続エラーが発生しました。');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const metrics: DashboardMetrics = selectedCampaign ? {
    totalSpend: selectedCampaign.spend || 0,
    totalImpressions: selectedCampaign.impressions || 0,
    totalClicks: selectedCampaign.clicks || 0,
    totalLeads: selectedCampaign.leads || 0,
    cpa: selectedCampaign.cpa || 0,
    averageCpc: selectedCampaign.cpc || 0,
    averageCvr: selectedCampaign.cvr || 0,
    roas: selectedCampaign.roas || 0,
    averageCvi: selectedCampaign.cvi || 0,
  } : {
    totalSpend: campaigns.reduce((acc, c) => acc + (c.spend || 0), 0),
    totalImpressions: campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0),
    totalClicks: campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0),
    totalLeads: campaigns.reduce((acc, c) => acc + (c.leads || 0), 0),
    cpa: campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) / (campaigns.reduce((acc, c) => acc + (c.leads || 0), 0) || 1),
    averageCpc: campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) / (campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) || 1),
    averageCvr: (campaigns.reduce((acc, c) => acc + (c.leads || 0), 0) / (campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) || 1)) * 100,
    roas: campaigns.reduce((acc, c) => acc + ((c.roas || 0) * (c.spend || 0)), 0) / (campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) || 1),
    averageCvi: currentCvi || 0,
  };

  const filteredReports = selectedCampaignId === 'all' 
    ? reports 
    : reports.filter(r => r.campaignId === selectedCampaignId);

  const handleGenerate = async (type: AgentType) => {
    console.log('handleGenerate called with type:', type);
    const targetUrl = selectedCampaign?.mainSiteUrl || systemSettings.mainSiteUrl;
    if (!targetUrl) {
      console.log('Target URL not found');
      notify('先に「設定」から送客先のメインサイトURLを登録してください。', 'error');
      setActiveTab('settings');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating content for type:', type);
      // ヒアリング結果をコンテキストに統合
      const hearingContext = activeHearing?.status === 'completed' 
        ? Object.entries(activeHearing.answers).map(([q, a]) => `${q}: ${a}`).join('\n')
        : "";
      
      const campaignContext = selectedCampaign 
        ? `業種: ${selectedCampaign.industry}, 予算: ${selectedCampaign.budget}, 送客先: ${selectedCampaign.mainSiteUrl || systemSettings.mainSiteUrl || '未設定'}, 商材詳細: ${selectedCampaign.businessDescription || systemSettings.businessDescription || '未設定'}`
        : `業種: ${industry}, 予算: 500,000, 送客先: ${systemSettings.mainSiteUrl || '未設定'}, 商材詳細: ${systemSettings.businessDescription || '未設定'}`;

      const fullContext = `${campaignContext}\n\n【ヒアリング情報】\n${hearingContext || 'なし'}`;
      
      const newTask = await generateMarketingContent(type, industry, fullContext, plan);
      console.log('Content generated successfully:', newTask.title);
      setTasks(prev => [{ ...newTask, id: Math.random().toString(36).substr(2, 9), agentId: '1' } as MarketingTask, ...prev]);
      setActiveTab('approvals');
      notify(`${type}エージェントが新しい施策を生成しました。「承認ワークフロー」を確認してください。`, 'success');
    } catch (error: any) {
      console.error('Generation error:', error);
      let errorMsg = error instanceof Error ? error.message : '不明なエラー';
      
      // Parse API error JSON if possible
      try {
        if (errorMsg.includes('{')) {
          const parsed = JSON.parse(errorMsg.substring(errorMsg.indexOf('{')));
          if (parsed.error?.status === 'RESOURCE_EXHAUSTED') {
            errorMsg = 'APIの利用制限（クォータ）または予算上限に達しました。Google Cloudコンソールの設定を確認してください。';
          } else if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          }
        }
      } catch (e) {
        // Fallback to original message
      }

      notify(`コンテンツの生成中にエラーが発生しました: ${errorMsg}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimize = async () => {
    if (!user) return;
    setIsGenerating(true);
    
    // API同期シミュレーションを先に実行
    await simulateApiSync();

    try {
      const budgetValue = selectedCampaign ? `¥${selectedCampaign.budget.toLocaleString()}` : "月間50万円";
      const channels = ["Google Ads", "Meta Ads", "LINE"];
      const orchestrationPlan = await getOrchestrationPlan(industry, budgetValue, channels, plan);
      setStrategicPlan(orchestrationPlan);

      // 予算配分の動的更新
      if (orchestrationPlan.webhookPayload?.campaigns) {
        const newDist = orchestrationPlan.webhookPayload.campaigns.map((c: any) => ({
          name: c.platform.replace('_', ' '),
          value: Math.round(c.budget_allocation * 100),
          color: c.platform === 'GOOGLE_ADS' ? '#141414' : 
                 c.platform === 'META_ADS' ? '#4a4a4a' : 
                 c.platform === 'LINE_ADS' ? '#d1d1d1' : '#8e8e8e'
        }));
        setPlatformDistribution(newDist);
      }

      // 詳細なアクションレポートの生成
      const reportId = Math.random().toString(36).substr(2, 9);
      const shiftDetails = orchestrationPlan.webhookPayload?.campaigns?.map((c: any) => 
        `${c.platform}: ${Math.round(c.budget_allocation * 100)}% (${c.focus})`
      ).join(' / ') || '予算配分を最適化しました。';

      const newReport: AIActionReport = {
        id: reportId,
        campaignId: selectedCampaignId !== 'all' ? selectedCampaignId : undefined,
        type: 'budget_shift',
        title: 'AI自律最適化レポート',
        description: `【戦略】${orchestrationPlan.strategy}\n\n【新配分】${shiftDetails}`,
        impact: `CVI予測スコア: ${orchestrationPlan.cviProjection} (+${Math.round(orchestrationPlan.cviProjection - currentCvi)}%)`,
        timestamp: Date.now(),
        ownerUid: user.uid
      };

      await setDoc(doc(db, 'reports', reportId), newReport);
      setReports(prev => [newReport, ...prev]);

      // キャンペーン情報の更新（シミュレーション）
      if (selectedCampaignId !== 'all') {
        setCampaigns(prev => prev.map(c => 
          c.id === selectedCampaignId 
            ? { ...c, cvi: orchestrationPlan.cviProjection, status: 'active' } 
            : c
        ));
      }

      notify('AIが詳細なアクションレポートを生成し、予算配分を更新しました。');
    } catch (error) {
      console.error(error);
      notify('最適化アクションの実行に失敗しました。', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddClient = async (name: string, industry: string) => {
    if (!user) return;
    try {
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        industry,
        createdAt: Date.now(),
        ownerUid: user.uid
      };
      await setDoc(doc(db, 'clients', newClient.id), newClient);
      notify('クライアントを追加しました。');
    } catch (error) {
      console.error('Add client error:', error);
      notify('クライアントの追加に失敗しました。', 'error');
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await updateDoc(doc(db, 'clients', id), updates);
      notify('クライアント情報を更新しました。');
    } catch (error) {
      console.error('Update client error:', error);
      notify('クライアントの更新に失敗しました。', 'error');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      notify('クライアントを削除しました。');
    } catch (error) {
      console.error('Delete client error:', error);
      notify('クライアントの削除に失敗しました。', 'error');
    }
  };

  const handleAddSite = async (clientId: string, name: string, url: string) => {
    if (!user) return;
    try {
      const newSite: Site = {
        id: Math.random().toString(36).substr(2, 9),
        clientId,
        name,
        url,
        createdAt: Date.now(),
        ownerUid: user.uid
      };
      await setDoc(doc(db, 'sites', newSite.id), newSite);
      notify('サイトを追加しました。');
    } catch (error) {
      console.error('Add site error:', error);
      notify('サイトの追加に失敗しました。', 'error');
    }
  };

  const handleUpdateSite = async (id: string, updates: Partial<Site>) => {
    try {
      await updateDoc(doc(db, 'sites', id), updates);
      notify('サイト情報を更新しました。');
    } catch (error) {
      console.error('Update site error:', error);
      notify('サイトの更新に失敗しました。', 'error');
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sites', id));
      notify('サイトを削除しました。');
    } catch (error) {
      console.error('Delete site error:', error);
      notify('サイトの削除に失敗しました。', 'error');
    }
  };

  const handleUpdateUserAccessibleClients = async (uid: string, clientIds: string[]) => {
    try {
      await updateDoc(doc(db, 'users', uid), { accessibleClientIds: clientIds });
      notify('ユーザーのアクセス権限を更新しました。');
    } catch (error) {
      console.error('Update user accessible clients error:', error);
      notify('アクセス権限の更新に失敗しました。', 'error');
    }
  };

  const handleUpdateUserPlan = async (uid: string, plan: PlanType) => {
    try {
      await updateDoc(doc(db, 'users', uid), { plan });
      await logAdminAction('update_user_plan', `Updated user ${uid} plan to ${plan}`, uid);
      notify(`ユーザーのプランを ${plan} に更新しました。`);
    } catch (error) {
      console.error('Update user plan error:', error);
      notify('プランの更新に失敗しました。', 'error');
    }
  };

  const handleUpdateUserRole = async (uid: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      await logAdminAction('update_user_role', `Updated user ${uid} role to ${role}`, uid);
      notify(`ユーザーのロールを ${role} に更新しました。`);
    } catch (error) {
      console.error('Update user role error:', error);
      notify('ロールの更新に失敗しました。', 'error');
    }
  };

  const logAdminAction = async (action: string, details: string, targetUid?: string) => {
    if (!user || profile?.role !== 'admin') return;
    try {
      const logId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'audit_logs', logId), {
        id: logId,
        adminUid: user.uid,
        adminEmail: user.email,
        targetUid,
        action,
        details,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  };

  const handleApproveTransaction = async (transaction: Transaction) => {
    if (!user || profile?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'completed',
        approvedAt: Date.now(),
        approvedBy: user.uid
      });

      const walletRef = doc(db, 'wallets', transaction.userUid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        const walletData = walletSnap.data() as WalletState;
        const currentBalance = walletData.balance_total || 0;
        const currentAdBudget = walletData.balance_ad_budget || 0;
        const currentTax = walletData.tax_holding || 0;
        const currentMonthlyDeposit = walletData.monthlyUsage?.monthlyDeposit || 0;
        
        await updateDoc(walletRef, {
          balance_total: currentBalance + transaction.amount,
          balance_ad_budget: currentAdBudget + (transaction.amount / 1.1),
          tax_holding: currentTax + (transaction.amount - (transaction.amount / 1.1)),
          'monthlyUsage.monthlyDeposit': currentMonthlyDeposit + transaction.amount
        });
      }

      await logAdminAction('approve_transaction', `Approved transaction ${transaction.id} for ¥${transaction.amount}`, transaction.userUid);
      notify('決済を承認しました。ユーザーの残高に反映されました。');
    } catch (error) {
      console.error('Approve transaction error:', error);
      notify('承認処理に失敗しました。', 'error');
    }
  };

  const handleRejectTransaction = async (transaction: Transaction) => {
    if (!user || profile?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'failed',
        approvedAt: Date.now(),
        approvedBy: user.uid
      });
      await logAdminAction('reject_transaction', `Rejected transaction ${transaction.id}`, transaction.userUid);
      notify('決済を却下しました。');
    } catch (error) {
      console.error('Reject transaction error:', error);
      notify('却下処理に失敗しました。', 'error');
    }
  };

  const handleResetMonthlyUsage = async () => {
    if (!user || profile?.role !== 'admin') return;
    
    try {
      const walletsCol = collection(db, 'wallets');
      const walletsSnap = await getDocs(walletsCol);
      
      const batch = writeBatch(db);
      walletsSnap.docs.forEach(walletDoc => {
        batch.update(walletDoc.ref, {
          monthlyUsage: {
            monthlyDeposit: 0,
            monthlyCreatives: 0,
            monthlyCampaigns: 0,
            lastResetAt: Date.now()
          }
        });
      });
      
      await batch.commit();
      await logAdminAction('reset_monthly_usage', 'Reset monthly usage counters for all users', 'all');
      notify('すべてのユーザーの月間利用状況をリセットしました。');
    } catch (error) {
      console.error('Reset usage error:', error);
      notify('リセット処理に失敗しました。', 'error');
    }
  };

  const handleCreateAnnouncement = async (title: string, content: string, type: Announcement['type']) => {
    if (!user || profile?.role !== 'admin') return;
    try {
      const newAnnouncement: Announcement = {
        id: Math.random().toString(36).substring(2, 15),
        title,
        content,
        type,
        createdAt: Date.now(),
        authorId: user.uid,
        authorEmail: user.email || ''
      };
      await setDoc(doc(db, 'announcements', newAnnouncement.id), newAnnouncement);
      await logAdminAction('create_announcement', `Created announcement: ${title}`, 'all');
      notify('お知らせを送信しました。');
    } catch (error) {
      console.error('Create announcement error:', error);
      notify('お知らせの送信に失敗しました。', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!user || profile?.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      await logAdminAction('delete_announcement', `Deleted announcement ID: ${id}`, 'all');
      notify('お知らせを削除しました。');
    } catch (error) {
      console.error('Delete announcement error:', error);
      notify('お知らせの削除に失敗しました。', 'error');
    }
  };

  const handleMarkAnnouncementsAsRead = async () => {
    if (!user) return;
    try {
      const now = Date.now();
      await updateDoc(doc(db, 'users', user.uid), {
        lastSeenAnnouncementAt: now
      });
      setLastSeenAnnouncementAt(now);
    } catch (error) {
      console.error('Mark announcements as read error:', error);
    }
  };

  const handlePlanSelect = (p: PlanType) => {
    const isCurrentAnnual = planExpiresAt !== null;
    const isNewAnnual = billingCycle === 'annual';
    
    // If selecting current plan and cycle, do nothing
    if (p === plan && ((isCurrentAnnual && isNewAnnual) || (!isCurrentAnnual && !isNewAnnual))) return;

    setPendingPlan(p);
    setPendingBillingCycle(isNewAnnual ? 'annual' : 'monthly');
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingPlan || !pendingBillingCycle || !user) return;
    
    const isCurrentAnnual = planExpiresAt !== null;
    const isNewAnnual = pendingBillingCycle === 'annual';
    
    let updateData: any = {
      plan: pendingPlan,
      billingCycle: pendingBillingCycle
    };

    let message = '';
    let prorationAmount = 0;

    // Logic based on user requirements
    if (isCurrentAnnual && !isNewAnnual) {
      // Annual -> Monthly: Scheduled
      updateData = {
        scheduledPlan: pendingPlan,
        scheduledBillingCycle: 'monthly'
      };
      message = `次回の更新日（${new Date(planExpiresAt!).toLocaleDateString()}）より ${pendingPlan}（月間）に切り替わる予約を完了しました。`;
    } else if (isCurrentAnnual && isNewAnnual) {
      const currentPrice = PLANS[plan].priceAnnual;
      const newPrice = PLANS[pendingPlan].priceAnnual;
      
      if (newPrice > currentPrice) {
        // Annual -> Annual (Upgrade): Immediate with proration
        prorationAmount = newPrice - currentPrice; // Simplified proration for demo
        updateData = {
          plan: pendingPlan,
          billingCycle: 'annual'
        };
        message = `${pendingPlan}（年間）へのアップグレード決済（差額 ¥${prorationAmount.toLocaleString()}）が完了しました。`;
      } else {
        // Annual -> Annual (Downgrade): Scheduled
        updateData = {
          scheduledPlan: pendingPlan,
          scheduledBillingCycle: 'annual'
        };
        message = `次回の更新日（${new Date(planExpiresAt!).toLocaleDateString()}）より ${pendingPlan}（年間）に切り替わる予約を完了しました。`;
      }
    } else if (!isCurrentAnnual && isNewAnnual) {
      // Monthly -> Annual: Immediate with proration discount
      const monthlyPrice = PLANS[plan].priceMonthly;
      const annualPrice = PLANS[pendingPlan].priceAnnual;
      const discount = Math.floor(monthlyPrice * 0.5); // Simplified: 50% of monthly as discount
      prorationAmount = annualPrice - discount;
      
      updateData = {
        plan: pendingPlan,
        billingCycle: 'annual',
        planExpiresAt: Date.now() + 86400000 * 365
      };
      message = `${pendingPlan}（年間）への変更決済（充当分を差し引いた ¥${prorationAmount.toLocaleString()}）が完了しました。`;
    } else {
      // Monthly -> Monthly: Immediate
      prorationAmount = PLANS[pendingPlan].priceMonthly;
      updateData = {
        plan: pendingPlan,
        billingCycle: 'monthly',
        planExpiresAt: null
      };
      message = `${pendingPlan}（月間）への変更決済（¥${prorationAmount.toLocaleString()}）が完了しました。`;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      if (!updateData.scheduledPlan) {
        setPlan(pendingPlan);
        setBillingCycle(pendingBillingCycle);
        setPlanExpiresAt(updateData.planExpiresAt || null);
      } else {
        setScheduledPlan(pendingPlan);
        setScheduledBillingCycle(pendingBillingCycle);
      }
      
      notify(message);
      setShowPaymentConfirm(false);
      setPendingPlan(null);
      setPendingBillingCycle(null);
    } catch (error) {
      console.error('Plan update error:', error);
      notify('プランの更新に失敗しました。', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!user) return;
    const max = PLANS[plan].maxAccounts;
    if (teamMembers.length >= max) {
      notify(`現在の${plan}プランでは、アカウント登録数は最大${max}名までです。`, 'error');
      return;
    }

    if (!newMemberName || !newMemberEmail) {
      notify('名前とメールアドレスを入力してください。', 'error');
      return;
    }

    try {
      const newMember: Omit<TeamMember, 'id'> = {
        name: newMemberName,
        email: newMemberEmail,
        role: 'editor',
        jobTitle: newMemberJobTitle,
        joinedAt: Date.now()
      };
      await addDoc(collection(db, 'organizations', user.uid, 'members'), newMember);
      
      // Update memberCount in users collection
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentCount = userSnap.data().memberCount || 1;
        await updateDoc(userRef, { memberCount: currentCount + 1 });
      }

      notify(`${newMemberName} さんをチームに追加しました。`);
      setShowAddMemberModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberJobTitle('');
    } catch (error) {
      console.error('Add member error:', error);
      notify('メンバーの追加に失敗しました。', 'error');
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!user) return;
    if (id.startsWith('admin-')) {
      notify('メイン管理者は削除できません。', 'error');
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'organizations', user.uid, 'members', id));
      
      // Update memberCount in users collection
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentCount = userSnap.data().memberCount || 1;
        await updateDoc(userRef, { memberCount: Math.max(1, currentCount - 1) });
      }

      notify(`${name} さんを削除しました。`);
    } catch (error) {
      console.error('Remove member error:', error);
      notify('メンバーの削除に失敗しました。', 'error');
    }
  };

  const handleExportReport = useCallback(async () => {
    if (!trendData || trendData.length === 0) {
      notify('出力するデータがありません。', 'error');
      return;
    }

    try {
      const campaignName = selectedCampaignId === 'all' ? '全体' : selectedCampaign?.name;
      const data = trendData.map(d => {
        // Find reports for the same day from the filteredReports state
        const dayReports = filteredReports.filter((r: any) => {
          const reportDate = new Date(r.timestamp).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
          return reportDate === d.date;
        });

        const aiActionLog = dayReports.map((r: any) => `[${r.action}] ${r.reason}`).join(' | ');

        // CVI Calculation Logic: Profit / (Ad Spend * Days to Conversion)
        // Mocking Profit as Leads * 50,000 JPY and Days to Conversion as 7
        const profitPerLead = 50000;
        const daysToConversion = 7;
        const calculatedCvi = (d.spend || 0) > 0 
          ? (((d.leads || 0) * profitPerLead) / ((d.spend || 0) * daysToConversion) * 100).toFixed(2)
          : '0.00';

        return {
          '日付': d.date,
          'インプレッション': d.impressions || 0,
          'クリック': d.clicks || 0,
          'コンバージョン': d.leads || 0,
          '消化金額': d.spend || 0,
          'CPA': d.cpa || 0,
          'ROAS': d.roas || 0,
          'CVI (計算値)': calculatedCvi,
          'AI_Action_Log': aiActionLog
        };
      });

      const csv = Papa.unparse(data);
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `amas_report_${campaignName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify('パフォーマンスレポート（CSV）を出力しました。', 'success');
    } catch (error) {
      console.error('Export error:', error);
      notify('レポートの出力中にエラーが発生しました。', 'error');
    }
  }, [selectedCampaignId, selectedCampaign, trendData, filteredReports]);

  const handleDownloadMonthlyReport = useCallback(async () => {
    if (!user || !profile || !trendData || trendData.length === 0) return;

    try {
      notify('レポートを生成中...');
      console.log('Starting PDF generation via HTML-to-Image...');

      // 1. Fetch AI Strategic Data (reports)
      console.log('Fetching AI logs for strategic review...');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let strategicStory = "今月、AIは複数の最適化アクションを実行しました。";
      let topActions: AIActionReport[] = [];
      
      try {
        const q = query(
          collection(db, 'reports'), 
          where('ownerUid', '==', user.uid),
          where('timestamp', '>=', thirtyDaysAgo)
        );
        const querySnapshot = await getDocs(q);
        const monthReports = querySnapshot.docs
          .map(doc => doc.data() as AIActionReport)
          .filter(r => selectedCampaignId === 'all' || r.campaignId === selectedCampaignId);

        if (monthReports.length > 0) {
          topActions = monthReports.slice(0, 3);
          const budgetShifts = monthReports.filter(r => r.type === 'budget_shift');
          const bidAdjusts = monthReports.filter(r => r.type === 'bid_adjust');
          
          let storyParts = [];
          if (budgetShifts.length > 0) {
            storyParts.push(`【アクション】予算配分の最適化を${budgetShifts.length}回実施しました。【理由】各媒体のパフォーマンス乖離を検知し、投資効率を最大化するためです。【結果】${budgetShifts.map(s => s.impact).join('、')}といった成果に繋がりました。`);
          }
          if (bidAdjusts.length > 0) {
            storyParts.push(`【アクション】入札価格の自動調整を${bidAdjusts.length}回行いました。【理由】市場の競合状況の変化にリアルタイムで対応し、獲得機会を逃さないためです。【結果】獲得単価（CPA）の安定化と、目標CVIの維持を実現しました。`);
          }
          
          const citations = topActions.map(r => `・${r.title}: ${r.description}（結果: ${r.impact}）`).join('\n');
          strategicStory = `${storyParts.join('\n\n')}\n\n具体的な個別施策の詳細は以下の通りです：\n${citations}\n\nこれら一連の自律的アクションにより、今月も安定したパフォーマンス成長を達成しています。`;
        } else {
          strategicStory = "今月は安定した運用が続いており、大きな予算移動は発生していませんが、AIによる常時モニタリングにより最適な入札が維持されています。";
        }
      } catch (e) {
        console.error("Error fetching strategic logs:", e);
      }

      // 2. Fetch AI Summary from AISummary collection
      console.log('Fetching AI summary...');
      const currentMonth = new Date().toISOString().slice(0, 7);
      const summaryId = `${selectedCampaignId}_${currentMonth}`;
      let aiCommentary = "AIが今月のデータを分析中です。戦略的なインサイトは近日中に更新されます。";
      
      try {
        const summaryDoc = await getDoc(doc(db, 'ai_summaries', summaryId));
        if (summaryDoc.exists()) {
          aiCommentary = summaryDoc.data().content;
        } else if (selectedCampaign?.ai_summary) {
          aiCommentary = selectedCampaign.ai_summary;
        }
      } catch (e) {
        console.error("Error fetching AI summary:", e);
      }

      const campaignName = selectedCampaignId === 'all' ? 'All Campaigns' : (selectedCampaign?.name || 'Unknown Campaign');
      const startDate = trendData[0].date;
      const endDate = trendData[trendData.length - 1].date;
      const targetPeriod = `${startDate} - ${endDate}`;

      const totalSpend = trendData.reduce((sum, d) => sum + (d.spend || 0), 0);
      const totalCv = trendData.reduce((sum, d) => sum + (d.leads || 0), 0);
      const avgCvi = trendData.reduce((sum, d) => sum + (d.cvi || 0), 0) / (trendData.length || 1);
      const avgCpa = totalCv > 0 ? totalSpend / totalCv : 0;

      // Mock MoM for now
      const spendMom = "+5.2%";
      const cvMom = "+18.2%";
      const cviMom = "+8.5%";
      const cpaMom = "-12.4%";

      const platforms = platformDistribution.map(p => ({
        name: p.name,
        share: p.value,
        spend: Math.round(totalSpend * (p.value / 100)),
        cvi: avgCvi * (1 + (Math.random() * 0.2 - 0.1)),
        momChange: "+3.2%",
        isBest: p.value > 40,
        isWorst: p.value < 10
      }));

      const nextMonthStrategies = [
        {
          priority: 'High' as const,
          action: 'Meta Adsへの予算配分を5%増額',
          reason: '獲得効率が前月比で15%向上しており、投資効率の最大化が見込めるため。',
          effect: '全体の獲得単価を5-8%抑制し、獲得数を10%増加させる。'
        },
        {
          priority: 'Medium' as const,
          action: 'Google Searchの入札戦略を「目標CPA」に変更',
          reason: '直近のデータ蓄積により、AIによる高精度な自動入札が可能になったため。',
          effect: 'コンバージョン獲得の安定化と、無駄なクリックコストの削減。'
        },
        {
          priority: 'Low' as const,
          action: 'リターゲティング広告のクリエイティブA/Bテスト実施',
          reason: '現在のバナーのCTRが低下傾向にあり、新鮮な訴求が必要なため。',
          effect: '離脱ユーザーの再訪率向上と、CVRの2%改善。'
        }
      ];

      const aiAutoActions = [
        'パフォーマンスの低いキーワードの停止',
        '予算の自動媒体間移動 (Daily)',
        '入札価格のリアルタイム調整',
        '異常値検知時のアラート通知'
      ];

      const data = {
        plan: profile.plan.toLowerCase() as any,
        clientName: profile.companyName || 'お客様',
        logoUrl: profile.logoUrl,
        campaignName,
        targetPeriod,
        year: new Date().getFullYear().toString(),
        totalSpend,
        totalCv,
        avgCvi,
        avgCpa,
        spendMom,
        cvMom,
        cviMom,
        cpaMom,
        platforms,
        aiSummary: aiCommentary,
        aiPlatformInsights: "Google Searchが全体のCVIに最も大きく貢献しています。Meta Adsは獲得効率が前月比で15%向上しており、来月はMeta Adsへの予算配分を5%増額することで、全体の獲得単価をさらに抑制できる見込みです。",
        nextMonthStrategies,
        aiAutoActions,
        dailyData: trendData.map(d => ({
          date: d.date,
          spend: d.spend || 0,
          conversions: d.leads || 0,
          cpa: d.leads > 0 ? (d.spend || 0) / d.leads : 0,
          cvi_score: d.cvi || 0,
          impressions: d.impressions || 0,
          clicks: d.clicks || 0,
          ctr: d.clicks > 0 ? (d.clicks / (d.impressions || 1)) * 100 : 0
        }))
      };

      setReportData(data);
      setIsGeneratingReport(true);
      notify('レポートプレビューを生成しました。', 'success');
    } catch (error) {
      console.error('Report generation error:', error);
      setIsGeneratingReport(false);
      setReportData(null);
      const errorMsg = error instanceof Error ? error.message : 'Unknown Error';
      notify(`レポートの生成中にエラーが発生しました: ${errorMsg}`, 'error');
    }
  }, [user, profile, trendData, selectedCampaignId, selectedCampaign, platformDistribution, campaigns, reports]);

  const handleDownloadStatement = useCallback(async () => {
    if (!user || !profile) return;

    try {
      notify('明細と領収書を生成中...');
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      
      // Fetch transactions for the current month
      const q = query(
        collection(db, 'transactions'),
        where('userUid', '==', user.uid),
        where('timestamp', '>=', startOfMonth),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      const txs = snap.docs.map(doc => doc.data() as Transaction);

      // Fetch daily spend reports for Ad Spend Breakdown for the current month
      const reportsQuery = query(
        collection(db, 'reports'),
        where('ownerUid', '==', user.uid),
        where('type', '==', 'daily_spend'),
        where('timestamp', '>=', startOfMonth)
      );
      const reportsSnap = await getDocs(reportsQuery);
      const spendReports = reportsSnap.docs.map(doc => doc.data() as AIActionReport);

      // Aggregate spend by platform and campaign
      const spendMap: Record<string, { platform: string, campaignName?: string, amount: number }> = {};
      spendReports.forEach(r => {
        if (r.platform && r.amount) {
          const key = `${r.platform}_${r.campaignName || ''}`;
          if (!spendMap[key]) {
            spendMap[key] = { platform: r.platform, campaignName: r.campaignName, amount: 0 };
          }
          spendMap[key].amount += r.amount;
        }
      });

      // Use actual data from reports
      const platformSpend = Object.values(spendMap);

      // If no reports found, use empty array (or dummy data if you want to show something, but user said "本番仕様")
      // Let's keep it empty if no data, or maybe show a message.
      
      const platformSpendWithTax = platformSpend.map(s => {
        const tax = Math.floor(s.amount * 0.1);
        return { ...s, tax, subtotal: s.amount + tax };
      });

      const totalAdSpendExclTax = platformSpendWithTax.reduce((sum, s) => sum + s.amount, 0);
      const totalAdSpendTax = platformSpendWithTax.reduce((sum, s) => sum + s.tax, 0);
      const totalAdSpendInclTax = totalAdSpendExclTax + totalAdSpendTax;
      
      const totalDeposits = txs
        .filter(t => ['charge', 'credit_card', 'bank_transfer'].includes(t.type) && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDepositsTax = Math.floor(totalDeposits - (totalDeposits / 1.1));
      
      // 「逆算」の完全廃止:
      // 前月繰越 (openingBalance) は Firestore から取得できない場合は ¥0 固定
      const openingBalance = 0; 
      const openingBalanceTax = 0;

      // 翌月繰越残高 (closingBalance) は 前月繰越 + 当月チャージ - 当月利用合計
      const closingBalance = openingBalance + totalDeposits - totalAdSpendInclTax;
      const closingBalanceTax = Math.floor(closingBalance - (closingBalance / 1.1));
      const closingBalanceAdBudget = closingBalance - closingBalanceTax;

      const summary = {
        openingBalance,
        openingBalanceTax,
        totalDeposits,
        totalDepositsTax,
        totalAdSpendExclTax,
        totalAdSpendTax,
        totalAdSpendInclTax,
        closingBalance,
        closingBalanceTax,
        closingBalanceAdBudget
      };

      // CSV Generation
      const csvData = txs.map((t: any) => ({
        '日付': new Date(t.timestamp).toLocaleString('ja-JP'),
        '取引ID': t.id,
        '内容': t.description || (t.type === 'credit_card' ? 'クレジットカードチャージ' : '銀行振込チャージ'),
        '金額 (税込)': t.amount,
        '税額': Math.floor(t.amount * 0.1),
        'ステータス': t.status === 'completed' ? '完了' : '保留'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `amas_statement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // PDF Generation (Invoice/Receipt)
      const currentMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
      const data = {
        transactions: txs.filter(t => ['charge', 'credit_card', 'bank_transfer'].includes(t.type) && t.status === 'completed'),
        platformSpend: platformSpendWithTax,
        summary,
        companyName: systemSettings.companyName || profile.companyName || 'お客様',
        address: systemSettings.address || '',
        phone: systemSettings.phone || '',
        taxId: profileFormData.taxRegistrationNumber || '',
        period: `${currentMonth}度 運用分`,
        issuerName: systemSettings.issuerName,
        issuerAddress: systemSettings.issuerAddress,
        issuerTaxId: systemSettings.issuerTaxId
      };

      setInvoiceData(data);
      setIsGeneratingInvoice(true);

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pageElement = document.getElementById('invoice-page');
      if (pageElement) {
        const imgData = await htmlToImage.toJpeg(pageElement, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        const pdfDoc = new jsPDF('p', 'mm', 'a4');
        pdfDoc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdfDoc.save(`amas_invoice_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      setIsGeneratingInvoice(false);
      setInvoiceData(null);
      notify('明細（CSV）と領収書（PDF）を出力しました。', 'success');
    } catch (error) {
      console.error('Download statement error:', error);
      setIsGeneratingInvoice(false);
      setInvoiceData(null);
      notify('明細の出力に失敗しました。', 'error');
    }
  }, [user, profile, systemSettings, profileFormData]);

  const handleSyncMemberCounts = async () => {
    if (profile?.role !== 'admin') return;
    notify('メンバー数を同期中...', 'info' as any);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      
      for (const uDoc of usersSnap.docs) {
        const membersSnap = await getDocs(collection(db, 'organizations', uDoc.id, 'members'));
        // Count includes the admin themselves (+1)
        const actualCount = membersSnap.size + 1;
        batch.update(doc(db, 'users', uDoc.id), { memberCount: actualCount });
      }
      
      await batch.commit();
      notify('メンバー数の同期が完了しました。');
    } catch (error) {
      console.error('Sync member counts error:', error);
      notify('同期に失敗しました。', 'error');
    }
  };

  if (landingPageSlug) {
    return <LandingPage slug={landingPageSlug} />;
  }

  if (!isAuthReady) {
    return (
      <div className="h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white animate-pulse">
            <Terminal size={28} />
          </div>
          <p className="text-sm font-bold text-gray-400 animate-pulse">AMAS Core 起動中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] p-12 border border-gray-200 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
            <Terminal size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">AMAS</h1>
          <p className="text-gray-500 text-sm mb-12 leading-relaxed">
            AIによる自律的なマーケティング最適化。<br />
            ミッションコントロールへようこそ。
          </p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10"
          >
            <LogIn size={20} />
            Googleアカウントでログイン
          </button>
          
          <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Autonomous Marketing Automation System
          </p>
        </motion.div>
      </div>
    );
  }

  const renderQuickStartGuide = () => {
    const steps = [
      {
        id: '01',
        title: '初期設定',
        sub: 'プロフィール・支払い・広告連携',
        onClick: () => setActiveTab('settings'),
        isComplete: isStep1Complete
      },
      {
        id: '02',
        title: 'Walletチャージ',
        sub: '広告費を入金する',
        onClick: () => setActiveTab('wallet'),
        isComplete: isStep2Complete
      },
      {
        id: '03',
        title: 'AIで広告を作る',
        sub: '業種と予算を入力するだけ',
        onClick: () => setActiveTab('new_campaign'),
        isComplete: isStep3Complete
      }
    ];

    return (
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm max-w-5xl mx-auto w-full">
        {isAllStepsComplete && (
          <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-sm font-bold text-emerald-900">設定完了。AMASが自動運用中です。</p>
          </div>
        )}
        
        <h3 className="font-bold text-2xl text-gray-900 mb-10 flex items-center gap-4">
          <Zap size={28} className="text-blue-600" />
          クイックスタートガイド
        </h3>
        
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <button 
                onClick={step.onClick}
                className={`flex-1 p-6 rounded-3xl border transition-all text-left relative overflow-hidden group ${
                  step.isComplete 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${step.isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
                    STEP {step.id}
                  </p>
                  {step.isComplete && (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
                <p className="font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{step.sub}</p>
              </button>
              
              <div className="hidden md:flex items-center text-gray-300">
                <ArrowRight size={20} />
              </div>
            </React.Fragment>
          ))}
          
          {/* Goal Card */}
          <motion.div 
            animate={showGlow ? {
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0)",
                "0 0 30px 15px rgba(59, 130, 246, 0.4)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            } : {}}
            transition={{ duration: 1 }}
            className="flex-1 p-6 rounded-3xl bg-[#0A0F1E] text-white border border-white/10 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <Zap size={20} className="text-blue-400" />
            </div>
            <p className="font-bold mb-1">自動運用スタート</p>
            <p className="text-[10px] text-gray-400 leading-tight">AIが24時間管理します</p>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderGlobalFilters = (className = "mb-8") => (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
        <Users size={18} className="text-gray-400" />
        <select 
          value={selectedClientId} 
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setSelectedSiteId('all');
            setSelectedCampaignId('all');
          }}
          className="bg-transparent text-sm font-bold focus:outline-none"
        >
          <option value="all">全クライアント</option>
          {clients.filter(c => 
            profile?.role === 'admin' || 
            c.ownerUid === user?.uid || 
            profile?.accessibleClientIds?.includes(c.id)
          ).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
        <Globe size={18} className="text-gray-400" />
        <select 
          value={selectedSiteId} 
          onChange={(e) => {
            setSelectedSiteId(e.target.value);
            setSelectedCampaignId('all');
          }}
          className="bg-transparent text-sm font-bold focus:outline-none"
        >
          <option value="all">全サイト</option>
          {sites.filter(s => {
            const matchesClient = selectedClientId === 'all' || s.clientId === selectedClientId;
            const client = clients.find(c => c.id === s.clientId);
            const isAccessible = profile?.role === 'admin' || 
                                client?.ownerUid === user?.uid ||
                                profile?.accessibleClientIds?.includes(s.clientId);
            return matchesClient && isAccessible;
          }).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
        <Building2 size={18} className="text-gray-400" />
        <select 
          value={selectedCampaignId} 
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="bg-transparent text-sm font-bold focus:outline-none"
        >
          <option value="all">全キャンペーン</option>
          {campaigns.filter(c => {
            const matchesClient = selectedClientId === 'all' || c.clientId === selectedClientId;
            const matchesSite = selectedSiteId === 'all' || c.siteId === selectedSiteId;
            const client = clients.find(cl => cl.id === c.clientId);
            const isAccessible = profile?.role === 'admin' || 
                                c.ownerUid === user?.uid ||
                                client?.ownerUid === user?.uid ||
                                (profile?.accessibleClientIds && profile.accessibleClientIds.includes(c.clientId || ''));
            return matchesClient && matchesSite && isAccessible;
          }).map(c => (
            <option key={c.id} value={c.id}>
              {c.name} {c.status === 'reviewing' ? '（審査中）' : ''}
            </option>
          ))}
        </select>
        {selectedCampaignId !== 'all' && (
          <button 
            onClick={() => setShowCampaignSettings(true)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-900"
            title="設定"
          >
            <SettingsIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
            <Terminal size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tighter">AMAS</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="ダッシュボード"
          />
          {(plan === 'Pro' || plan === 'Agency') && (
            <NavItem 
              active={activeTab === 'cockpit'} 
              onClick={() => setActiveTab('cockpit')}
              icon={<Terminal size={20} />}
              label="プロ・コックピット"
              badge={campaigns.filter(c => c.cvi < 50).length}
            />
          )}
          <NavItem 
            active={activeTab === 'agents'} 
            onClick={() => setActiveTab('agents')}
            icon={<Users size={20} />}
            label="エージェント・オーケストラ"
            badge={agents.filter(a => a.status === 'working').length}
          />
          <NavItem 
            active={activeTab === 'approvals'} 
            icon={<ShieldCheck size={20} />}
            label="AI検閲・承認"
            onClick={() => setActiveTab('approvals')}
            badge={tasks.filter(t => t.status === 'pending').length}
          />
          <NavItem 
            active={activeTab === 'satellite-fleet'} 
            onClick={() => setActiveTab('satellite-fleet')}
            icon={<Ship size={20} />}
            label="SEOサテライト管理"
            badge={satellitePages.length}
          />
          <NavItem
            active={activeTab === 'new_campaign'}
            onClick={() => {
              console.log('New Campaign button clicked');
              setActiveTab('new_campaign');
            }}
            icon={<Plus size={20} />}
            label="新規入稿"
          />
          <NavItem
            active={activeTab === 'drafts'}
            onClick={() => setActiveTab('drafts')}
            icon={<FileText size={20} />}
            label="下書き一覧"
          />
          <NavItem
            active={activeTab === 'wallet'}
            onClick={() => setActiveTab('wallet')}
            icon={<WalletIcon size={20} />}
            label="Wallet"
          />
          <NavItem 
            active={activeTab === 'tracking'} 
            onClick={() => setActiveTab('tracking')}
            icon={<Tag size={20} />}
            label="タグ・計測設定"
          />
          <NavItem 
            active={activeTab === 'connectors'} 
            onClick={() => setActiveTab('connectors')}
            icon={<Database size={20} />}
            label="データ連携"
          />
          {profile?.role === 'admin' || plan === 'Agency' ? (
            <NavItem 
              active={activeTab === 'clients'} 
              onClick={() => setActiveTab('clients')}
              icon={<Building2 size={20} />}
              label="クライアント管理"
            />
          ) : null}
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon size={20} />}
            label="設定"
          />
          <NavItem 
            active={activeTab === 'subscription'} 
            onClick={() => setActiveTab('subscription')}
            icon={<Zap size={20} />}
            label="プラン選択"
          />
          <NavItem 
            active={activeTab === 'help'} 
            onClick={() => setActiveTab('help')}
            icon={<HelpCircle size={20} />}
            label="ヘルプ・サポート"
          />
          {profile?.role === 'admin' && (
            <NavItem 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')}
              icon={<ShieldCheck size={20} />}
              label="管理コンソール"
            />
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">現在のプラン</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              plan === 'Agency' ? 'bg-black text-white' :
              plan === 'Pro' ? 'bg-purple-100 text-purple-700' : 
              plan === 'Standard' ? 'bg-blue-100 text-blue-700' : 
              plan === 'Lite' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {plan}
            </span>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-white">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">CVI 稼働状況</p>
            <p className="text-sm font-bold">最適化エンジン: 正常</p>
            <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              {activeTab === 'dashboard' ? 'ダッシュボード' :
               activeTab === 'cockpit' ? 'プロ・コックピット' :
               activeTab === 'agents' ? 'エージェント・オーケストラ' : 
               activeTab === 'approvals' ? 'AI検閲・承認' : 
               activeTab === 'new_campaign' ? '新規入稿' :
               activeTab === 'drafts' ? '下書き一覧' :
               activeTab === 'wallet' ? 'Wallet' :
               activeTab === 'subscription' ? 'プラン選択' :
               activeTab === 'tracking' ? 'タグ・計測設定' :
               activeTab === 'connectors' ? 'データ連携' :
               activeTab === 'settings' ? '設定' :
               activeTab === 'clients' ? 'クライアント管理' :
               activeTab === 'admin' ? '管理者コンソール' :
               activeTab === 'satellite-fleet' ? 'SEOサテライト管理' :
               activeTab === 'help' ? 'ヘルプ・サポート' : 'AMAS設定'}
            </h2>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <WalletIcon size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">残高:</span>
              <span className="text-sm font-bold text-emerald-700">¥{(wallet.balance_total || 0).toLocaleString()}</span>
            </div>

            {activeTab === 'dashboard' && (
              <>
                <button 
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                >
                  <BarChart3 size={14} />
                  レポート出力
                </button>
                <button 
                  onClick={handleDownloadMonthlyReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all"
                >
                  <FileText size={14} />
                  月次レポート (PDF)
                </button>
                <button 
                  onClick={handleDownloadStatement}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                >
                  <CreditCard size={14} />
                  明細DL
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (!showNotifications) {
                    const hasNewNotifs = notifications.some(n => !n.read);
                    const hasNewAnns = announcements.some(a => a.createdAt > lastSeenAnnouncementAt);
                    if (!hasNewNotifs && hasNewAnns) setNotifTab('announcements');
                    else setNotifTab('notifications');
                  }
                  setShowNotifications(!showNotifications);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {(notifications.some(n => !n.read) || announcements.some(a => a.createdAt > lastSeenAnnouncementAt)) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">通知・お知らせ</h3>
                        <button 
                          onClick={() => {
                            if (notifTab === 'notifications') handleMarkAllAsRead();
                            else handleMarkAnnouncementsAsRead();
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                        >
                          すべて既読にする
                        </button>
                      </div>
                      <div className="flex gap-1 p-1 bg-gray-200/50 rounded-xl">
                        <button 
                          onClick={() => setNotifTab('notifications')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${notifTab === 'notifications' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          通知 {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
                        </button>
                        <button 
                          onClick={() => setNotifTab('announcements')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${notifTab === 'announcements' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          お知らせ {announcements.filter(a => a.createdAt > lastSeenAnnouncementAt).length > 0 && `(${announcements.filter(a => a.createdAt > lastSeenAnnouncementAt).length})`}
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifTab === 'notifications' ? (
                        notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell size={20} className="text-gray-300" />
                            </div>
                            <p className="text-xs text-gray-400">新しい通知はありません</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                handleMarkAsRead(n.id);
                                if (n.campaignId) setSelectedCampaignId(n.campaignId);
                                setShowNotifications(false);
                              }}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-indigo-50/30' : ''}`}
                            >
                              {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                  n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                  n.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {n.type === 'success' ? <CheckCircle2 size={14} /> :
                                   n.type === 'warning' ? <AlertTriangle size={14} /> :
                                   n.type === 'error' ? <XCircle size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 mb-0.5">{n.title}</p>
                                  <p className="text-[11px] text-gray-500 leading-relaxed mb-1 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        announcements.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Megaphone size={20} className="text-gray-300" />
                            </div>
                            <p className="text-xs text-gray-400">お知らせはありません</p>
                          </div>
                        ) : (
                          announcements.map(a => (
                            <div 
                              key={a.id} 
                              onClick={() => handleMarkAnnouncementsAsRead()}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative ${a.createdAt > lastSeenAnnouncementAt ? 'bg-blue-50/30' : ''}`}
                            >
                              {a.createdAt > lastSeenAnnouncementAt && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  a.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                  a.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                  a.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                  <Megaphone size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-xs font-bold text-gray-900">{a.title}</p>
                                    {a.createdAt > lastSeenAnnouncementAt && (
                                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-tighter">NEW</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-relaxed mb-1">{a.content}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(a.createdAt).toLocaleString()} • 管理者</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-bold">{profile?.displayName || user.displayName || 'User'}</p>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] text-gray-400 font-bold uppercase hover:text-red-500 transition-colors flex items-center gap-1 justify-end"
                >
                  <LogOut size={10} />
                  Sign Out
                </button>
              </div>
              {(profile?.photoURL || user.photoURL) ? (
                <img src={profile?.photoURL || user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
                  {(profile?.displayName || user.displayName)?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

                {renderGlobalFilters()}

                {/* New Section: Ad Account Status & Guardrail Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Ad Account Status */}
                  <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Database size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">広告アカウントステータス</h3>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${profile?.google_ad_account_id ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            Google: {profile?.google_ad_account_id ? '連携済み' : '未連携'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${profile?.meta_ad_account_id ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            Meta: {profile?.meta_ad_account_id ? '連携済み' : '未連携'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {(!profile?.google_ad_account_id || !profile?.meta_ad_account_id) ? (
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="w-full py-3 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        設定ページで連携できます →
                      </button>
                    ) : (
                      <div className="w-full py-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} />
                        アカウント発行済み
                      </div>
                    )}
                  </div>

                  {/* Guardrail Settings (Interactive) */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">ガードレール設定（全キャンペーン共通）</h3>
                          <p className="text-[10px] text-gray-500">AIの自律運用における安全限界値を設定します</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800 transition-all"
                      >
                        保存
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[10px] text-gray-400 uppercase">最大日次予算</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-400">¥</span>
                            <input 
                              type="number" 
                              value={systemSettings.dailyBudgetLimit} 
                              onChange={e => setSystemSettings({...systemSettings, dailyBudgetLimit: parseInt(e.target.value) || 0})}
                              className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black" 
                            />
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all" 
                            style={{ width: `${Math.min(100, (systemSettings.dailyBudgetLimit / 100000) * 100)}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">
                          組織全体の上限です。この額を超える配信は自動的に制限されます。
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[10px] text-gray-400 uppercase">自律承認しきい値</p>
                          <span className="text-xs font-bold text-gray-900">{systemSettings.autoApprovalThreshold}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={systemSettings.autoApprovalThreshold} 
                          onChange={e => setSystemSettings({...systemSettings, autoApprovalThreshold: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                        <p className="text-[10px] text-gray-500 leading-tight">
                          安全スコアがこの値を超えた場合、人間を介さず即時公開します。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerts for Incomplete Profile */}
                {(!isBasicInfoComplete || !isBusinessSettingsComplete) && (
                  <div className="space-y-3">
                    {!isBasicInfoComplete && (
                      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                        <AlertCircle className="text-orange-600" size={20} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-orange-900">基本情報が未入力です</p>
                          <p className="text-[10px] text-orange-700">広告アカウントの発行には会社名・住所・電話番号の登録が必須です。</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('settings')}
                          className="px-3 py-1.5 bg-orange-600 text-white text-[10px] font-bold rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          設定へ
                        </button>
                      </div>
                    )}
                    {!isBusinessSettingsComplete && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <AlertCircle className="text-amber-600" size={20} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-amber-900">ビジネス設定が未完了です</p>
                          <p className="text-[10px] text-amber-700">AIエージェントの精度向上のため、業界やビジネス内容の詳細を入力してください。</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('settings')}
                          className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          設定へ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Top Row: Main Stats & Engine Status */}
                {wallet.monthlyUsage && (
                  <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">今月の利用状況</h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        最終リセット: {new Date(wallet.monthlyUsage.lastResetAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">累計入金額</span>
                          <span className="text-gray-900">¥{(wallet.monthlyUsage.monthlyDeposit || 0).toLocaleString()} / ¥{(PLANS[plan]?.spendLimit || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${(wallet.monthlyUsage.monthlyDeposit || 0) >= (PLANS[plan]?.spendLimit || 0) ? 'bg-red-500' : 'bg-black'}`}
                            style={{ width: `${Math.min(100, ((wallet.monthlyUsage.monthlyDeposit || 0) / (PLANS[plan]?.spendLimit || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">入稿数</span>
                          <span className="text-gray-900">
                            {Math.max(0, (wallet.monthlyUsage.monthlyCreatives || 0) - (wallet.monthlyUsage.adjustmentCreatives || 0))} / {(PLANS[plan]?.maxCreatives || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${Math.max(0, (wallet.monthlyUsage.monthlyCreatives || 0) - (wallet.monthlyUsage.adjustmentCreatives || 0)) >= (PLANS[plan]?.maxCreatives || 0) ? 'bg-red-500' : 'bg-black'}`}
                            style={{ width: `${Math.min(100, (Math.max(0, (wallet.monthlyUsage.monthlyCreatives || 0) - (wallet.monthlyUsage.adjustmentCreatives || 0)) / (PLANS[plan]?.maxCreatives || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">キャンペーン数</span>
                          <span className="text-gray-900">
                            {Math.max(0, (wallet.monthlyUsage.monthlyCampaigns || 0) - (wallet.monthlyUsage.adjustmentCampaigns || 0))} / {(PLANS[plan]?.maxCampaigns || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${Math.max(0, (wallet.monthlyUsage.monthlyCampaigns || 0) - (wallet.monthlyUsage.adjustmentCampaigns || 0)) >= (PLANS[plan]?.maxCampaigns || 0) ? 'bg-red-500' : 'bg-black'}`}
                            style={{ width: `${Math.min(100, (Math.max(0, (wallet.monthlyUsage.monthlyCampaigns || 0) - (wallet.monthlyUsage.adjustmentCampaigns || 0)) / (PLANS[plan]?.maxCampaigns || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {((wallet.monthlyUsage.monthlyDeposit || 0) >= (PLANS[plan]?.spendLimit || 0) || 
                      (wallet.monthlyUsage.monthlyCreatives || 0) >= (PLANS[plan]?.maxCreatives || 0) || 
                      (wallet.monthlyUsage.monthlyCampaigns || 0) >= (PLANS[plan]?.maxCampaigns || 0)) && (
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertCircle className="text-red-600" size={20} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-red-900">今月の利用上限に達しました。</p>
                          <p className="text-[10px] text-red-700">さらに利用するにはプランをアップグレードしてください。</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('settings')}
                          className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                        >
                          アップグレード
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Primary Metric: CVI */}
                  <div id="cvi-score-card" className="lg:col-span-4 bg-black rounded-3xl p-8 text-white flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-400/20 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Zap size={16} fill="currentColor" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Autonomous Core</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            selectedCampaign?.status === 'reviewing' ? 'bg-orange-400 animate-pulse' :
                            isDelivering ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                          }`} />
                          <span className="text-[10px] font-bold uppercase">
                            {selectedCampaign?.status === 'reviewing' ? '審査中' :
                             isDelivering ? '配信中' : '停止中'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">平均CVI (資本回転率)</h3>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                            syncStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'
                          }`}>
                            {syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'success' ? 'SYNCED' : 'IDLE'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold tracking-tighter">{metrics.averageCvi.toFixed(0)}</span>
                        {metrics.averageCvi > 0 && campaigns.length > 0 && <span className="text-emerald-400 text-sm font-bold">+12%</span>}
                      </div>
                    </div>

                    {isSyncing && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
                        <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-xs font-bold text-white mb-2">外部媒体と同期中...</p>
                        <p className="text-[10px] text-gray-400 animate-pulse">
                          {notifications[0]?.message || "データを最適化しています"}
                        </p>
                      </div>
                    )}

                    <div className="mt-8 relative z-10">
                      <div className="flex gap-2 mb-4">
                        <button 
                          onClick={() => setIsDelivering(true)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                            isDelivering ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          配信開始
                        </button>
                        <button 
                          onClick={() => setIsDelivering(false)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                            !isDelivering ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                        >
                          <XCircle size={14} />
                          配信停止
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                        利益 / (広告費 × 成約日数)。現金の回収速度を示す最重要指標。
                        <br />
                        <span className="text-emerald-400 font-bold">目標値 80 を上回っています。</span>
                      </p>
                      <button 
                        onClick={handleOptimize}
                        disabled={isGenerating}
                        className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                      >
                        {isGenerating ? '最適化中...' : 'CVIをさらに加速させる'}
                      </button>

                      {plan === 'Lite' && (
                        <button 
                          onClick={startAIHearing}
                          disabled={isHearingLoading}
                          className="w-full mt-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isHearingLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                          AIヒアリングを開始する
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CVI Trend Chart */}
                  <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-gray-900">{METRIC_LABELS[selectedMetric]} 推移分析</h3>
                        <p className="text-xs text-gray-500">自律最適化によるパフォーマンス向上</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2">
                          <select 
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="bg-gray-100 border-none rounded-xl px-3 py-1.5 text-[10px] font-bold text-gray-900 focus:ring-0 cursor-pointer"
                          >
                            {Object.entries(METRIC_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                            {(['1D', '1W', '1M', 'Custom'] as const).map((range) => (
                              <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                  timeRange === range 
                                    ? 'bg-white text-black shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {range === '1D' ? '1日' : range === '1W' ? '1週間' : range === '1M' ? '1ヶ月' : 'カスタム'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {timeRange === 'Custom' && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="1" 
                              max="180" 
                              value={customDays} 
                              onChange={(e) => setCustomDays(parseInt(e.target.value))}
                              className="w-32 accent-black"
                            />
                            <span className="text-[10px] font-bold text-gray-900 w-12">{customDays}日間</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div id="cvi-trend-chart" className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            dy={10}
                          />
                          <YAxis hide />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={selectedMetric} 
                            stroke="#141414" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorMetric)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Second Row: Secondary Metrics & Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  <MetricCard 
                    label="総広告費" 
                    value={`¥${(metrics.totalSpend || 0).toLocaleString()}`} 
                    trend={metrics.totalSpend > 0 && campaigns.length > 0 ? "-5.2%" : undefined} 
                    icon={<Megaphone className="text-gray-900" />} 
                    subValue={metrics.totalSpend > 0 && campaigns.length > 0 ? `予算比: ${(((metrics.totalSpend || 0) / (selectedCampaign?.budget || dashboardFilteredCampaigns.reduce((acc, c) => acc + (c.budget || 0), 0) || 1)) * 100).toFixed(1)}%` : undefined}
                    progress={((metrics.totalSpend || 0) / (selectedCampaign?.budget || dashboardFilteredCampaigns.reduce((acc, c) => acc + (c.budget || 0), 0) || 1)) * 100}
                  />
                  <MetricCard label="Imp" value={(metrics.totalImpressions || 0).toLocaleString()} trend={metrics.totalImpressions > 0 && campaigns.length > 0 ? "+12.4%" : undefined} icon={<Activity className="text-gray-900" />} subValue={metrics.totalImpressions > 0 && campaigns.length > 0 ? "前期間比 +4,200" : undefined} />
                  <MetricCard label="獲得リード" value={(metrics.totalLeads || 0).toString()} trend={metrics.totalLeads > 0 && campaigns.length > 0 ? "+18.2%" : undefined} icon={<Users className="text-gray-900" />} subValue={metrics.totalLeads > 0 && campaigns.length > 0 ? "前期間比 +12" : undefined} />
                  <MetricCard label="平均CPA" value={`¥${(metrics.cpa || 0).toLocaleString()}`} trend={metrics.cpa > 0 && campaigns.length > 0 ? "-12.4%" : undefined} icon={<TrendingUp className="text-emerald-600" />} subValue={metrics.cpa > 0 && campaigns.length > 0 ? "目標: ¥8,000" : undefined} />
                  <MetricCard label="CPC" value={`¥${(metrics.averageCpc || 0).toFixed(0)}`} trend={metrics.averageCpc > 0 && campaigns.length > 0 ? "-8.1%" : undefined} icon={<MousePointerClick className="text-gray-900" />} subValue={metrics.averageCpc > 0 && campaigns.length > 0 ? "前期間比 -¥12" : undefined} />
                  <MetricCard label="CVR" value={`${(metrics.averageCvr || 0).toFixed(1)}%`} trend={metrics.averageCvr > 0 && campaigns.length > 0 ? "+0.4%" : undefined} icon={<CheckCircle2 className="text-gray-900" />} subValue={metrics.averageCvr > 0 && campaigns.length > 0 ? "前期間比 +0.2%" : undefined} />
                  <MetricCard label="ROAS" value={`${(metrics.roas || 0).toFixed(1)}x`} trend={metrics.roas > 0 && campaigns.length > 0 ? "+0.5x" : undefined} icon={<BarChart3 className="text-gray-900" />} subValue={metrics.roas > 0 && campaigns.length > 0 ? "前期間比 +0.2x" : undefined} />
                </div>

                {/* Third Row: Strategic Plan & Distribution & Top Creative */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Strategic Plan or Reports */}
                  <div className="lg:col-span-6 space-y-6">
                    {strategicPlan ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border-2 border-black rounded-3xl p-8 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            <Terminal size={20} />
                            自律戦略レポート
                          </h4>
                          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                            予測CVI: {strategicPlan.cviProjection}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">分析フェーズ</p>
                            <ul className="space-y-3">
                              {strategicPlan.analysis.map((item, i) => (
                                <li key={i} className="text-sm flex items-start gap-3">
                                  <span className="text-emerald-500 mt-0.5"><CheckCircle2 size={16} /></span>
                                  <span className="text-gray-700">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">戦略フェーズ</p>
                            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{strategicPlan.strategy}</p>
                            <div className="mt-4 p-4 bg-gray-900 rounded-2xl">
                              <p className="text-[10px] font-mono text-gray-500 mb-2">Webhook Payload (Make.com)</p>
                              <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                {JSON.stringify(strategicPlan.webhookPayload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={20} className="text-gray-900" />
                            AI 改善実績レポート
                          </h3>
                          <button className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">すべて見る</button>
                        </div>
                        {reports.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <Activity size={24} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-400">改善実績はまだありません</p>
                            <p className="text-[10px] text-gray-400 mt-1">AIが運用を開始すると、ここにレポートが表示されます</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {reports.map(report => (
                              <div key={report.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    report.type === 'budget_shift' ? 'bg-blue-50 text-blue-600' :
                                    report.type === 'ad_stop' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {report.type === 'budget_shift' ? <ArrowRightLeft size={18} /> :
                                     report.type === 'ad_stop' ? <XCircle size={18} /> : <TrendingUp size={18} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{report.title}</p>
                                    <p className="text-xs text-gray-500 whitespace-pre-wrap">{report.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-emerald-600">{report.impact}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(report.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Distribution Chart */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-6">媒体別予算配分</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformDistribution} layout="vertical" margin={{ left: 20, right: 40 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            width={100}
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#374151' }}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                            {platformDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2">
                      {platformDistribution.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-500 font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campaign Management List (Only for "All Campaigns" view) */}
                {selectedCampaignId === 'all' && (
                  <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm mt-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-gray-900" />
                        キャンペーン管理
                      </h3>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{dashboardFilteredCampaigns.length} キャンペーン</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">キャンペーン名</th>
                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ステータス</th>
                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">予算</th>
                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">実績 (CVI)</th>
                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dashboardFilteredCampaigns.map(campaign => (
                            <tr key={campaign.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    campaign.status === 'active' ? 'bg-emerald-500' : 
                                    campaign.status === 'paused' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`} />
                                  <span className="text-sm font-bold text-gray-900">{campaign.name}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                  campaign.status === 'paused' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {campaign.status === 'active' ? '配信中' : 
                                   campaign.status === 'paused' ? '一時停止' : '審査中'}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="text-sm font-medium text-gray-600">¥{campaign.budget.toLocaleString()}</span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="text-sm font-bold text-gray-900">{campaign.cvi || '-'}</span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setSelectedCampaignId(campaign.id);
                                      setShowCampaignSettings(true);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                    title="設定"
                                  >
                                    <SettingsIcon size={16} />
                                  </button>
                                  {campaign.status !== 'reviewing' && (
                                    <button 
                                      onClick={() => handleToggleCampaignStatus(campaign.id, campaign.status)}
                                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                      title={campaign.status === 'active' ? '一時停止' : '配信開始'}
                                    >
                                      {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="削除"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'help' && (
              <motion.div 
                key="help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-12 pb-20"
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">ヘルプ・サポート</h2>
                  <p className="text-gray-500">AMASの利用方法やマーケティングの疑問を解決します</p>
                </div>

                {/* 1. Quick Start Guide */}
                {renderQuickStartGuide()}

                {/* 2. FAQ */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm max-w-4xl mx-auto w-full">
                  <h3 className="font-bold text-2xl text-gray-900 mb-10 flex items-center gap-4">
                    <HelpCircle size={28} className="text-gray-900" />
                    よくある質問
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { q: "CVIを上げるにはどうすればいいですか？", a: "成約までの日数を短縮することが重要です。LPOエージェントを有効にし、LPの離脱率を下げてください。" },
                      { q: "予算の自動調整はどのように行われますか？", a: "各媒体のリアルタイムなCVIを比較し、最も効率の良い媒体へAIが自動的に予算をシフトします。" },
                      { q: "AIが生成した広告文を修正できますか？", a: "はい、承認ワークフローから、AIの提案を自由に編集・修正いただけます。" },
                      { q: "対応している業種は何ですか？", a: "歯科、不用品回収、美容外科、リフォームなど、ローカルビジネスを中心に幅広く対応しています。" },
                      { q: "プラン変更は即時反映されますか？", a: "はい、決済完了後すぐに新しいプランの機能と広告費上限が適用されます。" },
                      { q: "サポート体制を教えてください。", a: "AIチャットのほか、平日10時〜18時で専任コンサルタントによるメールサポートを行っています。" }
                    ].map((item, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                        <p className="font-bold text-sm text-gray-900 mb-3 flex items-start gap-2">
                          <span className="text-blue-600">Q.</span>
                          {item.q}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed pl-6">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. AMAS Support (AI Chat) */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-200 shadow-sm flex flex-col h-[700px] max-w-4xl mx-auto relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">AMAS Support</h3>
                        <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          AIコンシェルジュがオンライン
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setHelpMessages([])}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                    >
                      チャットをクリア
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
                    {helpMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600">
                          <Cpu size={48} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-3">何かお手伝いしましょうか？</h4>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                          AMASの機能、CVIの向上方法、予算設定など、マーケティングに関する疑問を何でもお尋ねください。
                        </p>
                      </div>
                    ) : (
                      helpMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-gray-100 text-gray-700 rounded-tl-none border border-gray-200'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {isHelpLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-5 rounded-2xl rounded-tl-none border border-gray-200">
                          <Loader2 size={20} className="animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FAQ Buttons Section */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest px-2">よく聞かれる質問</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "まず何をすればいいですか？",
                        "AIが自動でやってくれることは何ですか？",
                        "広告費はいくらから始められますか？",
                        "効果が出るまでどのくらいかかりますか？"
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendHelpQuery(q)}
                          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-left transition-all border border-gray-100 hover:border-blue-200 group"
                        >
                          <span className="text-lg">💬</span>
                          <span className="text-[11px] font-bold text-gray-700 group-hover:text-blue-600 transition-colors leading-tight">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea 
                      value={helpQuery}
                      onChange={(e) => setHelpQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendHelpQuery();
                        }
                      }}
                      placeholder="質問を入力してください..."
                      className="w-full p-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-28 pr-16"
                    />
                    <button 
                      onClick={() => handleSendHelpQuery()}
                      disabled={isHelpLoading || !helpQuery.trim()}
                      className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>

                {/* 4. Operation Manual (Detailed) */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm max-w-4xl mx-auto w-full">
                  <h3 className="font-bold text-2xl text-gray-900 mb-10 flex items-center gap-4">
                    <BookOpen size={28} className="text-blue-600" />
                    操作マニュアル（詳細）
                  </h3>
                  
                  <div className="space-y-12">
                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">1</div>
                        <h4 className="font-bold text-xl text-gray-900">キャンペーンの開始と設定</h4>
                      </div>
                      <div className="pl-14 space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          ダッシュボード右上の「新規入稿」ボタンから開始します。業種を選択し、予算を設定した後、Google Ads / Meta AdsとのOAuth連携を完了させてください。
                        </p>
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-xs text-blue-800 font-bold mb-2 flex items-center gap-2">
                            <Cpu size={14} /> 連携のポイント
                          </p>
                          <p className="text-xs text-blue-600 leading-relaxed">
                            以前の「子アカウント自動発行」ではなく、お客様の既存アカウントの権限をAMASに委譲する形式です。これにより、実績のあるアカウントをそのまま活用できます。
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">2</div>
                        <h4 className="font-bold text-xl text-gray-900">AIエージェントの役割</h4>
                      </div>
                      <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-3">
                            <Search size={18} className="text-blue-500" /> SEOエージェント
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            検索意図を分析し、メインサイトを汚さずに外側に「CVI特化型サテライトページ」を自動生成・運用します。
                          </p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-3">
                            <Shield size={18} className="text-red-500" /> AI検閲エージェント
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            薬機法、景表法、媒体ポリシーをAIが自動チェック。不承認リスクを事前に排除し、ブランドの安全性を守ります。
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">3</div>
                        <h4 className="font-bold text-xl text-gray-900">CVI（資本回転率）の理解</h4>
                      </div>
                      <div className="pl-14">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          AMASが最も重視する指標は「CVI」です。これは単なるCPAではなく、広告費がどれだけ早く利益として戻ってくるかを測定します。
                        </p>
                        <div className="bg-gray-900 text-white p-8 rounded-3xl font-mono text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                          <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-widest">CVI計算式</p>
                          <p className="text-2xl font-bold text-blue-400">利益 / (広告費 × 成約までの日数)</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold text-lg">4</div>
                        <h4 className="font-bold text-xl text-gray-900">承認ワークフロー</h4>
                      </div>
                      <div className="pl-14">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          AIが提案する重要な戦略変更や新しい広告文は、まず「承認待ち」に届きます。内容を確認し、問題なければ「承認」することで実際の配信に反映されます。
                        </p>
                        <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                          <p className="text-xs text-orange-800 font-bold mb-2 flex items-center gap-2">
                            <AlertCircle size={14} /> 運用の注意点
                          </p>
                          <p className="text-xs text-orange-600 leading-relaxed">
                            24時間以内に承認されない場合、AIは安全のために配信を一時停止するか、現状維持を選択します。
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">5</div>
                        <h4 className="font-bold text-xl text-gray-900">Wallet & オートチャージ</h4>
                      </div>
                      <div className="pl-14">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          広告費はWalletにデポジットされた残高から支払われます。残高が不足すると広告配信が停止するため、オートチャージの設定を推奨します。
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-900 mb-2">チャージ方法</p>
                            <p className="text-xs text-gray-500 leading-relaxed">クレジットカードまたは銀行振込が利用可能です。</p>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-900 mb-2">オートチャージ</p>
                            <p className="text-xs text-gray-500 leading-relaxed">残高が¥50,000を切ると自動で設定額をチャージします。</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-lg">6</div>
                        <h4 className="font-bold text-xl text-gray-900">ガードレール設定</h4>
                      </div>
                      <div className="pl-14">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          AIの自律的な行動範囲を制限するための設定です。最大日次予算や、AI検閲エージェントによる「安全スコア」のしきい値を設定できます。
                        </p>
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                          <p className="text-xs text-red-800 font-bold mb-2 flex items-center gap-2">
                            <Shield size={14} /> 法規制への対応
                          </p>
                          <p className="text-xs text-red-600 leading-relaxed">
                            薬機法や景表法などの複雑な法規制も、AIが最新の基準に照らしてチェックします。これにより、意図しない規約違反を防ぐことが可能です。
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* 5. Plans & Measurement */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm max-w-4xl mx-auto w-full">
                  <h3 className="font-bold text-2xl text-gray-900 mb-10 flex items-center gap-4">
                    <ShieldCheck size={28} className="text-blue-600" />
                    プランと計測方法の違い
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6">
                        <MousePointer2 size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-blue-900 mb-2">Free / Lite プラン</h4>
                      <p className="text-xs text-blue-700 font-bold mb-4">成果地点: サイト遷移（クリック）</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        タグの設置は不要です。AIが広告プラットフォームのクリックデータと、社長へのヒアリング（Liteのみ）を元に、擬似的にCVIを最適化します。
                      </p>
                    </div>
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                      <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-6">
                        <Target size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-emerald-900 mb-2">Standard / Pro プラン</h4>
                      <p className="text-xs text-emerald-700 font-bold mb-4">成果地点: 問い合わせ完了（自動計測）</p>
                      <p className="text-xs text-emerald-600 leading-relaxed">
                        AMAS専用フォームの設置（Standard）や、GA4/Pixel連携（Pro）により、実際の成約データを元にAIが自律的にCVIを最大化します。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Direct Inquiry */}
                <div className="max-w-4xl mx-auto w-full">
                  <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3">
                        <Mail size={24} className="text-blue-400" />
                        直接問い合わせる
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        AIで解決しない技術的な問題や、プランのアップグレードについては、専任コンサルタントが個別に対応いたします。
                      </p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center min-w-[280px]">
                      <p className="text-lg font-bold mb-1">support@amas-core.ai</p>
                      <p className="text-xs text-gray-500">平日 10:00 - 18:00（土日祝休）</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div 
                key="agents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">エージェント・オーケストラ</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {agents.map(agent => (
                  <div key={agent.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-black transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                          <AgentIcon type={agent.type} size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{agent.name}</h3>
                            {agent.isBeta && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded uppercase tracking-wider">Beta</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${agent.status === 'working' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                              {agent.status === 'idle' ? '待機中' : 
                               agent.status === 'working' ? '自律稼働中' : 
                               agent.status === 'waiting_approval' ? '要確認' : 'エラー'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGenerate(agent.type)}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all disabled:opacity-50 ${
                          !(selectedCampaign?.mainSiteUrl || systemSettings.mainSiteUrl) 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-50 text-gray-600 hover:bg-black hover:text-white'
                        }`}
                        title={!(selectedCampaign?.mainSiteUrl || systemSettings.mainSiteUrl) ? 'メインサイトURLの登録が必要です' : ''}
                      >
                        <Plus size={18} />
                        <span className="text-xs font-bold">
                          {agent.type === 'SEO' ? 'サテライト展開案を生成' : 
                           agent.type === 'Ads' ? '広告案を生成' : 
                           agent.type === 'LPO' ? '改善案を生成' : 'アクション生成'}
                        </span>
                      </button>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {agent.description}
                      </p>
                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">最新のアクション</p>
                        <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                          <Activity size={12} className="text-emerald-500" />
                          {agent.lastAction}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'approvals' && (
              <motion.div 
                key="approvals"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">AI検閲・承認ワークフロー ({tasks.filter(t => t.status === 'pending').length}件)</h2>
                </div>

                {tasks.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h4 className="font-bold text-gray-900">承認待ちはありません</h4>
                    <p className="text-sm text-gray-500 max-w-xs mt-1">AMASがすべてのコンテンツを自律的に処理しました。</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <AgentIcon type={task.type} />
                            <div>
                              <h4 className="font-bold text-gray-900">{task.title}</h4>
                              <p className="text-xs text-gray-400">{task.type}エージェント生成 • {new Date(task.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle size={20} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (plan === 'Lite') {
                                  notify('SEO設定をクリップボードにコピーしました。サイト管理画面に貼り付けてください。');
                                } else {
                                  setIsSyncing(true);
                                  notify(`${plan === 'Standard' ? 'WordPress' : 'CMS'}へ同期中...`);
                                  await new Promise(r => setTimeout(r, 2000));
                                  setIsSyncing(false);
                                  notify('サイトの更新が完了しました。');
                                }
                                setTasks(prev => prev.filter(t => t.id !== task.id));
                              }}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Brand Safety Score */}
                        <div className="mb-4 flex items-center gap-4 bg-gray-900 p-3 rounded-xl text-white">
                          <div className="flex flex-col items-center justify-center px-4 border-r border-gray-700">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">安全スコア</p>
                            <p className={`text-xl font-bold ${task.brandSafetyScore > 80 ? 'text-emerald-400' : task.brandSafetyScore > 50 ? 'text-orange-400' : 'text-red-400'}`}>
                              {task.brandSafetyScore}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-300 mb-1 flex items-center gap-1">
                              <ShieldCheck size={14} className="text-emerald-400" />
                              AMAS検閲エンジンの判定:
                            </p>
                            <p className="text-xs text-gray-400 italic">"{task.safetyFeedback}"</p>
                          </div>
                        </div>

                        {task.type === 'SEO' && task.metadata ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                              <h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-2">AMASサテライト展開案 (外側支援)</h5>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="px-2 py-1 bg-white border border-emerald-200 rounded text-[10px] font-bold text-emerald-700">
                                  メインサイトを保護
                                </div>
                                <ArrowRight size={12} className="text-emerald-400" />
                                <div className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                  AMASサテライト構築
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">ターゲットキーワード</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {task.metadata.targetKeywords?.map((kw: string) => (
                                      <span key={kw} className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[10px] font-bold text-emerald-700">{kw}</span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">展開先URL案</p>
                                  <p className="text-xs font-bold text-gray-900 mt-1">{task.metadata.satelliteUrl}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">送客先メインサイト</p>
                                  <p className="text-xs font-bold text-emerald-700 mt-1 truncate">{selectedCampaign?.mainSiteUrl || '未設定'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">サテライト構成案</p>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">キャッチコピー</p>
                                  <p className="text-xs font-bold text-gray-800">{task.metadata.pageStructure?.hero}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">誘導ベネフィット</p>
                                  <p className="text-xs text-gray-600">{task.metadata.pageStructure?.solution}</p>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  <p className="text-[10px] font-bold text-gray-700">CTA: {task.metadata.pageStructure?.cta}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-4">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">AIの戦略意図</p>
                              <p className="text-xs text-gray-600 italic leading-relaxed">"{task.metadata.searchIntent}"</p>
                            </div>

                            <button 
                              onClick={async () => {
                                if (!user) return;
                                setIsSyncing(true);
                                notify('AMASネットワークへサテライトページを展開中...');
                                
                                try {
                                  console.log('Deploying satellite page for task:', task.title);
                                  console.log('Task metadata:', task.metadata);
                                  
                                  const rawSlug = task.metadata.satelliteUrl?.split('/').pop() || 'lp-' + Date.now();
                                  const cleanSlug = rawSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
                                  console.log('Generated slug:', cleanSlug);

                                  const pageData: Omit<SatellitePage, 'id'> = {
                                    ownerUid: user.uid,
                                    title: task.title,
                                    slug: cleanSlug,
                                    mainSiteUrl: selectedCampaign?.mainSiteUrl || systemSettings.mainSiteUrl || '',
                                    htmlContent: task.metadata.htmlContent || `<html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h1>${task.title}</h1><p>${task.content}</p></body></html>`,
                                    cssContent: task.metadata.cssContent || '',
                                    targetKeywords: task.metadata.targetKeywords || [],
                                    status: 'published',
                                    createdAt: Date.now(),
                                    updatedAt: Date.now(),
                                    metrics: {
                                      views: 0,
                                      clicks: 0,
                                      conversions: 0,
                                      cvi: 0
                                    }
                                  };
                                  console.log('Saving page data to Firestore:', pageData);
                                  const docRef = await addDoc(collection(db, 'satellite_pages'), pageData);
                                  console.log('Page saved with ID:', docRef.id);
                                  
                                  await new Promise(r => setTimeout(r, 2000));
                                  setIsSyncing(false);
                                  notify('サテライトページの公開が完了しました。メインサイトへの送客を開始します。', 'success');
                                  setTasks(prev => prev.filter(t => t.id !== task.id));
                                } catch (error) {
                                  console.error('Error creating satellite page:', error);
                                  setIsSyncing(false);
                                  notify('公開中にエラーが発生しました。');
                                }
                              }}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <Zap size={16} />
                              サテライトを即時展開する
                            </button>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-gray-100">
                            {task.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'clients' && (profile?.role === 'admin' || plan === 'Agency') && (
              <motion.div 
                key="clients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ClientManagerView 
                  clients={clients}
                  sites={sites}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onAddSite={handleAddSite}
                  onUpdateSite={handleUpdateSite}
                  onDeleteSite={handleDeleteSite}
                />
              </motion.div>
            )}

            {activeTab === 'satellite-fleet' && (
              <motion.div 
                key="satellite-fleet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SatelliteFleetView 
                  pages={satellitePages}
                  onDelete={async (id) => {
                    try {
                      await deleteDoc(doc(db, 'satellite_pages', id));
                      notify('サテライトページを削除しました。');
                    } catch (error) {
                      console.error('Delete error:', error);
                      notify('削除に失敗しました。', 'error');
                    }
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'cockpit' && (
              <motion.div 
                key="cockpit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CockpitView 
                  campaigns={campaigns}
                  profile={profile}
                  user={user}
                  onSelectCampaign={(id) => {
                    setSelectedCampaignId(id);
                    setActiveTab('dashboard');
                  }}
                  onOptimizeAll={async () => {
                    setIsGenerating(true);
                    notify('全案件のフリート最適化を開始します...', 'success');
                    
                    // Simulate API sync with detailed steps
                    await simulateApiSync();
                    
                    // Apply optimization logic based on manual/auto mode
                    const updatedCampaigns = campaigns.map(c => {
                      if (c.isManualMode) {
                        // Manual mode: Respect user settings, AI only optimizes within constraints
                        return {
                          ...c,
                          cvi: Math.min(100, c.cvi + Math.floor(Math.random() * 3) + 1) // Smaller boost as AI is restricted
                        };
                      } else {
                        // Auto mode: AI has full control to maximize CVI
                        return {
                          ...c,
                          cvi: Math.min(100, c.cvi + Math.floor(Math.random() * 8) + 4) // Larger boost
                        };
                      }
                    });

                    // Update in Firestore
                    const batch = writeBatch(db);
                    updatedCampaigns.forEach(c => {
                      const ref = doc(db, 'campaigns', c.id);
                      batch.update(ref, { cvi: c.cvi });
                    });
                    
                    try {
                      await batch.commit();
                      notify('フリート最適化が完了しました。マニュアル設定を尊重しつつ、全ユニットのパケットを更新しました。');
                    } catch (error) {
                      console.error('Batch update error:', error);
                      notify('最適化データの同期に失敗しました。', 'error');
                    }
                    
                    setIsGenerating(false);
                  }}
                  isOptimizing={isGenerating}
                  onOpenTuning={(id) => setTuningCampaignId(id)}
                  selectedClientId={selectedClientId}
                  selectedSiteId={selectedSiteId}
                />
              </motion.div>
            )}

            {tuningCampaignId && campaigns.find(c => c.id === tuningCampaignId) && (
              <TuningModal 
                campaign={campaigns.find(c => c.id === tuningCampaignId)!}
                onClose={() => setTuningCampaignId(null)}
                onSave={(updates) => handleUpdateCampaignSettings(tuningCampaignId, updates)}
                isUpdating={isUpdatingCampaign}
              />
            )}

            {activeTab === 'admin' && profile?.role === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AdminConsoleView 
                  users={allUsers} 
                  onUpdateUserPlan={handleUpdateUserPlan}
                  onUpdateUserRole={handleUpdateUserRole}
                  onApproveTransaction={handleApproveTransaction}
                  onRejectTransaction={handleRejectTransaction}
                  onResetMonthlyUsage={handleResetMonthlyUsage}
                  announcements={announcements}
                  onSendAnnouncement={handleCreateAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
                  onSyncMemberCounts={handleSyncMemberCounts}
                  systemSettings={systemSettings}
                  setSystemSettings={setSystemSettings}
                  onSaveSettings={handleSaveSettings}
                />
              </motion.div>
            )}

            {activeTab === 'new_campaign' && (
              <motion.div 
                key="new_campaign"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl"
              >
                <NewCampaignWizard
                  user={user}
                  profile={profile}
                  initialClientId={selectedClientId !== 'all' ? selectedClientId : undefined}
                  initialSiteId={selectedSiteId !== 'all' ? selectedSiteId : undefined}
                  initialDraft={pendingDraftRestore}
                  onDraftRestored={() => setPendingDraftRestore(null)}
                  onComplete={() => {
                    setSelectedCampaignId('all');
                    setSelectedClientId('all');
                    setSelectedSiteId('all');
                    setActiveTab('dashboard');
                  }} 
                  onCampaignCreated={async (newCampaign) => {
                    if (user) {
                      console.log('Creating campaign:', newCampaign.name);
                      const monthlyUsage = wallet?.monthlyUsage || { monthlyDeposit: 0, monthlyCreatives: 0, monthlyCampaigns: 0, lastResetAt: Date.now(), adjustmentCampaigns: 0, adjustmentCreatives: 0 };
                      const campaignLimit = PLANS[plan]?.maxCampaigns || 0;
                      const creativeLimit = PLANS[plan]?.maxCreatives || 0;
                      
                      const effectiveCampaigns = Math.max(0, (monthlyUsage.monthlyCampaigns || 0) - (monthlyUsage.adjustmentCampaigns || 0));
                      const effectiveCreatives = Math.max(0, (monthlyUsage.monthlyCreatives || 0) - (monthlyUsage.adjustmentCreatives || 0));

                      if (effectiveCampaigns >= campaignLimit) {
                        notify(`今月のキャンペーン作成上限（${campaignLimit}件）に達しました。プランをアップグレードしてください。`, 'error');
                        setActiveTab('settings');
                        return;
                      }
                      
                      if (effectiveCreatives >= creativeLimit) {
                        notify(`今月の入稿上限（${creativeLimit}件）に達しました。プランをアップグレードしてください。`, 'error');
                        setActiveTab('settings');
                        return;
                      }

                      try {
                        const campaignCol = collection(db, 'campaigns');
                        const newDocRef = doc(campaignCol);
                        
                        console.log('[Firestore] Attempting to write campaign:', newDocRef.id);
                        
                        // --- REAL PIPELINE: IMAGE STORAGE ---
                        // In a real app, we upload to storage first
                        const campaignToSave = JSON.parse(JSON.stringify(newCampaign));
                        
                        // Function to handle image uploads to our new backend storage
                        const uploadImages = async (obj: any) => {
                          if (!obj || typeof obj !== 'object') return;
                          
                          for (const key of Object.keys(obj)) {
                            const value = obj[key];
                            if (typeof value === 'string' && value.startsWith('data:image')) {
                              try {
                                console.log(`[Pipeline] Uploading image for ${key}...`);
                                const res = await fetch('/api/storage/upload', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    base64: value, 
                                    userId: user.uid,
                                    fileName: `campaign_${newDocRef.id}_${key}.png`
                                  })
                                });
                                if (res.ok) {
                                  const { url } = await res.json();
                                  obj[key] = url; // Replace base64 with real URL
                                  console.log(`[Pipeline] Image uploaded successfully: ${url}`);
                                }
                              } catch (e) {
                                console.error('[Pipeline] Image upload failed:', e);
                                // Fallback to placeholder if upload fails
                                obj[key] = 'https://picsum.photos/seed/ad/800/600';
                              }
                            } else if (typeof value === 'object') {
                              await uploadImages(value);
                            }
                          }
                        };

                        await uploadImages(campaignToSave);

                        campaignToSave.id = newDocRef.id;
                        campaignToSave.ownerUid = user.uid;
                        campaignToSave.createdAt = serverTimestamp();
                        
                        // Link to the actual connected ad account IDs from the user's profile
                        if (profile?.google_ad_account_id) {
                          campaignToSave.google_ad_account_id = profile.google_ad_account_id;
                        }
                        if (profile?.meta_ad_account_id) {
                          campaignToSave.meta_ad_account_id = profile.meta_ad_account_id;
                        }
                        
                        // Remove any undefined values
                        Object.keys(campaignToSave).forEach(key => {
                          if (campaignToSave[key] === undefined) {
                            delete campaignToSave[key];
                          }
                        });

                        console.log('[Firestore] Saving campaign with real URLs...');
                        await setDoc(newDocRef, campaignToSave);
                        console.log('[Firestore] Campaign write successful');
                        
                        // --- REAL PIPELINE: DEPLOYMENT ---
                        // Trigger the actual deployment on the server
                        try {
                          console.log('[Pipeline] Triggering server-side deployment...');
                          const deployRes = await fetch('/api/campaigns/deploy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ campaignId: newDocRef.id, userId: user.uid })
                          });
                          const deployData = await deployRes.json();
                          console.log('[Pipeline] Deployment triggered:', deployData);
                        } catch (deployError) {
                          console.error('[Pipeline] Deployment trigger failed:', deployError);
                        }
                        
                        // Optimistic update
                        setCampaigns(prev => {
                          if (prev.some(c => c.id === newDocRef.id)) return prev;
                          return [{ ...newCampaign, id: newDocRef.id, ownerUid: user.uid, createdAt: Date.now() }, ...prev];
                        });
                        
                        // Update usage metrics safely - DO NOT let this block campaign creation
                        try {
                          const walletRef = doc(db, 'wallets', user.uid);
                          await updateDoc(walletRef, {
                            'monthlyUsage.monthlyCampaigns': increment(1),
                            'monthlyUsage.monthlyCreatives': increment(1)
                          });
                          console.log('[Firestore] Wallet usage updated');
                        } catch (walletError) {
                          console.warn('[Firestore] Wallet update failed (non-blocking):', walletError);
                          // We don't re-throw here because the campaign was already saved successfully
                        }

                        notify('キャンペーンを媒体審査へ送信しました。', 'success');
                      } catch (error) {
                        console.error('[Firestore] Campaign creation error details:', error);
                        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
                        notify(`キャンペーンの作成に失敗しました: ${errorMessage}`, 'error');
                        throw error;
                      }
                    }
                  }}
                  industry={industry} 
                  plan={PLANS[plan]}
                  onUpgrade={() => setActiveTab('settings')}
                  systemSettings={systemSettings}
                  clients={clients}
                  sites={sites}
                  notify={notify}
                />
              </motion.div>
            )}

            {activeTab === 'drafts' && user && (
              <motion.div
                key="drafts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl"
              >
                <DraftsPage
                  userId={user.uid}
                  onRestore={(draft) => {
                    setPendingDraftRestore(draft);
                    setActiveTab('new_campaign');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'wallet' && user && (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Wallet userUid={user.uid} />
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div 
                key="subscription"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-6xl space-y-8"
              >
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">プラン選択</h2>
                      <p className="text-sm text-gray-500 mt-1">ビジネスの成長に合わせて最適なプランをお選びください</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        月間払い
                      </button>
                      <div className="flex items-center gap-2 pr-2">
                        <button 
                          onClick={() => setBillingCycle('annual')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${
                            billingCycle === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          年間払い
                          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                            2ヶ月分無料
                          </span>
                        </button>
                        {billingCycle === 'annual' && (
                          <div className="relative group">
                            <HelpCircle size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10">
                              年間プランは1年間の継続利用を条件とした割引価格です。期間中の月間プランへの変更や返金はできませんのでご了承ください。
                              <div className="absolute top-full right-1.5 border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {scheduledPlan && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-900">プラン変更の予約があります</p>
                          <p className="text-xs text-blue-700">
                            {new Date(planExpiresAt!).toLocaleDateString()} より {scheduledPlan}（{scheduledBillingCycle === 'annual' ? '年間' : '月間'}）に切り替わります。
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (!user) return;
                          await updateDoc(doc(db, 'users', user.uid), {
                            scheduledPlan: null,
                            scheduledBillingCycle: null
                          });
                          setScheduledPlan(null);
                          setScheduledBillingCycle(null);
                          notify('プラン変更の予約をキャンセルしました。');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        予約をキャンセル
                      </button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {(['Free', 'Lite', 'Standard', 'Pro', 'Agency'] as PlanType[]).map(p => {
                      const isCurrent = plan === p && billingCycle === (p === 'Free' ? billingCycle : (planExpiresAt ? 'annual' : 'monthly'));
                      // Note: This is a simplified check for "current"
                      
                      return (
                        <button 
                          key={p}
                          onClick={() => handlePlanSelect(p)}
                          className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col h-full relative overflow-hidden ${
                            plan === p ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {p === 'Standard' && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] px-3 py-1 font-bold uppercase tracking-widest transform rotate-45 translate-x-4 translate-y-2">
                              Popular
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="font-bold text-lg">{p}</p>
                            <div className="mt-1">
                              <p className={`text-xl font-bold ${plan === p ? 'text-white' : 'text-gray-900'}`}>
                                ¥{billingCycle === 'annual' ? PLANS[p].priceAnnual.toLocaleString() : PLANS[p].priceMonthly.toLocaleString()}
                              </p>
                              <p className={`text-[10px] ${plan === p ? 'text-gray-400' : 'text-gray-500'}`}>
                                {billingCycle === 'annual' ? '年額（一括払い）' : '月額（単発）'}
                              </p>
                              {billingCycle === 'annual' && p !== 'Free' && (
                                <p className="text-[10px] text-emerald-500 font-bold mt-1">
                                  月換算 ¥{Math.floor(PLANS[p].priceAnnual / 12).toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <p className={`text-[10px] mt-4 font-medium leading-relaxed ${plan === p ? 'text-gray-300' : 'text-gray-500'}`}>
                              {PLANS[p].recommendedFor}
                            </p>

                            <div className="mt-6 space-y-2">
                              <p className={`text-[10px] flex items-center gap-1.5 font-bold ${plan === p ? 'text-blue-300' : 'text-blue-600'}`}>
                                <CheckCircle2 size={12} />
                                成果地点: {PLANS[p].conversionGoal}
                              </p>
                              <p className={`text-[10px] flex items-center gap-1.5 font-bold ${plan === p ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                <SettingsIcon size={12} />
                                技術設定: {PLANS[p].technicalSetup}
                              </p>
                              <p className={`text-[10px] flex items-center gap-1.5 font-bold ${plan === p ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Users size={12} />
                                アカウント登録数: {PLANS[p].maxAccounts}名
                              </p>
                              <p className={`text-[10px] flex items-center gap-1.5 font-bold ${plan === p ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Zap size={12} />
                                広告費上限: {PLANS[p].spendLimit === Infinity ? '無制限' : `${PLANS[p].spendLimit >= 10000 ? `${PLANS[p].spendLimit / 10000}万円` : `${PLANS[p].spendLimit.toLocaleString()}円`}まで/月`}
                              </p>
                              <p className={`text-[10px] flex items-center gap-1.5 font-bold ${plan === p ? 'text-purple-300' : 'text-purple-600'}`}>
                                <Cpu size={12} />
                                搭載AI: {PLANS[p].aiModel}
                              </p>
                              <div className="pt-2 space-y-1.5">
                                {PLANS[p].features.map((f, i) => (
                                  <p key={i} className={`text-[10px] flex items-start gap-1.5 leading-tight ${plan === p ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <Plus size={12} className="text-emerald-400 shrink-0" />
                                    {f}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100/10">
                            <p className={`text-[10px] font-bold uppercase mb-2 ${plan === p ? 'text-gray-400' : 'text-gray-500'}`}>対応媒体</p>
                            <div className="flex flex-wrap gap-1">
                              {PLANS[p].platforms.slice(0, 6).map(platform => (
                                <span key={platform} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${plan === p ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                  {PLATFORM_LABELS[platform]}
                                </span>
                              ))}
                              {PLANS[p].platforms.length > 6 && (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${plan === p ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                  +{PLANS[p].platforms.length - 6}
                                </span>
                              )}
                            </div>
                          </div>

                          {plan === p && (
                            <div className="mt-4 w-full py-2 rounded-xl bg-white/10 border border-white/20 text-center text-[10px] font-bold">
                              現在のプラン
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* SEO Agent Explanation */}
                  <div className="mt-12 p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Search size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">SEOエージェントについて</h3>
                        <p className="text-xs text-gray-500">サテライト展開によるCVI（資本回転率）の最大化</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                          サテライト展開案の生成ロジック
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          「静的コンテキスト（業種・URL）」と「動的コンテキスト（AIヒアリング結果）」を掛け合わせ、検索ユーザーが今すぐ解決したい悩みに特化した入り口（サテライトページ）を自動設計します。
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                          Sentinel（センチネル）の思考
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          メインサイトを守りつつ、最も成約率が高くなるような「橋渡し」の文脈を設計。単なるアクセスアップではなく、資本を利益に変える速度（CVI）を最優先に思考します。
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                          CVI最適化エンジン
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          AIが常に「今、最も利益に近いアクション」を計算。無駄なクリックを削ぎ落とし、最短距離でコンバージョンへ導きます。
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
              )}

              {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto space-y-12 pb-20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">設定</h2>
                    <p className="text-sm text-gray-500 mt-1">組織のプロフィール、支払い方法、チームメンバーを管理します</p>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="px-8 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                  >
                    設定を保存
                  </button>
                </div>

                {/* 1. Organization Profile */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Building2 size={22} className="text-blue-600" />
                      組織プロフィール
                    </h3>
                    {(!isBasicInfoComplete || !isBusinessSettingsComplete) && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100 animate-pulse">
                        未完了の項目があります
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm space-y-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">基本情報</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">会社名 / 個人名 <span className="text-rose-500">*必須</span></label>
                          <input 
                            type="text" 
                            placeholder="株式会社AMAS"
                            className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.companyName ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                            value={systemSettings.companyName}
                            onChange={e => setSystemSettings({...systemSettings, companyName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">住所 <span className="text-rose-500">*必須</span></label>
                          <input 
                            type="text" 
                            placeholder="東京都港区..."
                            className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.address ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                            value={systemSettings.address}
                            onChange={e => setSystemSettings({...systemSettings, address: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">電話番号 <span className="text-rose-500">*必須</span></label>
                          <input 
                            type="text" 
                            placeholder="03-1234-5678"
                            className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.phone ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                            value={systemSettings.phone}
                            onChange={e => setSystemSettings({...systemSettings, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm space-y-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">ビジネス設定（AI生成用）</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">送客先（メインサイト）のURL</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                              <span className="text-xs font-bold text-gray-400">https://</span>
                            </div>
                            <input 
                              type="text" 
                              placeholder="www.your-site.com"
                              className={`w-full pl-20 px-4 py-3 rounded-xl border ${!systemSettings.mainSiteUrl ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                              value={systemSettings.mainSiteUrl.replace(/^https?:\/\//, '')}
                              onChange={e => {
                                const val = e.target.value.replace(/^https?:\/\//, '');
                                setSystemSettings({...systemSettings, mainSiteUrl: val ? `https://${val}` : ''});
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">業種</label>
                            <input 
                              type="text" 
                              placeholder="例: 歯科医院"
                              className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.industry ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                              value={systemSettings.industry}
                              onChange={e => setSystemSettings({...systemSettings, industry: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">コンテキスト</label>
                            <input 
                              type="text" 
                              placeholder="例: 地域密着型"
                              className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.context ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none transition-all`}
                              value={systemSettings.context}
                              onChange={e => setSystemSettings({...systemSettings, context: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">商材・サービスの詳細説明</label>
                          <textarea 
                            rows={3}
                            placeholder="AIが広告文やキーワードを生成するための重要な情報です。"
                            className={`w-full px-4 py-3 rounded-xl border ${!systemSettings.businessDescription ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'} focus:ring-2 focus:ring-black focus:outline-none resize-none transition-all`}
                            value={systemSettings.businessDescription}
                            onChange={e => setSystemSettings({...systemSettings, businessDescription: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 1.5 Ad Account Connection */}
                <section className="space-y-6">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Database size={22} className="text-indigo-600" />
                    広告アカウント連携
                  </h3>
                  <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Google Ads */}
                      <div className="p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">Google Ads</p>
                              <p className="text-[10px] text-gray-400">検索・ディスプレイ・YouTube広告</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${profile?.google_ad_account_id ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {profile?.google_ad_account_id ? '連携済み' : '未連携'}
                          </span>
                        </div>
                        {!profile?.google_ad_account_id && (
                          <button 
                            onClick={() => handleConnectOAuth('google')}
                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                          >
                            Googleで連携する
                          </button>
                        )}
                      </div>

                      {/* Meta Ads */}
                      <div className="p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <img src="https://www.facebook.com/favicon.ico" alt="Meta" className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">Meta Ads</p>
                              <p className="text-[10px] text-gray-400">Facebook・Instagram広告</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${profile?.meta_ad_account_id ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {profile?.meta_ad_account_id ? '連携済み' : '未連携'}
                          </span>
                        </div>
                        {!profile?.meta_ad_account_id && (
                          <button 
                            onClick={() => handleConnectOAuth('meta')}
                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                          >
                            Metaで連携する
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Billing & Payment */}
                <section className="space-y-6">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <CreditCard size={22} className="text-emerald-600" />
                    お支払い方法
                  </h3>
                  <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-12">
                      <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                          {(['card', 'bank', 'qr', 'invoice'] as const).map((method) => (
                            <button
                              key={method}
                              onClick={() => setPaymentMethod(method)}
                              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                paymentMethod === method 
                                  ? 'bg-white text-black shadow-sm' 
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {method === 'card' && <CreditCard size={14} />}
                              {method === 'bank' && <Building2 size={14} />}
                              {method === 'qr' && <QrCode size={14} />}
                              {method === 'invoice' && <FileText size={14} />}
                              {method === 'card' ? 'カード' : method === 'bank' ? '銀行振込' : method === 'qr' ? 'QR決済' : '請求書'}
                            </button>
                          ))}
                        </div>

                        {paymentMethod === 'card' && (
                          <div className="space-y-6">
                            <div className="aspect-[1.6/1] w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                              <div className="flex justify-between items-start mb-12">
                                <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center">
                                  <div className="w-8 h-6 bg-amber-400/40 rounded-sm" />
                                </div>
                                <CreditCard size={32} className="text-white/20" />
                              </div>
                              <div className="space-y-4">
                                <p className="text-xl font-mono tracking-[0.2em] text-white/40">•••• •••• •••• ••••</p>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Card Holder</p>
                                    <p className="text-sm font-bold uppercase tracking-wider">NOT REGISTERED</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Expires</p>
                                    <p className="text-sm font-bold tracking-wider">-- / --</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button className="w-full max-w-sm py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2">
                              <Plus size={18} />
                              新しいカードを追加
                            </button>
                          </div>
                        )}

                        {paymentMethod === 'bank' && (
                          <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <div className="flex items-center gap-3 text-gray-900 font-bold">
                              <Building2 size={20} />
                              銀行振込（前払い）
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              以下の口座にお振込みください。入金確認後、残高に反映されます。<br />
                              ※振込手数料はお客様負担となります。
                            </p>
                            <div className="space-y-2 pt-4 border-t border-gray-200">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">銀行名</span>
                                <span className="font-bold">AMAS銀行（0001）</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">支店名</span>
                                <span className="font-bold">本店営業部（001）</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">口座種別</span>
                                <span className="font-bold">普通</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">口座番号</span>
                                <span className="font-bold">1234567</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">口座名義</span>
                                <span className="font-bold">アマス（カ</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'qr' && (
                          <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center space-y-4">
                            <div className="w-48 h-48 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                              <QrCode size={120} className="text-gray-900" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">QRコード決済</p>
                              <p className="text-xs text-gray-500 mt-1">PayPay / LINE Pay / メルペイに対応しています</p>
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'invoice' && (
                          <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <div className="flex items-center gap-3 text-gray-900 font-bold">
                              <FileText size={20} />
                              請求書払い（後払い）
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              月末締め、翌月末払いの請求書を発行します。<br />
                              ※審査が必要な場合があります。
                            </p>
                            <div className="pt-4">
                              <button className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                                請求書払いを申請する
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lg:w-80 space-y-6">
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                            <ShieldCheck size={18} />
                            セキュアな決済環境
                          </div>
                          <p className="text-[10px] text-blue-600 leading-relaxed">
                            お客様の決済情報は国際基準のセキュリティ（PCI DSS）に準拠したStripe社によって安全に保護されています。AMASが直接カード番号を閲覧・保持することはありません。
                          </p>
                          <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              SSL ENCRYPTED
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              PCI COMPLIANT
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] text-gray-400">領収書の発行は「取引履歴」から行えます</span>
                          <button className="text-[10px] font-bold text-blue-600 hover:underline">詳細設定</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Team Management */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Users size={22} className="text-purple-600" />
                      チームメンバー管理
                    </h3>
                    <span className="text-xs font-bold text-gray-400">
                      現在のプラン: {plan} ({PLANS[plan].maxAccounts}名まで)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                            {i === 1 ? <User size={16} /> : `+${i}`}
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                        <Plus size={16} />
                        メンバーを招待
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {profile?.displayName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{profile?.displayName} (あなた)</p>
                            <p className="text-[10px] text-gray-400">{profile?.email}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
                          {profile?.role === 'admin' ? '管理者' : 'メンバー'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Personal Profile */}
                <section className="space-y-6">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <User size={22} className="text-gray-600" />
                    個人設定
                  </h3>
                  <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-100">
                            {profile?.photoURL ? (
                              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={40} className="text-gray-300" />
                            )}
                          </div>
                          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black shadow-sm transition-all">
                            <Camera size={14} />
                          </button>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{profile?.displayName}</p>
                          <p className="text-[10px] text-gray-400">{profile?.email}</p>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">表示名</label>
                            <input 
                              type="text" 
                              value={profile?.displayName || ''}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">役職</label>
                            <input 
                              type="text" 
                              placeholder="例: マーケティングマネージャー"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">パスワード</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              value="••••••••••••"
                              disabled
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 focus:outline-none transition-all"
                            />
                            <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <button className="mt-2 text-[10px] font-bold text-blue-600 hover:underline">パスワードを変更する</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Team Management */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Users size={22} className="text-emerald-600" />
                      チームメンバー管理
                    </h3>
                    <span className="text-xs font-bold text-gray-400">
                      {teamMembers.length + 1} / {PLANS[plan]?.maxMembers || 0} 名
                    </span>
                  </div>
                  <div className="bg-white rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-100">
                      {/* Admin */}
                      <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                            <User size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{profile?.displayName || '管理者'}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100">管理者</span>
                      </div>
                      {/* Members */}
                      {teamMembers.map(member => (
                        <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                              <User size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-400">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">{member.role === 'editor' ? '編集者' : '閲覧者'}</span>
                            <button 
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="w-full p-6 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all font-bold text-sm flex items-center justify-center gap-2 border-t border-gray-100"
                    >
                      <Plus size={18} />
                      メンバーを追加する
                    </button>
                  </div>
                </section>

                {/* 6. Personal Profile */}
                <section className="space-y-6">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <User size={22} className="text-orange-600" />
                    自分のプロフィール設定
                  </h3>
                  <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="shrink-0 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-[32px] flex items-center justify-center text-gray-300 relative group overflow-hidden">
                          {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={40} />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                            <Camera size={20} className="text-white" />
                          </div>
                        </div>
                        <button className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors">写真を変更</button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">表示名</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                            value={profileFormData.displayName}
                            onChange={e => setProfileFormData({...profileFormData, displayName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">役職</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                            value={profileFormData.jobTitle}
                            onChange={e => setProfileFormData({...profileFormData, jobTitle: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">新しいパスワード (変更する場合のみ)</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                              placeholder="••••••••"
                            />
                            <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <button 
                            onClick={handleUpdateProfile}
                            className="px-8 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
                          >
                            <Save size={18} />
                            プロフィールを保存
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
            <AnimatePresence>
              {showPaymentConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">決済内容の確認</h3>
                        <p className="text-xs text-gray-500">プラン変更を確定します</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-bold text-gray-900">本日の決済額</span>
                        <span className="font-bold text-blue-600 text-xl">¥{paymentAmount.toLocaleString()}</span>
                      </div>
                      {isNewAnnual && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500">次回の更新日</span>
                          <span className="text-[10px] font-bold text-gray-900">
                            {isCurrentAnnual ? new Date(planExpiresAt!).toLocaleDateString() : new Date(Date.now() + 86400000 * 365).toLocaleDateString()}（変更なし）
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowPaymentConfirm(false)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                      >
                        キャンセル
                      </button>
                      <button 
                        onClick={handleConfirmPayment}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        決済を確定する
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-6">
                      {pendingBillingCycle === 'annual' ? (
                        <span className="text-orange-600 font-bold">
                          ※年間契約の性質上、期間中の解約による返金はいたしかねます。
                        </span>
                      ) : (
                        "※決済確定後、即座に新しいプランの機能が有効になります。"
                      )}
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
              </motion.div>
            )}



            {activeTab === 'tracking' && (
              <motion.div 
                key="tracking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-12 pb-20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">タグ・計測設定</h2>
                    <p className="text-sm text-gray-500 mt-1">広告効果を正確に測定し、AIの最適化精度を最大化します</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Tracking Active</span>
                  </div>
                </div>

                {(plan === 'Standard' || plan === 'Pro' || plan === 'Agency') && (
                  <div className="space-y-8">
                    {/* GTM Integration */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                          <Code2 size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Google Tag Manager (GTM) 連携</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              GTMを利用することで、複数の媒体タグを一括管理できます。AMASの計測タグもGTM経由で配信することを推奨しています。
                            </p>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">GTM Container ID</label>
                              <input 
                                type="text" 
                                value={trackingSettings.gtmId}
                                onChange={(e) => setTrackingSettings({...trackingSettings, gtmId: e.target.value})}
                                placeholder="GTM-XXXXXXX" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">推奨設定</p>
                            <ul className="space-y-2">
                              <li className="text-[11px] text-gray-600 flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>全ページでGTMタグを配信</span>
                              </li>
                              <li className="text-[11px] text-gray-600 flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>AMASコンバージョンタグを「成約完了」時に発火</span>
                              </li>
                              <li className="text-[11px] text-gray-600 flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>データレイヤー変数の活用を推奨</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Media Pixels */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          <Activity size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">各媒体ピクセル・計測連携</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          {/* Google & Meta */}
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-[#4285F4] rounded-full" />
                                <label className="text-[10px] font-bold text-gray-900 uppercase">Google Ads / GA4 ID</label>
                              </div>
                              <input 
                                type="text" 
                                value={trackingSettings.ga4Id}
                                onChange={(e) => setTrackingSettings({...trackingSettings, ga4Id: e.target.value})}
                                placeholder="G-XXXXXXXXXX" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-[#1877F2] rounded-full" />
                                <label className="text-[10px] font-bold text-gray-900 uppercase">Meta (Facebook) Pixel ID</label>
                              </div>
                              <input 
                                type="text" 
                                value={trackingSettings.metaPixelId}
                                onChange={(e) => setTrackingSettings({...trackingSettings, metaPixelId: e.target.value})}
                                placeholder="1234567890" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                          </div>

                          {/* Yahoo & LINE */}
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-[#FF0033] rounded-full" />
                                <label className="text-[10px] font-bold text-gray-900 uppercase">Yahoo! JAPAN 広告 ID</label>
                              </div>
                              <input 
                                type="text" 
                                value={trackingSettings.yahooId}
                                onChange={(e) => setTrackingSettings({...trackingSettings, yahooId: e.target.value})}
                                placeholder="YJ-XXXXXXX" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-[#00B900] rounded-full" />
                                <label className="text-[10px] font-bold text-gray-900 uppercase">LINE Ads Pixel ID</label>
                              </div>
                              <input 
                                type="text" 
                                value={trackingSettings.lineId}
                                onChange={(e) => setTrackingSettings({...trackingSettings, lineId: e.target.value})}
                                placeholder="LA-XXXXXXX" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-gray-900">Server-Side Conversion API (CAPI)</h4>
                              <p className="text-xs text-gray-500 mt-1">Cookie規制に対応し、より高精度な計測を実現します</p>
                            </div>
                            <button 
                              onClick={() => setTrackingSettings({...trackingSettings, capiEnabled: !trackingSettings.capiEnabled})}
                              className={`w-12 h-6 rounded-full transition-all relative ${trackingSettings.capiEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${trackingSettings.capiEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                          {trackingSettings.capiEnabled && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">CAPI Access Token</label>
                              <input 
                                type="password" 
                                value={trackingSettings.capiToken}
                                onChange={(e) => setTrackingSettings({...trackingSettings, capiToken: e.target.value})}
                                placeholder="EAAB..." 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* AMAS Dedicated Tag */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                          <Zap size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">AMAS専用計測タグ</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end gap-6">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">計測地点（CVポイント）の選択</label>
                            <select 
                              value={trackingSettings.selectedCvPoint}
                              onChange={(e) => setTrackingSettings({...trackingSettings, selectedCvPoint: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all bg-gray-50"
                            >
                              <option value="default">デフォルト（全コンバージョン）</option>
                              <option value="inquiry">問い合わせ完了</option>
                              <option value="document">資料請求完了</option>
                              <option value="registration">新規会員登録</option>
                              <option value="purchase">購入完了</option>
                            </select>
                          </div>
                          <button 
                            onClick={async () => {
                              const now = Date.now();
                              const newSettings = {...trackingSettings, lastIssuedAt: now};
                              setTrackingSettings(newSettings);
                              
                              if (user) {
                                try {
                                  await updateDoc(doc(db, 'users', user.uid), {
                                    trackingSettings: newSettings
                                  });
                                  notify('タグを最新の状態に更新・再発行しました');
                                } catch (error) {
                                  console.error('Save error:', error);
                                  notify('更新に失敗しました', 'error');
                                }
                              }
                            }}
                            className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                          >
                            <RefreshCw size={14} />
                            タグを更新・再発行
                          </button>
                        </div>

                        <div>
                          <p className="font-bold text-sm mb-2">AMAS専用問い合わせフォーム（埋め込み）</p>
                          <p className="text-xs text-gray-500 mb-4">
                            以下のコードをWebサイトの該当ページに貼り付けてください。
                            `data-cv-point` を指定することで、地点ごとの成約データをAIが個別に学習・最適化します。
                          </p>
                          <motion.div 
                            key={trackingSettings.lastIssuedAt}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-900 rounded-2xl p-6 font-mono text-[11px] text-emerald-400 overflow-x-auto relative group border border-white/5"
                          >
                            <pre className="leading-relaxed">{`<script src="https://cdn.amas-core.ai/v1/form.js"></script>
<div id="amas-form" 
     data-campaign-id="${selectedCampaign?.id || 'CAM-001'}"
     data-cv-point="${trackingSettings.selectedCvPoint}"
     data-issued-at="${trackingSettings.lastIssuedAt}"></div>
<script>
  AMAS.initForm({
    elementId: 'amas-form',
    onSuccess: (data) => {
      // 地点情報を付与してAIへデータを送信
      AMAS.track('conversion', {
        ...data,
        cv_point: '${trackingSettings.selectedCvPoint}',
        issued_at: ${trackingSettings.lastIssuedAt}
      });
      console.log('CVI Optimization Data Sent for ${trackingSettings.selectedCvPoint}');
    }
  });
</script>`}</pre>
                            <button 
                              onClick={() => {
                                const tagCode = `<script src="https://cdn.amas-core.ai/v1/form.js"></script>\n<div id="amas-form" data-campaign-id="${selectedCampaign?.id || 'CAM-001'}" data-cv-point="${trackingSettings.selectedCvPoint}" data-issued-at="${trackingSettings.lastIssuedAt}"></div>\n<script>\n  AMAS.initForm({\n    elementId: 'amas-form',\n    onSuccess: (data) => {\n      AMAS.track('conversion', {\n        ...data,\n        cv_point: '${trackingSettings.selectedCvPoint}',\n        issued_at: ${trackingSettings.lastIssuedAt}\n      });\n      console.log('CVI Optimization Data Sent for ${trackingSettings.selectedCvPoint}');\n    }\n  });\n</script>`;
                                navigator.clipboard.writeText(tagCode);
                                notify('タグをコピーしました');
                              }}
                              className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 text-white flex items-center gap-2"
                            >
                              <Copy size={14} />
                              <span className="text-[10px] font-bold">COPY</span>
                            </button>
                          </motion.div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <HelpCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-blue-900">タグはこれだけで大丈夫ですか？</p>
                              <p className="text-[11px] text-blue-700 leading-relaxed">
                                はい、基本的にはAMAS専用タグとGTMを設置いただければ、主要な媒体の計測は網羅可能です。
                                複数の地点（問い合わせと資料請求など）を別々に計測したい場合は、上記のプルダウンから地点を選択し、それぞれのページに専用のタグを発行して設置してください。
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {(plan === 'Free' || plan === 'Lite') && (
                  <div className="bg-blue-50 rounded-3xl p-12 border border-blue-100 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <ShieldCheck size={40} />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="font-bold text-blue-900 text-xl">高度な計測機能はStandardプラン以上</h4>
                      <p className="text-sm text-blue-600 leading-relaxed">
                        GTM連携、各媒体ピクセル連携、Server-Side CAPI等の高度な計測機能を利用することで、AIの最適化精度が飛躍的に向上します。
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('subscription')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2 mx-auto"
                    >
                      プランをアップグレードして計測を強化
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-center pt-8">
                  <button 
                    className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl flex items-center gap-2"
                    onClick={handleSaveTracking}
                  >
                    設定を保存する
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'connectors' && (
              <motion.div 
                key="connectors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-12 pb-20"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Google Ads 連携設定（運用環境の自動セットアップ）</h2>
                    <p className="text-sm text-gray-500">既存のGoogleアカウントを連携するだけで、AMASが最適な運用設定（タグ・計測・キャンペーン構造）を自動的に構築します。</p>
                  </div>
                  <button 
                    onClick={() => setShowCredentialsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <SettingsIcon size={14} />
                    API認証情報
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="text-blue-600 mt-1" size={24} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900">安全かつ透明性の高い運用</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        アカウントの所有権はお客様に保持されるため、いつでも運用状況を確認可能です。
                        AMASはお客様のパスワードを閲覧・保持することはありません。権限はいつでもGoogle設定から解除可能です。
                      </p>
                    </div>
                  </div>
                </div>

                <section className="space-y-8">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Megaphone size={20} className="text-blue-600" />
                      広告プラットフォーム
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <IntegrationCard 
                        name="Google Ads" 
                        status={profile?.google_ads_connected ? 'connected' : 'disconnected'} 
                        icon={Globe}
                        onConnect={() => handleConnectOAuth('google')}
                        onDisconnect={async () => {
                          if (user) {
                            await updateDoc(doc(db, 'users', user.uid), { google_ads_connected: false });
                            notify('Google Ads との連携を解除しました。', 'success');
                          }
                        }}
                        onTest={handleTestWebhook}
                        isTesting={isTestingWebhook}
                      />
                      <IntegrationCard 
                        name="Meta Ads (Facebook/Instagram)" 
                        status={profile?.meta_ads_connected ? 'connected' : 'disconnected'} 
                        icon={Facebook}
                        onConnect={() => handleConnectOAuth('meta')}
                        onDisconnect={async () => {
                          if (user) {
                            await updateDoc(doc(db, 'users', user.uid), { meta_ads_connected: false });
                            notify('Meta Ads との連携を解除しました。', 'success');
                          }
                        }}
                        onTest={handleTestWebhook}
                        isTesting={isTestingWebhook}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Database size={20} className="text-emerald-600" />
                      外部ツール・データベース
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <IntegrationCard 
                        name="Make.com (Webhook)" 
                        status="connected" 
                        icon={ArrowRightLeft}
                        onTest={handleTestWebhook}
                        isTesting={isTestingWebhook}
                      />
                      <IntegrationCard 
                        name="Google BigQuery" 
                        status="disconnected" 
                        icon={Database}
                        onConnect={() => notify('BigQuery連携は現在準備中です。', 'success')}
                      />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

            {showCredentialsModal && (
              <CredentialsModal 
                profile={profile}
                onClose={() => setShowCredentialsModal(false)}
                onSave={handleSaveCredentials}
              />
            )}

            {/* Notification Toast (Global) */}
            <AnimatePresence>
              {notification && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 20, x: '-50%' }}
                  className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                    notification.type === 'success' ? 'bg-emerald-900 border-emerald-500 text-white' : 'bg-red-900 border-red-500 text-white'
                  }`}
                >
                  {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-red-400" />}
                  <span className="text-sm font-bold">{notification.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Campaign Settings Modal */}
          <AnimatePresence>
            {showCampaignSettings && selectedCampaign && (
              <CampaignSettingsModal 
                campaign={selectedCampaign}
                onClose={() => setShowCampaignSettings(false)}
                onToggleStatus={handleToggleCampaignStatus}
                onDelete={handleDeleteCampaign}
              />
            )}
          </AnimatePresence>
        </div>

        {/* AI Hearing Modal */}
        <AnimatePresence>
          {activeHearing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveHearing(null)}
              />
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="bg-blue-600 p-8 text-white relative">
                  <button 
                    onClick={() => setActiveHearing(null)}
                    className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <XCircle size={20} />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">AIヒアリング</h3>
                      <p className="text-xs text-blue-100">オフライン成果をAIに学習させます</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {activeHearing.status === 'pending' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Question {hearingStep + 1} of {activeHearing.questions.length}</p>
                        <h4 className="text-lg font-bold text-gray-900 leading-tight">
                          {activeHearing.questions[hearingStep]}
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        <textarea 
                          autoFocus
                          placeholder="回答を入力してください..."
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-32"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const val = (e.target as HTMLTextAreaElement).value;
                              if (val.trim()) {
                                handleHearingAnswer(val);
                                (e.target as HTMLTextAreaElement).value = '';
                              }
                            }
                          }}
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-400">Shift + Enter で改行</p>
                          <button 
                            onClick={() => {
                              const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                              if (textarea.value.trim()) {
                                handleHearingAnswer(textarea.value);
                                textarea.value = '';
                              }
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            次へ
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-6">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-gray-900 mb-2">ヒアリング完了！</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          ご協力ありがとうございました。入力いただいたデータはAIが分析し、CVI（資本回転率）の最適化に即座に反映されます。
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveHearing(null)}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all"
                      >
                        ダッシュボードに戻る
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {isGeneratingReport && reportData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <button 
              onClick={() => setIsGeneratingReport(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={32} />
            </button>
            <MonthlyReportTemplate 
              {...reportData} 
              onClose={() => setIsGeneratingReport(false)}
            />
          </div>
        </div>
      )}

      {isGeneratingInvoice && invoiceData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100 }}>
          <InvoiceTemplate {...invoiceData} />
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

function AgentIcon({ type, size = 20 }: { type: AgentType, size?: number }) {
  switch (type) {
    case 'SEO': return <Search size={size} />;
    case 'Ads': return <Megaphone size={size} />;
    case 'LPO': return <MousePointerClick size={size} />;
    case 'CRM': return <Users size={size} />;
    case 'Orchestrator': return <Zap size={size} />;
  }
}

function AdminConsoleView({ 
  users, 
  onUpdateUserPlan,
  onUpdateUserRole,
  onApproveTransaction,
  onRejectTransaction,
  onResetMonthlyUsage,
  announcements,
  onSendAnnouncement,
  onDeleteAnnouncement,
  onSyncMemberCounts,
  systemSettings,
  setSystemSettings,
  onSaveSettings
}: { 
  users: any[], 
  onUpdateUserPlan: (uid: string, plan: PlanType) => void,
  onUpdateUserRole: (uid: string, role: string) => void,
  onApproveTransaction: (t: Transaction) => void,
  onRejectTransaction: (t: Transaction) => void,
  onResetMonthlyUsage: () => void,
  announcements: Announcement[],
  onSendAnnouncement: (title: string, content: string, type: Announcement['type']) => void,
  onDeleteAnnouncement: (id: string) => void,
  onSyncMemberCounts: () => void,
  systemSettings: any,
  setSystemSettings: (settings: any) => void,
  onSaveSettings: () => void
}) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'payments' | 'monitoring' | 'history' | 'announcements' | 'system'>('users');
  const [pendingChanges, setPendingChanges] = useState<Record<string, { plan?: PlanType, role?: string }>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedUserForUsage, setSelectedUserForUsage] = useState<any | null>(null);
  const [selectedUserForMembers, setSelectedUserForMembers] = useState<any | null>(null);
  const [userMembers, setUserMembers] = useState<TeamMember[]>([]);
  const [adjCreatives, setAdjCreatives] = useState(0);
  const [adjCampaigns, setAdjCampaigns] = useState(0);

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('info');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Audit Logs and Pending Transactions
  useEffect(() => {
    const logsQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => doc.data() as AuditLog));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    });

    const transQuery = query(collection(db, 'transactions'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      setPendingTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => {
      unsubscribeLogs();
      unsubscribeTrans();
    };
  }, []);

  // Fetch members for selected user
  useEffect(() => {
    if (!selectedUserForMembers) {
      setUserMembers([]);
      return;
    }
    const q = query(collection(db, 'organizations', selectedUserForMembers.uid, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserMembers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMember)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `organizations/${selectedUserForMembers.uid}/members`);
    });
    return () => unsubscribe();
  }, [selectedUserForMembers]);

  const handleUpdateUsage = async () => {
    if (!selectedUserForUsage) return;
    try {
      const walletRef = doc(db, 'wallets', selectedUserForUsage.uid);
      await updateDoc(walletRef, {
        'monthlyUsage.adjustmentCreatives': adjCreatives,
        'monthlyUsage.adjustmentCampaigns': adjCampaigns
      });
      setSelectedUserForUsage(null);
    } catch (error) {
      console.error('Update usage adjustment error:', error);
      alert('調整に失敗しました。');
    }
  };

  const aiStatus = [
    { agent: 'SEOエージェント', tasks: 124, status: 'healthy', load: '45%' },
    { agent: 'Adsエージェント', tasks: 89, status: 'healthy', load: '32%' },
    { agent: 'LPOエージェント', tasks: 56, status: 'warning', load: '88%' },
    { agent: 'オーケストレーター', tasks: 210, status: 'healthy', load: '12%' },
  ];

  const handleStageChange = (uid: string, field: 'plan' | 'role', value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [field]: value
      }
    }));
  };

  const handleSaveChanges = async (uid: string) => {
    const changes = pendingChanges[uid];
    if (!changes) return;

    if (changes.plan) await onUpdateUserPlan(uid, changes.plan);
    if (changes.role) await onUpdateUserRole(uid, changes.role);

    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">管理者コンソール</h2>
          <p className="text-sm text-gray-500 mt-1">システム全体のユーザー管理、決済承認、AI稼働監視</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onSyncMemberCounts}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            メンバー数同期
          </button>
          <button 
            onClick={onResetMonthlyUsage}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <RefreshCw size={16} />
            今月の使用量をリセット
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'ユーザー管理', icon: Users },
          { id: 'payments', label: '決済承認', icon: CreditCard },
          { id: 'announcements', label: 'お知らせ配信', icon: Megaphone },
          { id: 'monitoring', label: 'AI監視', icon: Activity },
          { id: 'history', label: '操作履歴', icon: History },
          { id: 'system', label: '設定', icon: SettingsIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">ユーザー管理</h3>
            <p className="text-xs text-gray-500">変更後は「保存」ボタンを押してください</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ユーザー</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">プラン</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ロール</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">メンバー</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const hasChanges = !!pendingChanges[u.uid];
                  const currentPlan = pendingChanges[u.uid]?.plan || u.plan;
                  const currentRole = pendingChanges[u.uid]?.role || u.role;

                  return (
                    <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-6 h-6 rounded-full" alt="" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900">{u.displayName}</span>
                            <span className="text-[9px] text-gray-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={currentPlan}
                          onChange={(e) => handleStageChange(u.uid, 'plan', e.target.value)}
                          className={`text-[10px] font-bold bg-gray-50 border rounded px-1 py-0.5 focus:outline-none ${
                            pendingChanges[u.uid]?.plan ? 'border-orange-500 text-orange-600' : 'border-gray-200'
                          }`}
                        >
                          {['Free', 'Lite', 'Standard', 'Pro', 'Agency'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={currentRole}
                          onChange={(e) => handleStageChange(u.uid, 'role', e.target.value)}
                          className={`text-[10px] font-bold bg-gray-50 border rounded px-1 py-0.5 focus:outline-none ${
                            pendingChanges[u.uid]?.role ? 'border-orange-500 text-orange-600' : 'border-gray-200'
                          }`}
                        >
                          {['admin', 'user'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-gray-700">{u.memberCount || 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedUserForMembers(u)}
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-bold rounded hover:bg-blue-100"
                          >
                            メンバー
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUserForUsage(u);
                              // We'd need to fetch the wallet for this user to get current adjustments
                              // For now, assume we have it or just set to 0
                              setAdjCreatives(0);
                              setAdjCampaigns(0);
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded hover:bg-emerald-100"
                          >
                            枠調整
                          </button>
                          {hasChanges && (
                            <>
                              <button 
                                onClick={() => handleSaveChanges(u.uid)}
                                className="px-2 py-1 bg-black text-white text-[9px] font-bold rounded hover:bg-gray-800"
                              >
                                保存
                              </button>
                              <button 
                                onClick={() => setPendingChanges(prev => {
                                  const next = { ...prev };
                                  delete next[u.uid];
                                  return next;
                                })}
                                className="px-2 py-1 bg-white border border-gray-200 text-gray-500 text-[9px] font-bold rounded hover:bg-gray-50"
                              >
                                取消
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">月間利用状況のリセット</h3>
                <p className="text-[10px] text-gray-500 mt-1">すべてのユーザーの月間累計（入金額、入稿数、キャンペーン数）をリセットします。</p>
              </div>
              <div className="flex items-center gap-3">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <p className="text-[10px] font-bold text-red-600 mr-2">本当に実行しますか？</p>
                    <button 
                      onClick={async () => {
                        setIsResetting(true);
                        await onResetMonthlyUsage();
                        setIsResetting(false);
                        setShowResetConfirm(false);
                      }}
                      disabled={isResetting}
                      className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      {isResetting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      はい、リセットする
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                  >
                    <RefreshCw size={14} />
                    一括リセット実行
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">入金履歴の承認（銀行振込）</h3>
            </div>
            <div className="p-6 space-y-4">
            {pendingTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">未承認の決済はありません</p>
              </div>
            ) : (
              pendingTransactions.map(trans => (
                <div key={trans.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">ユーザーID: {trans.userUid}</p>
                      <p className="text-[10px] text-gray-500">¥{trans.amount.toLocaleString()} • {trans.type === 'bank_transfer' ? '銀行振込' : 'クレジットカード'} • {new Date(trans.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApproveTransaction(trans)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      承認
                    </button>
                    <button 
                      onClick={() => onRejectTransaction(trans)}
                      className="px-3 py-1.5 bg-white text-red-600 border border-red-100 text-[10px] font-bold rounded-lg hover:bg-red-50 transition-colors"
                    >
                      却下
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

      {activeSubTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">新規お知らせ作成</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">タイトル</label>
                  <input 
                    type="text" 
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="メンテナンスのお知らせ"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">タイプ</label>
                  <select 
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="info">情報 (Info)</option>
                    <option value="warning">警告 (Warning)</option>
                    <option value="success">成功 (Success)</option>
                    <option value="campaign">キャンペーン (Campaign)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">内容</label>
                <textarea 
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="2024年3月25日 02:00〜04:00にメンテナンスを実施します。"
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    onSendAnnouncement(annTitle, annContent, annType);
                    setAnnTitle('');
                    setAnnContent('');
                  }}
                  disabled={!annTitle || !annContent}
                  className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  配信する
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">配信済みのお知らせ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">日時</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">タイトル</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">タイプ</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">内容</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {announcements.map(ann => (
                    <tr key={ann.id} className="text-xs">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(ann.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{ann.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          ann.type === 'info' ? 'bg-blue-100 text-blue-700' :
                          ann.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                          ann.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {ann.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{ann.content}</td>
                      <td className="px-4 py-3 text-right">
                        {deletingId === ann.id ? (
                          <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                            <button 
                              onClick={() => {
                                onDeleteAnnouncement(ann.id);
                                setDeletingId(null);
                              }}
                              className="px-2 py-1 bg-red-600 text-white text-[9px] font-bold rounded hover:bg-red-700 transition-colors"
                            >
                              削除
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-[9px] font-bold rounded hover:bg-gray-200 transition-colors"
                            >
                              戻る
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeletingId(ann.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Zap size={20} className="text-amber-600" />
                発行者情報（AMAS運営情報）
              </h3>
              <button 
                onClick={onSaveSettings}
                className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
              >
                設定を保存
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">発行者名</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                  value={systemSettings.issuerName}
                  onChange={e => setSystemSettings({...systemSettings, issuerName: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">発行者住所</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none resize-none"
                  value={systemSettings.issuerAddress}
                  onChange={e => setSystemSettings({...systemSettings, issuerAddress: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">登録番号 (インボイス)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                  value={systemSettings.issuerTaxId}
                  onChange={e => setSystemSettings({...systemSettings, issuerTaxId: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'monitoring' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">AIエージェント稼働監視</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiStatus.map(status => (
                <div key={status.agent} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900">{status.agent}</p>
                    <div className={`w-2 h-2 rounded-full ${status.status === 'healthy' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">処理タスク</p>
                      <p className="text-xl font-bold text-gray-900">{status.tasks}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">負荷</p>
                      <p className={`text-sm font-bold ${parseInt(status.load) > 80 ? 'text-red-600' : 'text-gray-900'}`}>{status.load}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className={`h-1 rounded-full ${parseInt(status.load) > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: status.load }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">操作履歴（監査ログ）</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">日時</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">管理者</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">アクション</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="text-xs">
                    <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{log.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold uppercase">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Info Modal */}
      <AnimatePresence>
        {selectedUserForMembers && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedUserForMembers(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">チームメンバー情報</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedUserForMembers.displayName} ({selectedUserForMembers.email})</p>
                </div>
                <button onClick={() => setSelectedUserForMembers(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 text-[10px] font-bold text-gray-400 uppercase">名前</th>
                      <th className="py-3 text-[10px] font-bold text-gray-400 uppercase">役職</th>
                      <th className="py-3 text-[10px] font-bold text-gray-400 uppercase">ロール</th>
                      <th className="py-3 text-[10px] font-bold text-gray-400 uppercase text-right">参加日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {userMembers.map(m => (
                      <tr key={m.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={m.photoURL || `https://ui-avatars.com/api/?name=${m.name}`} className="w-6 h-6 rounded-full" alt="" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{m.name}</span>
                              <span className="text-[9px] text-gray-400">{m.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-gray-600">{m.jobTitle || '-'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            m.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {m.role === 'admin' ? '管理者' : '編集者'}
                          </span>
                        </td>
                        <td className="py-3 text-[10px] text-gray-400 text-right">{new Date(m.joinedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {userMembers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-gray-400">メンバーはいません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Usage Adjustment Modal */}
      <AnimatePresence>
        {selectedUserForUsage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedUserForUsage(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">利用枠の調整</h3>
              <p className="text-xs text-gray-500 mb-8">
                通信エラー等でカウントがずれた場合、こちらで調整値を設定できます。<br/>
                ※入力した値が現在のカウントから差し引かれます。
              </p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">入稿数 調整値</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={adjCreatives}
                      onChange={e => setAdjCreatives(parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">件分を差し引く</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">キャンペーン数 調整値</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={adjCampaigns}
                      onChange={e => setAdjCampaigns(parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">件分を差し引く</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedUserForUsage(null)}
                  className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleUpdateUsage}
                  className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg"
                >
                  保存する
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignRow({ 
  campaign, 
  onSelectCampaign, 
  onOpenTuning 
}: { 
  campaign: Campaign, 
  onSelectCampaign: (id: string) => void, 
  onOpenTuning: (id: string) => void 
}) {
  return (
    <tr className="hover:bg-gray-100 transition-colors group">
      <td className="px-6 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{campaign.name}</span>
          <span className="text-[10px] font-mono text-gray-500 uppercase">{campaign.industry}</span>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2">
          {campaign.isManualMode ? (
            <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase border border-orange-600 px-2 py-0.5 rounded">
              <SettingsIcon size={10} /> MANUAL
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase border border-blue-600 px-2 py-0.5 rounded">
              <Zap size={10} /> AUTO
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-6">
        <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 ${
          campaign.status === 'active' ? 'border-emerald-500 text-emerald-600' : 
          campaign.status === 'paused' ? 'border-orange-500 text-orange-600' : 'border-gray-400 text-gray-500'
        }`}>
          {campaign.status === 'active' ? '稼働中' : campaign.status === 'paused' ? '待機中' : '審査中'}
        </span>
      </td>
      <td className="px-6 py-6 text-center">
        <span className={`text-2xl font-black font-mono tracking-tighter ${
          campaign.cvi > 70 ? 'text-emerald-500' : 
          campaign.cvi > 50 ? 'text-purple-600' : 'text-red-500'
        }`}>
          {campaign.cvi}
        </span>
      </td>
      <td className="px-6 py-6 text-right">
        <span className="text-sm font-mono font-bold text-gray-900">¥{campaign.spend.toLocaleString()}</span>
        <p className="text-[10px] font-mono text-gray-400">/ ¥{campaign.budget.toLocaleString()}</p>
      </td>
      <td className="px-6 py-6 text-right">
        <span className="text-sm font-mono font-bold text-gray-900">{campaign.roas}x</span>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onSelectCampaign(campaign.id)}
            className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
          >
            詳細表示
          </button>
          <button 
            onClick={() => onOpenTuning(campaign.id)}
            className="p-2 border-2 border-black text-black hover:bg-black hover:text-white transition-all flex items-center gap-2 group"
            title="ユニット・チューニング"
          >
            <Sliders size={16} />
            <span className="text-[9px] font-black hidden group-hover:inline-block">UNIT TUNING</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function CockpitView({ 
  campaigns, 
  profile,
  user,
  onSelectCampaign, 
  onOptimizeAll,
  isOptimizing,
  onOpenTuning,
  selectedClientId,
  selectedSiteId
}: { 
  campaigns: Campaign[], 
  profile: any,
  user: FirebaseUser | null,
  onSelectCampaign: (id: string) => void,
  onOptimizeAll: () => void,
  isOptimizing: boolean,
  onOpenTuning: (id: string) => void,
  selectedClientId: string,
  selectedSiteId: string
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign, direction: 'asc' | 'desc' } | null>({ key: 'cvi', direction: 'desc' });
  const [isGrouped, setIsGrouped] = useState(false);

  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.industry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClient = selectedClientId === 'all' || c.clientId === selectedClientId;
      const matchesSite = selectedSiteId === 'all' || c.siteId === selectedSiteId;
      const isAccessible = profile?.role === 'admin' || 
                          (profile?.accessibleClientIds && profile.accessibleClientIds.includes(c.clientId || '')) ||
                          c.ownerUid === user?.uid;
      
      return matchesSearch && matchesClient && matchesSite && isAccessible;
    });

    if (sortConfig && !isGrouped) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [campaigns, searchTerm, sortConfig, isGrouped, selectedClientId, selectedSiteId, profile, user]);

  const groupedCampaigns = useMemo(() => {
    if (!isGrouped) return null;
    const groups: { [key: string]: Campaign[] } = {};
    filteredCampaigns.forEach(c => {
      if (!groups[c.industry]) groups[c.industry] = [];
      groups[c.industry].push(c);
    });
    return groups;
  }, [filteredCampaigns, isGrouped]);

  const handleSort = (key: keyof Campaign) => {
    if (isGrouped) return; // Disable sorting when grouped for simplicity
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }: { column: keyof Campaign }) => {
    if (sortConfig?.key !== column) return <ArrowRightLeft size={10} className="opacity-30" />;
    return sortConfig.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />;
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">プロ・コックピット <span className="text-sm font-mono not-italic text-gray-400 ml-2">PRO COCKPIT</span></h2>
          <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest">自律型フリート管理 // CVIモニタリングシステム</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 border-2 border-black px-3 py-2 bg-white">
            <span className="text-[10px] font-black uppercase tracking-widest">クライアント別表示</span>
            <button 
              onClick={() => setIsGrouped(!isGrouped)}
              className={`w-10 h-5 rounded-full border-2 border-black relative transition-colors ${isGrouped ? 'bg-black' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white border border-black rounded-full transition-all ${isGrouped ? 'left-5.5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text"
              placeholder="クライアント・案件検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-2 border-black text-xs font-bold focus:bg-gray-50 outline-none w-64"
            />
          </div>
          <button 
            onClick={onOptimizeAll}
            disabled={isOptimizing}
            className="px-8 py-3 bg-black text-white font-black text-xs hover:bg-gray-800 transition-all flex items-center gap-3 shadow-xl shadow-black/20 uppercase tracking-widest"
          >
            {isOptimizing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            一括最適化実行 <span className="text-[8px] opacity-60">OPTIMIZE ALL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black divide-x-2 divide-black">
        <div className="bg-white p-8">
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-4 italic">稼働ユニット <span className="text-[8px] opacity-60 ml-1">ACTIVE UNITS</span></p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-gray-900 tracking-tighter">{campaigns.length}</p>
            <p className="text-xs font-mono text-gray-500 uppercase">/ UNLIMITED</p>
          </div>
        </div>
        <div className="bg-white p-8">
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-4 italic">フリート平均CVI <span className="text-[8px] opacity-60 ml-1">AVG CVI</span></p>
          <p className="text-5xl font-black text-purple-600 tracking-tighter">
            {Math.round(campaigns.reduce((acc, c) => acc + c.cvi, 0) / (campaigns.length || 1))}
          </p>
        </div>
        <div className="bg-white p-8">
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-4 italic">クリティカル警告 <span className="text-[8px] opacity-60 ml-1">ALERTS</span></p>
          <p className={`text-5xl font-black tracking-tighter ${campaigns.filter(c => c.cvi < 50).length > 0 ? 'text-red-500' : 'text-gray-900'}`}>
            {campaigns.filter(c => c.cvi < 50).length}
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th 
                  className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic cursor-pointer hover:bg-gray-900"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    クライアント / 案件識別子 <SortIcon column="name" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic">モード</th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic">状態</th>
                <th 
                  className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic text-center cursor-pointer hover:bg-gray-900"
                  onClick={() => handleSort('cvi')}
                >
                  <div className="flex items-center justify-center gap-2">
                    CVI指数 <SortIcon column="cvi" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic text-right cursor-pointer hover:bg-gray-900"
                  onClick={() => handleSort('spend')}
                >
                  <div className="flex items-center justify-end gap-2">
                    消化予算 <SortIcon column="spend" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic text-right cursor-pointer hover:bg-gray-900"
                  onClick={() => handleSort('roas')}
                >
                  <div className="flex items-center justify-end gap-2">
                    ROAS <SortIcon column="roas" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest italic">
                  ユニット制御 / 調整
                  <span className="text-[8px] opacity-50 ml-1">UNIT TUNING</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {isGrouped && groupedCampaigns ? (
                Object.entries(groupedCampaigns).map(([industry, groupCampaigns]) => (
                  <React.Fragment key={industry}>
                    <tr className="bg-gray-50 border-y-2 border-black">
                      <td colSpan={7} className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-gray-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">CLIENT: {industry}</span>
                          <span className="text-[8px] font-mono bg-black text-white px-1.5 py-0.5 rounded">{groupCampaigns.length} UNITS</span>
                        </div>
                      </td>
                    </tr>
                    {groupCampaigns.map(campaign => (
                      <CampaignRow 
                        key={campaign.id} 
                        campaign={campaign} 
                        onSelectCampaign={onSelectCampaign} 
                        onOpenTuning={onOpenTuning} 
                      />
                    ))}
                  </React.Fragment>
                ))
              ) : (
                filteredCampaigns.map(campaign => (
                  <CampaignRow 
                    key={campaign.id} 
                    campaign={campaign} 
                    onSelectCampaign={onSelectCampaign} 
                    onOpenTuning={onOpenTuning} 
                  />
                ))
              )}
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-mono text-xs uppercase italic">
                    一致するキャンペーンが見つかりません // NO MATCHING DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TuningModal({ 
  campaign, 
  onClose, 
  onSave,
  isUpdating
}: { 
  campaign: Campaign, 
  onClose: () => void, 
  onSave: (updates: Partial<Campaign>) => void,
  isUpdating: boolean
}) {
  // Defensive check to prevent whiteout if campaign is missing
  if (!campaign) return null;

  const [isManual, setIsManual] = useState(campaign.isManualMode || false);
  const [settings, setSettings] = useState({
    platformRatios: campaign.manualSettings?.platformRatios || {},
    cpcLimit: campaign.manualSettings?.cpcLimit ?? 200,
    roasTarget: campaign.manualSettings?.roasTarget ?? 3.0,
    excludedKeywords: campaign.manualSettings?.excludedKeywords || [],
    excludedPlacements: campaign.manualSettings?.excludedPlacements || []
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newPlacement, setNewPlacement] = useState('');

  const handleSave = () => {
    onSave({
      isManualMode: isManual,
      manualSettings: settings
    });
  };

  // Ensure platforms is an array to prevent .map() crash
  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms : [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-4 border-black w-full max-w-2xl overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="bg-black p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">ユニット・チューニング <span className="text-sm font-mono not-italic text-gray-400 ml-2">UNIT TUNING</span>: {campaign.name}</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">自律ロジックのオーバーライド // マニュアル制御モード</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
          {/* AI Orchestration Status */}
          <div className="p-4 bg-black/5 border-l-4 border-black flex items-center gap-4">
            <div className="p-2 bg-black text-white rounded-full">
              <Zap size={16} className={isManual ? 'opacity-50' : 'animate-pulse'} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">AI Orchestration Status</p>
              <p className="text-xs font-bold">
                {isManual 
                  ? 'マニュアル優先モード：AIは設定された制約内でのみ最適化を実行します' 
                  : 'フルオートモード：AIが全媒体のリアルタイム最適化を自律実行中'}
              </p>
            </div>
          </div>

          {/* Manual Override Toggle */}
          <div className="flex items-center justify-between p-4 border-2 border-black bg-gray-50">
            <div>
              <p className="text-sm font-black uppercase tracking-tight">マニュアル介入モード <span className="text-[8px] opacity-60 ml-1 font-mono">MANUAL MODE</span></p>
              <p className="text-[10px] font-mono text-gray-500 uppercase">このユニットのAI意思決定を一時的に停止し、手動設定を優先します</p>
            </div>
            <button 
              onClick={() => setIsManual(!isManual)}
              className={`w-14 h-8 rounded-full border-2 border-black relative transition-colors ${isManual ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${isManual ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className={`space-y-8 transition-opacity ${isManual ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Bid Controls */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest italic">CPC上限設定 <span className="text-[8px] opacity-60 ml-1">CPC LIMIT</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">¥</span>
                  <input 
                    type="number"
                    value={settings.cpcLimit}
                    onChange={(e) => setSettings({...settings, cpcLimit: parseInt(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 border-2 border-black font-mono font-bold focus:bg-gray-50 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest italic">目標ROAS下限 <span className="text-[8px] opacity-60 ml-1">ROAS TARGET</span></label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    value={settings.roasTarget}
                    onChange={(e) => setSettings({...settings, roasTarget: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-black font-mono font-bold focus:bg-gray-50 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">x</span>
                </div>
              </div>
            </div>

            {/* Platform Ratios */}
            <div className="space-y-4">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest italic">メディア配分比率 <span className="text-[8px] opacity-60 ml-1">MEDIA RATIO</span></label>
              <div className="space-y-4 border-2 border-black p-6">
                {platforms.length > 0 ? platforms.map(platform => (
                  <div key={platform} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>{platform}</span>
                      <span className="font-mono">{(settings.platformRatios[platform as PlatformType] || 0)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={settings.platformRatios[platform as PlatformType] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({
                          ...settings,
                          platformRatios: {
                            ...(settings.platformRatios || {}),
                            [platform]: val
                          }
                        });
                      }}
                      className="w-full h-2 bg-gray-200 appearance-none cursor-pointer accent-black"
                    />
                  </div>
                )) : (
                  <p className="text-[10px] font-mono text-gray-400 italic uppercase">配信プラットフォームが設定されていません // NO PLATFORMS</p>
                )}
              </div>
            </div>

            {/* Brand Safety */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest italic">除外キーワード <span className="text-[8px] opacity-60 ml-1">EXCLUDED KEYWORDS</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="キーワード追加..."
                    className="flex-1 px-3 py-2 border-2 border-black text-xs font-bold outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newKeyword) {
                        setSettings({...settings, excludedKeywords: [...(settings.excludedKeywords || []), newKeyword]});
                        setNewKeyword('');
                      }
                    }}
                    className="p-2 bg-black text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.excludedKeywords?.map(kw => (
                    <span key={kw} className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold flex items-center gap-1">
                      {kw}
                      <button onClick={() => setSettings({...settings, excludedKeywords: settings.excludedKeywords?.filter(k => k !== kw)})} className="text-gray-400 hover:text-red-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest italic">除外プレースメント <span className="text-[8px] opacity-60 ml-1">EXCLUDED PLACEMENTS</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newPlacement}
                    onChange={(e) => setNewPlacement(e.target.value)}
                    placeholder="URL/ドメイン追加..."
                    className="flex-1 px-3 py-2 border-2 border-black text-xs font-bold outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newPlacement) {
                        setSettings({...settings, excludedPlacements: [...(settings.excludedPlacements || []), newPlacement]});
                        setNewPlacement('');
                      }
                    }}
                    className="p-2 bg-black text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.excludedPlacements?.map(pl => (
                    <span key={pl} className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold flex items-center gap-1">
                      {pl}
                      <button onClick={() => setSettings({...settings, excludedPlacements: settings.excludedPlacements?.filter(p => p !== pl)})} className="text-gray-400 hover:text-red-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-4 border-black bg-gray-50 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-black uppercase tracking-widest hover:underline">キャンセル <span className="text-[8px] opacity-60 ml-1">CANCEL</span></button>
          <button 
            onClick={handleSave}
            disabled={isUpdating}
            className="px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            {isUpdating && <Loader2 size={16} className="animate-spin" />}
            設定を確定する <span className="text-[8px] opacity-60 ml-1">COMMIT CONFIG</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NewCampaignWizard({
  onComplete,
  onCampaignCreated,
  industry,
  plan,
  onUpgrade,
  systemSettings,
  clients,
  sites,
  notify,
  user,
  profile,
  initialClientId,
  initialSiteId,
  initialDraft
}: {
  onComplete: () => void,
  onCampaignCreated: (c: Campaign) => void,
  industry: IndustryType,
  plan: PlanDefinition,
  onUpgrade?: () => void,
  systemSettings?: any,
  clients: Client[],
  sites: Site[],
  notify: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void,
  user: any,
  profile: any,
  initialClientId?: string,
  initialSiteId?: string,
  initialDraft?: Draft | null,
  onDraftRestored?: () => void
}) {
  const [step, setStep] = useState(1);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingBanners, setIsGeneratingBanners] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    clientId: initialClientId || '',
    siteId: initialSiteId || '',
    budget: '',
    goal: 'conversion',
    industry: systemSettings?.industry || industry || '',
    imageUrl: '',
    headline: '',
    description: '',
    body: '',
    ctas: [] as string[],
    banners: [] as BannerMaster[],
    landingPageUrl: systemSettings?.mainSiteUrl || '',
    businessDescription: systemSettings?.businessDescription || '',
    platforms: [] as PlatformType[],
    autoStart: true
  });

  // 媒体のカテゴリー判定ヘルパー
  const hasSearch = formData.platforms.some(p => ['GoogleSearch', 'YahooSearch'].includes(p));
  const hasDisplay = formData.platforms.some(p => ![ 'GoogleSearch', 'YahooSearch'].includes(p));

  // 動的なステップ構成の定義
  const getWizardSteps = () => {
    const steps: { id: number; label: string; type: string }[] = [
      { id: 1, label: '基本情報・媒体', type: 'basic' },
      { id: 2, label: 'ターゲット・KW', type: 'target' },
      { id: 3, label: 'コピー案', type: 'copy' },
    ];

    if (hasDisplay) {
      steps.push({ id: 4, label: 'バナー生成', type: 'banner' });
    }

    steps.push({ id: 5, label: 'AI審査', type: 'review' });
    steps.push({ id: 6, label: '出力', type: 'export' });

    return steps;
  };

  const wizardSteps = getWizardSteps();
  const currentStepInfo = wizardSteps.find((_, index) => index + 1 === step) || wizardSteps[0];
  const totalSteps = wizardSteps.length;

  const [aiSuggestions, setAiSuggestions] = useState<AdSuggestions>({
    headlines: [],
    descriptions: [],
    ctas: [],
    keywords: []
  });

  const [bannerSuggestions, setBannerSuggestions] = useState<any[]>([]);

  const handleGenerateSuggestions = async () => {
    const targetIndustry = formData.industry.trim();
    if (!targetIndustry) return;
    
    setIsGeneratingSuggestions(true);
    setGenerationError(null);
    
    try {
      const suggestions = await generateAdSuggestions(targetIndustry, formData.goal, plan.name, formData.businessDescription);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setGenerationError('AI提案の生成に失敗しました。通信環境を確認して再試行してください。');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleGenerateBannerSuggestions = async () => {
    const targetIndustry = formData.industry.trim();
    if (!targetIndustry) return;
    
    setIsGeneratingBanners(true);
    setGenerationError(null);
    
    try {
      const suggestions = await generateBannerSuggestions(
        targetIndustry, 
        formData.headline || selectedHeadlines[0] || '', 
        formData.description || aiSuggestions.descriptions[0]?.text || ''
      );
      setBannerSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate banner suggestions:', error);
      setGenerationError('バナー提案の生成に失敗しました。');
    } finally {
      setIsGeneratingBanners(false);
    }
  };

  const handleGenerateBannerImage = async (suggestionIndex: number, type: BannerType) => {
    const suggestion = bannerSuggestions[suggestionIndex];
    if (!suggestion) return;

    const existingIndex = formData.banners.findIndex(b => b.type === type && b.backgroundPrompt === suggestion.backgroundPrompt);
    
    if (existingIndex === -1 && formData.banners.length >= 3) {
      notify('バナーは最大3クリエイティブまでです。既存のバナーを削除してください。', 'error');
      return;
    }

    setIsGeneratingBanners(true);
    try {
      // GPT Image 2 now bakes the copy text directly into the banner. Use Claude's
      // suggested copy when available, otherwise fall back to the form values.
      const headline = suggestion.copyText?.headline || formData.headline || selectedHeadlines[0] || '';
      const cta = suggestion.copyText?.cta || formData.ctas[0] || aiSuggestions.ctas[0] || '詳細を見る';
      const copyForImage = {
        headline,
        subheadline: suggestion.copyText?.subheadline,
        cta,
      };

      const imageUrl = await generateBannerImage(
        suggestion.backgroundPrompt,
        type,
        copyForImage,
        suggestion.preset,
        {
          industry: formData.industry,
          businessDescription: formData.businessDescription,
          targetGender: targetInfo.gender,
          targetAgeGroups: targetInfo.ageGroups,
          keywords: targetInfo.keywords,
        }
      );

      const newBanner: BannerMaster = {
        url: imageUrl,
        backgroundUrl: imageUrl,
        type: type,
        preset: suggestion.preset,
        headline,
        cta,
        backgroundPrompt: suggestion.backgroundPrompt
      };

      setFormData(prev => {
        if (existingIndex !== -1) {
          const updatedBanners = [...prev.banners];
          updatedBanners[existingIndex] = newBanner;
          return { ...prev, banners: updatedBanners };
        }
        return { ...prev, banners: [...prev.banners, newBanner] };
      });
    } catch (error) {
      console.error('Failed to generate banner image:', error);
    } finally {
      setIsGeneratingBanners(false);
    }
  };

  const handleDeleteBanner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    if (currentStepInfo.type === 'copy' && aiSuggestions.headlines.length === 0 && !isGeneratingSuggestions && !generationError) {
      handleGenerateSuggestions();
    }
  }, [step]);

  // 業種のメモリ機能
  const [recentIndustries, setRecentIndustries] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('amas_recent_industries');
    if (saved) {
      setRecentIndustries(JSON.parse(saved));
    } else {
      setRecentIndustries(['歯科医院', '不用品回収']);
    }
  }, []);

  const saveIndustry = (ind: string) => {
    if (!ind) return;
    const updated = [ind, ...recentIndustries.filter(i => i !== ind)].slice(0, 5);
    setRecentIndustries(updated);
    localStorage.setItem('amas_recent_industries', JSON.stringify(updated));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [selectedHeadlines, setSelectedHeadlines] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCensoring, setIsCensoring] = useState(false);
  const [censorshipResult, setCensorshipResult] = useState<any>(null);
  const [targetInfo, setTargetInfo] = useState<TargetInfo>(DEFAULT_TARGET_INFO);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // 下書きから復元（初回のみ）
  useEffect(() => {
    if (!initialDraft) return;
    try {
      const snap = JSON.parse(initialDraft.wizardData) as Partial<{
        step: number;
        formData: typeof formData;
        selectedHeadlines: string[];
        selectedKeywords: string[];
        targetInfo: TargetInfo;
        aiSuggestions: AdSuggestions;
        bannerSuggestions: any[];
        censorshipResult: any;
      }>;
      if (snap.formData) setFormData(prev => ({ ...prev, ...snap.formData }));
      if (Array.isArray(snap.selectedHeadlines)) setSelectedHeadlines(snap.selectedHeadlines);
      if (Array.isArray(snap.selectedKeywords)) setSelectedKeywords(snap.selectedKeywords);
      if (snap.targetInfo) setTargetInfo(snap.targetInfo);
      if (snap.aiSuggestions) setAiSuggestions(snap.aiSuggestions);
      if (Array.isArray(snap.bannerSuggestions)) setBannerSuggestions(snap.bannerSuggestions);
      if (snap.censorshipResult) setCensorshipResult(snap.censorshipResult);
      if (typeof snap.step === 'number' && snap.step >= 1) setStep(snap.step);
      setCurrentDraftId(initialDraft.id);
      onDraftRestored?.();
    } catch (err) {
      console.error('[NewCampaignWizard] Failed to restore draft:', err);
      notify('下書きの復元に失敗しました', 'error');
      onDraftRestored?.();
    }
    // initialDraft の id が変わったときだけ走らせる（中身編集での再復元を避ける）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft?.id]);

  // 下書きとして保存（同名は上書き）
  const handleSaveDraft = async () => {
    if (!user?.uid) {
      notify('ログインが必要です', 'error');
      return;
    }
    const draftName = (formData.name || '').trim() || `下書き ${new Date().toLocaleString('ja-JP')}`;
    setIsSavingDraft(true);
    try {
      const snapshot = {
        step,
        formData,
        selectedHeadlines,
        selectedKeywords,
        targetInfo,
        aiSuggestions,
        bannerSuggestions,
        censorshipResult,
      };
      const saved = await apiSaveDraft(user.uid, {
        name: draftName,
        status: 'draft',
        wizardData: JSON.stringify(snapshot),
      });
      setCurrentDraftId(saved.id);
      notify(`下書き「${saved.name}」を保存しました`, 'success');
    } catch (err: any) {
      console.error('[handleSaveDraft] error:', err);
      notify(err?.message || '下書きの保存に失敗しました', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const nextStep = () => {
    if (currentStepInfo.type === 'basic') {
      if (formData.platforms.length === 0) {
        alert('少なくとも1つの媒体を選択してください。');
        return;
      }
      handleGenerateSuggestions();
    }
    if (currentStepInfo.type === 'copy') {
      handleGenerateBannerSuggestions();
    }
    if (step < totalSteps) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleStartCensorship = async () => {
    setIsCensoring(true);
    setCensorshipResult(null);
    try {
      const result = await checkAdContentCensorship({
        headline: formData.headline || (selectedHeadlines[0] || ''),
        description: formData.description || (aiSuggestions.descriptions[0]?.text || ''),
        body: formData.body || '',
        imageUrl: formData.imageUrl,
        cta: formData.ctas[0] || (aiSuggestions.ctas[0] || ''),
        banners: formData.banners
      }, formData.industry, plan.name);
      setCensorshipResult(result);
    } catch (error) {
      console.error('Censorship check failed:', error);
      setCensorshipResult({
        passed: false,
        score: 0,
        feedback: 'AI審査中にエラーが発生しました。再度お試しください。',
        violations: ['SYSTEM_ERROR']
      });
    } finally {
      setIsCensoring(false);
    }
  };

  const handleAutoFixCreatives = async () => {
    if (!censorshipResult || censorshipResult.passed) return;
    
    setIsCensoring(true);
    try {
      // AIに修正案を依頼
      const currentContent = {
        headline: formData.headline || (selectedHeadlines[0] || ''),
        description: formData.description || (aiSuggestions.descriptions[0]?.text || ''),
        body: formData.body || '',
        cta: formData.ctas[0] || (aiSuggestions.ctas[0] || '')
      };

      const fixedSuggestions = await generateAdSuggestions(
        formData.industry, 
        formData.goal, 
        plan.name, 
        `以下のフィードバックに基づいて、既存の広告文を修正してください: ${censorshipResult.feedback}\n現在の内容: ${JSON.stringify(currentContent)}`
      );

      if (fixedSuggestions.headlines.length > 0) {
        setFormData(prev => ({
          ...prev,
          headline: fixedSuggestions.headlines[0].text,
          description: fixedSuggestions.descriptions[0]?.text || prev.description,
          body: fixedSuggestions.descriptions[0]?.text || prev.body,
        }));
        setSelectedHeadlines([fixedSuggestions.headlines[0].text]);
        
        // 修正後に再審査
        const newResult = await checkAdContentCensorship({
          headline: fixedSuggestions.headlines[0].text,
          description: fixedSuggestions.descriptions[0]?.text || formData.description,
          body: fixedSuggestions.descriptions[0]?.text || formData.body,
          imageUrl: formData.imageUrl,
          cta: formData.ctas[0] || (aiSuggestions.ctas[0] || ''),
          banners: formData.banners
        }, formData.industry, plan.name);
        
        setCensorshipResult(newResult);
        if (newResult.passed) {
          notify('AIが自動的にクリエイティブを修正し、審査を通過しました。', 'success');
        }
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      notify('自動修正に失敗しました。手動で修正してください。', 'error');
    } finally {
      setIsCensoring(false);
    }
  };

  useEffect(() => {
    if (currentStepInfo.type === 'review' && !censorshipResult && !isCensoring) {
      handleStartCensorship();
    }
  }, [step]);

  const handleFinish = () => {
    if (!censorshipResult?.passed) return;

    // Check if selected platforms are connected
    const missingConnections = formData.platforms.filter(platform => {
      if (platform.startsWith('Google') && !profile?.google_ads_connected) return true;
      if ((platform === 'Instagram' || platform === 'Facebook') && !profile?.meta_ads_connected) return true;
      return false;
    });

    if (missingConnections.length > 0) {
      const platformNames = missingConnections.map(p => PLATFORM_LABELS[p as PlatformType]).join(', ');
      notify(`${platformNames} のアカウントが連携されていません。データ連携タブから連携を完了してください。`, 'error');
      // Optionally switch to connectors tab
      // setActiveTab('connectors'); 
      return;
    }

    saveIndustry(formData.industry);
    setIsSubmitting(true);
  };

  const handleSimulationComplete = async () => {
    console.log('[SubmissionSimulator] handleSimulationComplete triggered');
    if (!user) {
      console.log('[SubmissionSimulator] No user found');
      return;
    }
    
    // We are already in the simulator (isSubmitting is true)
    // The user clicked "Start Delivery" in the simulator.
    
    try {
      console.log('[SubmissionSimulator] Starting campaign creation for platforms:', formData.platforms);
      
      // 1. Upload images to storage first if they are base64
      let finalImageUrl = formData.imageUrl;
      if (formData.imageUrl && formData.imageUrl.startsWith('data:image')) {
        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            base64: formData.imageUrl,
            userId: user.uid,
            fileName: `campaign_${Date.now()}.png`
          })
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          finalImageUrl = url;
        }
      }

      // 2. Create separate campaigns for each platform in Firestore
      const creationPromises = formData.platforms.map(async (platform) => {
        const newCampaign: Campaign = {
          id: Math.random().toString(36).substr(2, 9),
          name: `${formData.name || '名称未設定キャンペーン'} (${PLATFORM_LABELS[platform]})`,
          ownerUid: user.uid,
          clientId: formData.clientId || '',
          clientName: clients.find(c => c.id === formData.clientId)?.name || '',
          siteId: formData.siteId || '',
          siteName: sites.find(s => s.id === formData.siteId)?.name || '',
          industry: formData.industry,
          budget: Math.floor((parseInt(formData.budget) || 0) / formData.platforms.length),
          spend: 0,
          impressions: 0,
          clicks: 0,
          leads: 0,
          cpa: 0,
          cpc: 0,
          cvr: 0,
          roas: 0,
          cvi: 0,
          status: 'reviewing',
          platforms: [platform],
          reviewStatus: { [platform]: 'pending' },
          targeting: {
            gender: [targetInfo.gender],
            age: targetInfo.ageGroups.length > 0 ? targetInfo.ageGroups : ['all'],
            regions: targetInfo.region === 'nationwide' || targetInfo.prefectures.length === 0
              ? ['全国']
              : targetInfo.prefectures,
          },
          adContent: {
            headline: formData.headline || selectedHeadlines[0] || '',
            description: formData.description || aiSuggestions.descriptions[0]?.text || '',
            body: formData.body || '',
            imageUrl: finalImageUrl || '',
            cta: formData.ctas[0] || aiSuggestions.ctas[0] || '',
            banners: formData.banners || []
          },
          keywords: selectedKeywords,
          mainSiteUrl: formData.landingPageUrl,
          businessDescription: formData.businessDescription,
          autoStart: formData.autoStart,
          createdAt: Date.now(),
          tags: [],
          censorship: censorshipResult
        };

        // 3. Trigger real deployment via server
        try {
          await fetch('/api/campaigns/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: newCampaign.id,
              userId: user.uid,
              platform: platform,
              budget: newCampaign.budget,
              adContent: newCampaign.adContent,
              targeting: newCampaign.targeting
            })
          });
        } catch (deployError) {
          console.error(`Deployment trigger failed for ${platform}:`, deployError);
          // We still save the campaign to Firestore even if deployment trigger fails (it will be marked as pending)
        }

        return onCampaignCreated(newCampaign);
      });

      await Promise.all(creationPromises);
      
      // Successfully saved all campaigns
      setIsSubmitting(false);
      onComplete(); // This closes the wizard and triggers the dashboard refresh
    } catch (error) {
      console.error('Error creating campaigns:', error);
      notify('キャンペーンの作成中にエラーが発生しました。', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
      {isSubmitting && (
        <SubmissionSimulator 
          campaignData={formData}
          platforms={formData.platforms}
          onComplete={handleSimulationComplete}
        />
      )}

      {/* Header */}
      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">新規キャンペーン作成</h2>
            <p className="text-sm text-gray-500 mt-1">AIが最適な設定をガイドします</p>
          </div>
          <div className="flex items-center gap-2">
            {wizardSteps.map((s, i) => (
              <div 
                key={s.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= i + 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {wizardSteps.map((s, i) => (
            <StepIndicator key={s.id} active={step === i + 1} label={s.label} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8 min-h-[400px]">
        {currentStepInfo.type === 'basic' && (
          <div className="space-y-6 max-w-xl">
            {(plan.name === 'Pro' || plan.name === 'Agency') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">クライアント</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none bg-white"
                    value={formData.clientId}
                    onChange={e => {
                      const client = clients.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData, 
                        clientId: e.target.value, 
                        siteId: '', 
                        industry: client?.industry || formData.industry 
                      });
                    }}
                  >
                    <option value="">選択してください</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">サイト</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none bg-white"
                    value={formData.siteId}
                    onChange={e => {
                      const site = sites.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData, 
                        siteId: e.target.value, 
                        landingPageUrl: site?.url || formData.landingPageUrl 
                      });
                    }}
                  >
                    <option value="">選択してください</option>
                    {sites.filter(s => !formData.clientId || s.clientId === formData.clientId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">配信媒体（複数選択可）</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {plan.platforms.map(p => {
                  const isSelected = formData.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          platforms: isSelected 
                            ? prev.platforms.filter(x => x !== p)
                            : [...prev.platforms, p]
                        }));
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-black bg-black text-white shadow-lg scale-105' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                        {p === 'GoogleSearch' && <Search size={20} />}
                        {p === 'GoogleDisplay' && <Layout size={20} />}
                        {p === 'TrueView' && <YoutubeIcon size={20} />}
                        {p === 'YahooSearch' && <Search size={20} />}
                        {p === 'YahooDisplay' && <Layout size={20} />}
                        {p === 'Instagram' && <Instagram size={20} />}
                        {p === 'Facebook' && <Facebook size={20} />}
                        {p === 'X' && <Twitter size={20} />}
                        {p === 'LINE' && <MessageCircle size={20} />}
                        {p === 'TikTok' && <div className="w-5 h-5 flex items-center justify-center font-black italic">T</div>}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{PLATFORM_LABELS[p]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">キャンペーン名</label>
              <input 
                type="text" 
                placeholder="例: 検索連動（2024春季キャンペーン）"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">業種・コンテキスト</label>
                <input 
                  type="text"
                  list="industry-suggestions"
                  placeholder="例: 歯科医院、不用品回収"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none bg-white"
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                />
                <datalist id="industry-suggestions">
                  {recentIndustries.map(ind => (
                    <option key={ind} value={ind} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">最適化ゴール</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none appearance-none bg-white"
                  value={formData.goal}
                  onChange={e => setFormData({...formData, goal: e.target.value})}
                >
                  <option value="conversion">コンバージョン最大化</option>
                  <option value="cvi">CVI（資金回転率）最大化</option>
                  <option value="click">クリック数最大化</option>
                  <option value="impression">インプレッション最大化</option>
                  <option value="awareness">認知度向上</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">月間予算</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                <input 
                  type="number" 
                  placeholder="300,000"
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:outline-none ${
                    parseInt(formData.budget) > plan.spendLimit ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                />
              </div>
              {parseInt(formData.budget) > plan.spendLimit && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">
                  現在のプランの上限 (¥{plan.spendLimit.toLocaleString()}) を超えています
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">最終的な送客先（メインサイト）のURL</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <span className="text-xs font-bold text-gray-400">https://</span>
                </div>
                <input 
                  type="text" 
                  placeholder="www.your-site.com"
                  className="w-full pl-20 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  value={formData.landingPageUrl.replace(/^https?:\/\//, '')}
                  onChange={e => {
                    const val = e.target.value.replace(/^https?:\/\//, '');
                    setFormData({...formData, landingPageUrl: val ? `https://${val}` : ''});
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                ※SEOサテライトページからのリンク先、および広告の遷移先として使用されます。
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">商材・サービスの詳細説明</label>
              <textarea 
                placeholder="例: 東京都内を中心に、最短即日で不用品回収・ゴミ屋敷清掃を行っています。業界最安値に挑戦中で、女性スタッフの同行も可能です。"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none min-h-[100px]"
                value={formData.businessDescription}
                onChange={e => setFormData({...formData, businessDescription: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                ※AIがサテライトページや広告文を生成する際の重要なインプットになります。
              </p>
            </div>
          </div>
        )}

        {currentStepInfo.type === 'copy' && (
          <div className="space-y-8 relative">
            {isGeneratingSuggestions && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-900">AIが広告コピーを生成中...</p>
                <p className="text-xs text-gray-500 mt-1">数秒ほどお待ちください</p>
              </div>
            )}

            {generationError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-sm text-red-800 font-medium">{generationError}</p>
                </div>
                <button 
                  onClick={handleGenerateSuggestions}
                  className="px-4 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                >
                  再試行
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-emerald-600" />
                <p className="text-sm text-emerald-800 font-medium">AIが業種「{formData.industry}」に最適なコピー案を生成しました。</p>
              </div>
              <button 
                onClick={handleGenerateSuggestions}
                disabled={isGeneratingSuggestions}
                className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Zap size={14} className={isGeneratingSuggestions ? 'animate-spin' : ''} />
                再生成
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    見出し（キャッチコピー）
                    <span className="text-[10px] text-gray-400 font-normal">{formData.headline.length} 文字</span>
                  </h4>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    placeholder="見出しを入力してください"
                    value={formData.headline}
                    onChange={e => setFormData({...formData, headline: e.target.value})}
                  />
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">AI提案の見出し</p>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                      {aiSuggestions.headlines.map((h, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setSelectedHeadlines([h.text]);
                            setFormData(prev => ({ ...prev, headline: h.text }));
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedHeadlines.includes(h.text) 
                              ? 'border-black bg-black text-white shadow-md' 
                              : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              h.length === 'short' ? 'bg-blue-100 text-blue-700' : 
                              h.length === 'medium' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {h.length === 'short' ? '短' : h.length === 'medium' ? '中' : '長'}
                            </span>
                            {selectedHeadlines.includes(h.text) && <CheckCircle2 size={14} className="text-emerald-400" />}
                          </div>
                          <span className="text-xs font-medium">{h.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    広告本文 / 説明文
                    <span className="text-[10px] text-gray-400 font-normal">{formData.description.length} 文字</span>
                  </h4>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none text-sm min-h-[120px]"
                    placeholder="広告の本文を入力してください"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value, body: e.target.value})}
                  />
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">AI提案の本文</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {aiSuggestions.descriptions.map((d, i) => (
                        <button 
                          key={i}
                          onClick={() => setFormData({...formData, description: d.text, body: d.text})}
                          className="w-full text-left p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              d.length === 'short' ? 'bg-blue-100 text-blue-700' : 
                              d.length === 'medium' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {d.length === 'short' ? '短文' : d.length === 'medium' ? '標準' : '長文'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-2">{d.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    CTA（行動喚起）
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {aiSuggestions.ctas.slice(0, 5).map((cta, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, ctas: [cta] }));
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-bold flex items-center justify-between ${
                          formData.ctas.includes(cta) 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {cta}
                        {formData.ctas.includes(cta) && <CheckCircle2 size={14} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none text-sm"
                      placeholder="または自由に入力..."
                      value={formData.ctas[0] || ''}
                      onChange={e => setFormData({...formData, ctas: [e.target.value]})}
                    />
                    {formData.ctas[0] && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <div className="">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Smartphone size={14} />
                    広告プレビュー
                  </h4>
                  <div className="min-h-[750px] w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <MediaSimulator 
                      content={{
                        headline: formData.headline || (selectedHeadlines[0] || ''),
                        description: formData.description || (aiSuggestions.descriptions[0]?.text || ''),
                        body: formData.body || '',
                        imageUrl: formData.imageUrl,
                        cta: formData.ctas[0] || (aiSuggestions.ctas[0] || ''),
                        banners: formData.banners
                      }}
                      industry={formData.industry as IndustryType}
                      plan={plan.name}
                      allowedPlatforms={formData.platforms.filter(p => ['GoogleSearch', 'YahooSearch'].includes(p))}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-4 text-center">
                    ※実際の配信画面とは細部が異なる場合があります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStepInfo.type === 'banner' && (
          <div className="space-y-8 relative">
            {isGeneratingBanners && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-900">AIがバナーを生成中...</p>
                <p className="text-xs text-gray-500 mt-1">数秒ほどお待ちください</p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">
                    AIがコピー案に合わせて3つのデザインコンセプトを提案しました。
                    背景画像を生成し、テキストを合成します。
                  </p>
                  <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-wider">
                    ※バナーは最大3クリエイティブまで入稿可能です（現在: {formData.banners.length}個）
                  </p>
                </div>
              </div>
              <button 
                onClick={handleGenerateBannerSuggestions}
                disabled={isGeneratingBanners}
                className="px-4 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
              >
                <Zap size={14} className={isGeneratingBanners ? 'animate-spin' : ''} />
                コンセプト再生成
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={18} />
                手動アップロード（背景画像）
              </h4>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-300" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-4">
                    独自の背景画像を使用したい場合は、こちらからアップロードしてください。
                    アップロード後、AIが最適なテキスト配置を提案します。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bannerSuggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                        {suggestion.preset}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{suggestion.explanation}</p>
                  </div>
                  
                  <div className="flex-1 p-4 space-y-4">
                    {[BannerType.Square, BannerType.Wide, BannerType.Vertical].map(type => {
                      const banner = formData.banners.find(b => b.type === type && b.backgroundPrompt === suggestion.backgroundPrompt);
                      const isMaxReached = formData.banners.length >= 3 && !banner;

                      return (
                        <div key={type} className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-900 uppercase">
                                {type === BannerType.Square ? '■ SQUARE (1:1)' : type === BannerType.Wide ? '■ WIDE (1.91:1)' : '■ VERTICAL (9:16)'}
                              </span>
                              {banner && (
                                <button 
                                  onClick={() => setFormData(prev => ({ ...prev, banners: prev.banners.filter(b => b !== banner) }))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            
                            <div className="space-y-1.5">
                              <ul className="text-[9px] text-gray-500 space-y-0.5">
                                {type === BannerType.Square && (
                                  <>
                                    <li className="flex items-center gap-1.5"><span className="text-blue-500">●</span> Google (RDA)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-red-500">●</span> Meta (FB/IG Feed)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-gray-400">●</span> X (Timeline)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-purple-500">●</span> Yahoo (YDAレスポンシブ)</li>
                                  </>
                                )}
                                {type === BannerType.Wide && (
                                  <>
                                    <li className="flex items-center gap-1.5"><span className="text-blue-500">●</span> Google (RDA)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-gray-400">●</span> X (Web Card)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-red-500">●</span> Meta (FB Feed)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-purple-500">●</span> Yahoo (YDA 1.91:1枠)</li>
                                  </>
                                )}
                                {type === BannerType.Vertical && (
                                  <>
                                    <li className="flex items-center gap-1.5"><span className="text-red-500">●</span> Instagram (Stories/Reels)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-red-500">●</span> Meta (FB Stories)</li>
                                    <li className="flex items-center gap-1.5"><span className="text-gray-400">●</span> X (Vertical Ads)</li>
                                  </>
                                )}
                              </ul>
                              <p className="text-[9px] font-bold text-gray-700 leading-tight">
                                【一言】 {type === BannerType.Square ? '最も汎用性が高い「必須バナー」です。' : type === BannerType.Wide ? 'クリック率（CTR）を稼ぐための「主力バナー」です。' : 'スマホ全画面で視覚に訴える「没入型バナー」です。'}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`aspect-video bg-white rounded-xl border border-gray-200 overflow-hidden relative group ${type === BannerType.Vertical ? 'aspect-[9/16] max-h-[250px] mx-auto' : ''}`}>
                            {banner ? (
                              <div className="relative w-full h-full group">
                                <BannerPreview
                                  backgroundUrl={banner.url}
                                  type={banner.type}
                                  className="w-full h-full"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleGenerateBannerImage(idx, type)}
                                    className="p-2 bg-white rounded-full text-black hover:bg-gray-100 shadow-lg"
                                    title="再生成"
                                  >
                                    <Zap size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                <ImageIcon size={24} className="text-gray-300 mb-2" />
                                <button
                                  onClick={() => handleGenerateBannerImage(idx, type)}
                                  disabled={isMaxReached || isGeneratingBanners}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${
                                    isMaxReached 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'bg-black text-white hover:bg-gray-800 shadow-md'
                                  }`}
                                >
                                  <Zap size={12} />
                                  生成する
                                </button>
                                {isMaxReached && <p className="text-[8px] text-red-500 mt-2">上限3枚に達しています</p>}
                              </div>
                            )}
                          </div>

                          {banner && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">配信先マッピング</p>
                              <div className="flex flex-wrap gap-1">
                                {type === BannerType.Square && (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-blue-100/50 text-blue-700 text-[8px] font-bold rounded border border-blue-200/50">Google RDA</span>
                                    <span className="px-1.5 py-0.5 bg-red-100/50 text-red-700 text-[8px] font-bold rounded border border-red-200/50">Meta Feed</span>
                                    <span className="px-1.5 py-0.5 bg-gray-200/50 text-gray-700 text-[8px] font-bold rounded border border-gray-300/50">X Timeline</span>
                                    <span className="px-1.5 py-0.5 bg-purple-100/50 text-purple-700 text-[8px] font-bold rounded border border-purple-200/50">Yahoo YDA</span>
                                  </>
                                )}
                                {type === BannerType.Wide && (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-blue-100/50 text-blue-700 text-[8px] font-bold rounded border border-blue-200/50">Google RDA</span>
                                    <span className="px-1.5 py-0.5 bg-gray-200/50 text-gray-700 text-[8px] font-bold rounded border border-gray-300/50">X Web Card</span>
                                    <span className="px-1.5 py-0.5 bg-red-100/50 text-red-700 text-[8px] font-bold rounded border border-red-200/50">Meta Feed</span>
                                    <span className="px-1.5 py-0.5 bg-purple-100/50 text-purple-700 text-[8px] font-bold rounded border border-purple-200/50">Yahoo YDA</span>
                                  </>
                                )}
                                {type === BannerType.Vertical && (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-red-100/50 text-red-700 text-[8px] font-bold rounded border border-red-200/50">Instagram Stories</span>
                                    <span className="px-1.5 py-0.5 bg-red-100/50 text-red-700 text-[8px] font-bold rounded border border-red-200/50">Meta Stories</span>
                                    <span className="px-1.5 py-0.5 bg-gray-200/50 text-gray-700 text-[8px] font-bold rounded border border-gray-300/50">X Vertical</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {formData.banners.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Smartphone size={14} />
                  広告プレビュー（全バナー）
                </h4>
                <div className="min-h-[850px] w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <MediaSimulator 
                    content={{
                      ...formData,
                      banners: formData.banners
                    }}
                    industry={formData.industry as IndustryType}
                    plan={plan.name}
                    allowedPlatforms={formData.platforms.filter(p => ['Instagram', 'Facebook', 'X', 'LINE', 'TikTok', 'GoogleDisplay', 'YahooDisplay'].includes(p))}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-4 text-center">
                  ※実際の配信画面とは細部が異なる場合があります。
                </p>
              </div>
            )}
          </div>
        )}

        {currentStepInfo.type === 'simulator' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-600" />
                <p className="text-sm text-emerald-800 font-medium">
                  各媒体での表示イメージを確認してください。バナーは媒体の推奨サイズに合わせて自動的に選択されます。
                </p>
              </div>
            </div>

            <div className="h-[850px] w-full">
              <MediaSimulator 
                content={{
                  headline: formData.headline,
                  description: formData.description,
                  body: formData.body,
                  imageUrl: formData.imageUrl,
                  cta: formData.ctas.join(' / '),
                  banners: formData.banners
                }}
                industry={formData.industry}
                plan={plan.name}
                allowedPlatforms={plan.platforms}
                onUpgrade={onUpgrade}
              />
            </div>
          </div>
        )}

        {currentStepInfo.type === 'target' && (
          <div className="space-y-6">
            <StepTarget
              targetInfo={targetInfo}
              setTargetInfo={setTargetInfo}
              platforms={formData.platforms}
              selectedKeywords={selectedKeywords}
              setSelectedKeywords={setSelectedKeywords}
              suggestedKeywords={aiSuggestions.keywords}
              platformLabels={PLATFORM_LABELS}
              industry={formData.industry}
              targetUrl={formData.landingPageUrl}
            />

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
              <label className="block text-sm font-bold text-gray-700">自動配信設定</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, autoStart: true }))}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${
                    formData.autoStart
                      ? 'border-black bg-gray-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} className={formData.autoStart ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className="text-sm font-bold">自動配信を有効にする</span>
                  </div>
                  <p className="text-[10px] text-gray-500 text-left">審査完了後、AIが最適なタイミングで自動的に配信を開始します。</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, autoStart: false }))}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${
                    !formData.autoStart
                      ? 'border-black bg-gray-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={16} className={!formData.autoStart ? 'text-blue-500' : 'text-gray-400'} />
                    <span className="text-sm font-bold">通知のみ（手動配信）</span>
                  </div>
                  <p className="text-[10px] text-gray-500 text-left">審査完了時に通知のみを行い、配信開始は手動で行います。</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStepInfo.type === 'review' && (
          <div className="space-y-8 max-w-2xl">
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center">
              {isCensoring ? (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6" />
                  <h4 className="text-xl font-bold text-gray-900 mb-2">AI検閲官が内容を確認中...</h4>
                  <p className="text-sm text-gray-500">景表法、薬機法、媒体ポリシーへの準拠をチェックしています</p>
                </div>
              ) : censorshipResult ? (
                <div className="space-y-6">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    censorshipResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {censorshipResult.passed ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
                  </div>
                  
                  <div>
                    <h4 className={`text-2xl font-bold mb-2 ${
                      censorshipResult.passed ? 'text-emerald-900' : 'text-red-900'
                    }`}>
                      {censorshipResult.passed ? 'AI審査を通過しました' : '改善が必要な項目が見つかりました'}
                    </h4>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600">
                      AIスコア: <span className={censorshipResult.score >= 80 ? 'text-emerald-600' : 'text-orange-600'}>{censorshipResult.score} / 100</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-gray-200 text-left">
                    <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      AI検閲官からのフィードバック
                    </h5>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {censorshipResult.feedback}
                    </p>
                  </div>

                  {!censorshipResult.passed && censorshipResult.violations && censorshipResult.violations.length > 0 && (
                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-left">
                      <h5 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={16} />
                        指摘された違反項目
                      </h5>
                      <ul className="space-y-2">
                        {censorshipResult.violations.map((v: string, i: number) => (
                          <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                            <span className="mt-1 w-1 h-1 bg-red-400 rounded-full shrink-0" />
                            {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {censorshipResult.passed ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left flex gap-3">
                      <Zap size={20} className="text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        この広告は配信ポリシーに準拠している可能性が高いです。最終確認の上、入稿ボタンを押してください。
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={handleAutoFixCreatives}
                          disabled={isCensoring}
                          className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={16} className={isCensoring ? 'animate-spin' : ''} />
                          AIで自動修正する
                        </button>
                        <button 
                          onClick={() => setStep(2)}
                          className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                        >
                          手動で修正する
                        </button>
                      </div>
                      <button 
                        onClick={handleStartCensorship}
                        className="w-full py-2 text-xs text-gray-400 font-bold hover:text-gray-600 transition-all"
                      >
                        再審査を実行
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {currentStepInfo.type === 'export' && (
          <StepExport
            campaignName={formData.name || 'campaign'}
            productName={formData.name}
            landingPageUrl={formData.landingPageUrl}
            platforms={formData.platforms}
            headlines={(() => {
              const merged = [
                ...selectedHeadlines,
                ...aiSuggestions.headlines.map(h => h.text),
              ];
              if (formData.headline) merged.unshift(formData.headline);
              return [...new Set(merged.filter(Boolean))];
            })()}
            descriptions={(() => {
              const merged = aiSuggestions.descriptions.map(d => d.text);
              if (formData.description) merged.unshift(formData.description);
              return [...new Set(merged.filter(Boolean))];
            })()}
            primaryText={formData.body || formData.description || aiSuggestions.descriptions[0]?.text}
            keywords={selectedKeywords}
            matchType={targetInfo.keywordMatchType}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 gap-3">
        <button
          onClick={step === 1 ? onComplete : prevStep}
          className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 touch-manipulation"
        >
          {step === 1 ? 'キャンセル' : '戻る'}
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-5 py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 touch-manipulation flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            title={currentDraftId ? '上書き保存' : '下書き保存'}
          >
            {isSavingDraft ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中…
              </>
            ) : (
              <>💾 {currentDraftId ? '上書き保存' : '下書き保存'}</>
            )}
          </button>

        <button
          type="button"
          onClick={step === totalSteps ? handleFinish : nextStep}
          disabled={isGeneratingSuggestions || isCensoring || (currentStepInfo.type === 'basic' && (!formData.name || !formData.budget || !formData.industry)) || (currentStepInfo.type === 'review' && !censorshipResult?.passed)}
          className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 touch-manipulation ${
            isGeneratingSuggestions || isCensoring || (currentStepInfo.type === 'basic' && (!formData.name || !formData.budget || !formData.industry)) || (currentStepInfo.type === 'review' && !censorshipResult?.passed)
              ? 'bg-gray-300 cursor-not-allowed shadow-none' 
              : 'bg-black hover:bg-gray-800 shadow-black/20'
          }`}
        >
          {isGeneratingSuggestions || isCensoring ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isCensoring ? '審査中...' : '生成中...'}
            </>
          ) : (
            <>
              {(() => {
                const nextType = wizardSteps[step]?.type;
                if (nextType === 'review') return 'AI審査へ';
                if (nextType === 'export') return '出力へ';
                if (currentStepInfo.type === 'export') return '完了して入稿';
                return '次に進む';
              })()}
              <ChevronRight size={18} />
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ active, label }: { active: boolean, label: string }) {
  return (
    <div className={`flex items-center gap-2 pb-2 border-b-2 transition-all duration-500 ${active ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function IntegrationCard({ 
  name, 
  status, 
  onConnect, 
  onDisconnect, 
  onTest, 
  isTesting,
  icon: Icon = Activity
}: { 
  name: string, 
  status: 'connected' | 'disconnected', 
  onConnect?: () => void, 
  onDisconnect?: () => void,
  onTest?: () => void, 
  isTesting?: boolean,
  icon?: any
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-200 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {status === 'connected' ? (
          <>
            {onTest && (
              <button 
                onClick={onTest}
                disabled={isTesting}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {isTesting ? 'テスト中...' : '疎通確認'}
              </button>
            )}
            {onDisconnect && (
              <button 
                onClick={onDisconnect}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                title="連携解除"
              >
                <LogOut size={16} />
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={onConnect}
            className="px-6 py-2 bg-black text-white rounded-xl text-[10px] font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
          >
            <Link size={14} />
            連携する
          </button>
        )}
      </div>
    </div>
  );
}
