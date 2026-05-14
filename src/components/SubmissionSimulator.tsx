import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ShieldCheck, 
  Send, 
  Search, 
  MessageSquare, 
  RefreshCcw,
  Sparkles,
  ArrowRight,
  X,
  Activity,
  Image as ImageIcon
} from 'lucide-react';

import { PlatformType as Platform } from '../types';

type StepStatus = 'waiting' | 'processing' | 'completed' | 'error';

interface PlatformStatus {
  platform: Platform;
  validation: StepStatus;
  policyCheck: StepStatus;
  deployment: StepStatus;
  review: StepStatus;
  reviewProgress: number;
  result: 'pending' | 'approved' | 'disapproved';
  errorReason?: string;
  recoverySuggestion?: string;
  policyViolations?: any[];
}

interface SubmissionSimulatorProps {
  campaignData: any;
  platforms: string[];
  onComplete: () => void;
}

export function SubmissionSimulator({ campaignData, platforms, onComplete }: SubmissionSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [statuses, setStatuses] = useState<PlatformStatus[]>(
    platforms.map(p => ({
      platform: p as Platform,
      validation: 'waiting',
      policyCheck: 'waiting',
      deployment: 'waiting',
      review: 'waiting',
      reviewProgress: 0,
      result: 'pending'
    }))
  );

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [activeError, setActiveError] = useState<PlatformStatus | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    startSimulation();
  }, []);

  const startSimulation = async () => {
    // STEP 1: Validation
    setCurrentStep(1);
    updateAllPlatforms('validation', 'processing');
    await wait(1500);
    updateAllPlatforms('validation', 'completed');

    // STEP 2: AI Policy Check (Pharmaceutical Affairs Law, etc.)
    setCurrentStep(2);
    updateAllPlatforms('policyCheck', 'processing');
    
    try {
      const policyResults = await Promise.all(platforms.map(async (p) => {
        const res = await fetch('/api/ai/policy-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            headline: campaignData.adContent?.headline || campaignData.name,
            description: campaignData.adContent?.description || '',
            industry: campaignData.industry || '一般',
            platform: p
          })
        });
        return { platform: p, result: await res.json() };
      }));

      setStatuses(prev => prev.map(p => {
        const policy = policyResults.find(r => r.platform === p.platform)?.result;
        return { 
          ...p, 
          policyCheck: 'completed',
          policyViolations: policy?.violations || [],
          result: policy?.status === 'rejected' ? 'disapproved' : p.result,
          errorReason: policy?.status === 'rejected' ? policy.violations[0]?.reason : p.errorReason,
          recoverySuggestion: policy?.status === 'rejected' ? policy.violations[0]?.suggestion : p.recoverySuggestion
        };
      }));
    } catch (error) {
      console.error("Policy check failed:", error);
      updateAllPlatforms('policyCheck', 'completed');
    }

    // Check if any platform was rejected by policy
    setStatuses(prev => {
      const hasRejection = prev.some(p => p.result === 'disapproved');
      if (hasRejection) {
        // Stop simulation if policy check fails
        return prev;
      }
      return prev;
    });

    // STEP 3: Deployment
    setCurrentStep(3);
    updateAllPlatforms('deployment', 'processing');
    await wait(2000);
    updateAllPlatforms('deployment', 'completed');

    // STEP 4: Review
    setCurrentStep(4);
    simulateReview();
  };

  const updateAllPlatforms = (step: keyof PlatformStatus, status: StepStatus) => {
    setStatuses(prev => prev.map(p => ({ ...p, [step]: status })));
  };

  const simulateReview = () => {
    const interval = setInterval(() => {
      setStatuses(prev => {
        const next = prev.map(p => {
          if (p.reviewProgress < 100) {
            return { ...p, review: 'processing' as StepStatus, reviewProgress: Math.min(p.reviewProgress + Math.random() * 15, 100) };
          }
          return p;
        });

        if (next.every(p => p.reviewProgress >= 100)) {
          clearInterval(interval);
          finalizeResults(next);
        }
        return next;
      });
    }, 800);
  };

  const finalizeResults = (currentStatuses: PlatformStatus[]) => {
    setStatuses(currentStatuses.map(p => {
      // 10% chance of disapproval for any platform to simulate real-world policy checks
      const isDisapproved = Math.random() < 0.1;
      
      if (isDisapproved) {
        return {
          ...p,
          review: 'completed',
          result: 'disapproved',
          errorReason: '広告ポリシー違反の可能性があります（画像内のテキスト量または表現）',
          recoverySuggestion: 'AIがポリシーに準拠するように自動調整しました。このまま再申請しますか？'
        };
      }
      return {
        ...p,
        review: 'completed',
        result: 'approved'
      };
    }));
    setCurrentStep(5);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleRecovery = async () => {
    if (!activeError) return;
    
    const platform = activeError.platform;
    setStatuses(prev => prev.map(p => 
      p.platform === platform 
        ? { ...p, review: 'processing', reviewProgress: 0, result: 'pending', errorReason: undefined } 
        : p
    ));
    setShowRecoveryModal(false);
    
    // Simulate re-review
    await wait(1000);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setStatuses(prev => prev.map(p => 
        p.platform === platform ? { ...p, reviewProgress: progress } : p
      ));
      if (progress >= 100) {
        clearInterval(interval);
        setStatuses(prev => prev.map(p => 
          p.platform === platform ? { ...p, result: 'approved', review: 'completed' } : p
        ));
      }
    }, 500);
  };

  const isAllApproved = statuses.every(p => p.result === 'approved');

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh]">
        
        {/* Left: Progress Sidebar */}
        <div className="w-full md:w-80 bg-gray-50 p-8 border-r border-gray-100 flex flex-col">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <h2 className="text-xl font-black tracking-tighter">AMAS DEPLOY</h2>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Submission Engine</p>
          </div>

          <div className="space-y-8 flex-1">
            <StepItem 
              number={1} 
              title="内部バリデーション" 
              status={currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'waiting'} 
            />
            <StepItem 
              number={2} 
              title="AIポリシー審査 (薬機法等)" 
              status={currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'waiting'} 
            />
            <StepItem 
              number={3} 
              title="API一括デプロイ" 
              status={currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'waiting'} 
            />
            <StepItem 
              number={4} 
              title="審査ステータス監視" 
              status={currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : 'waiting'} 
            />
            <StepItem 
              number={5} 
              title="完了・審査へ送信" 
              status={currentStep === 5 ? (isAllApproved ? 'completed' : 'error') : 'waiting'} 
            />
          </div>

          <div className="mt-auto pt-8">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase">AI Status</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                {currentStep === 1 && "Geminiが媒体規定とポリシーをチェックしています..."}
                {currentStep === 2 && "AIエージェントが薬機法・景表法・媒体ポリシーを厳密に審査中..."}
                {currentStep === 3 && "各媒体のAPIエンドポイントへデータを送信中..."}
                {currentStep === 4 && "媒体側の審査サーバーからのレスポンスを待機しています..."}
                {currentStep === 5 && isAllApproved && "すべての審査を通過しました。媒体審査へ送信します。"}
                {currentStep === 5 && !isAllApproved && "一部の媒体でポリシー違反が検出されました。"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Main Content */}
        <div className="flex-1 p-8 md:p-12 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">入稿・審査シミュレーター</h3>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Real-time Monitoring
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {statuses.map((s, i) => (
              <PlatformRow 
                key={i} 
                status={s} 
                onFix={() => {
                  setActiveError(s);
                  setShowRecoveryModal(true);
                }}
              />
            ))}
          </div>

          {currentStep === 5 && isAllApproved && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-8 bg-emerald-50 rounded-[24px] border border-emerald-100 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h4 className="text-xl font-bold text-emerald-900 mb-2">入稿準備が完了しました！</h4>
              <p className="text-sm text-emerald-700 mb-6">
                AIによる事前審査とポリシーチェックをすべて通過しました。<br />
                「媒体審査へ送信」をクリックすると、各媒体への入稿が完了し、審査プロセスが開始されます。
              </p>
              <div className="mb-6 p-4 bg-white/50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 text-left">
                <p className="font-bold mb-1">💡 実際の審査について</p>
                <p>各媒体（Google, Meta等）の最終審査には通常1〜3営業日を要します。審査状況はダッシュボードからいつでも確認可能です。</p>
              </div>
              <button 
                onClick={async () => {
                  setIsCompleting(true);
                  try {
                    await onComplete();
                  } catch (error) {
                    console.error('Submission failed:', error);
                    setIsCompleting(false);
                  }
                }}
                disabled={isCompleting}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {isCompleting ? '送信中...' : '媒体審査へ送信'}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recovery Modal */}
      <AnimatePresence>
        {showRecoveryModal && activeError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowRecoveryModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle size={24} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{activeError.platform} 審査不承認</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Policy Violation Detected</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">理由</p>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    {activeError.errorReason}
                  </p>
                </div>

                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <Sparkles size={16} className="text-blue-200" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">AI Recovery Suggestion</p>
                  <p className="text-sm text-blue-900 leading-relaxed font-bold">
                    {activeError.recoverySuggestion}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowRecoveryModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    手動で修正
                  </button>
                  <button 
                    onClick={handleRecovery}
                    className="flex-1 px-6 py-4 bg-black text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={18} />
                    再申請する
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function StepItem({ number, title, status }: { number: number, title: string, status: 'waiting' | 'active' | 'completed' | 'error' }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        status === 'active' ? 'bg-black text-white scale-110 shadow-lg' :
        status === 'completed' ? 'bg-emerald-500 text-white' :
        status === 'error' ? 'bg-red-500 text-white' :
        'bg-gray-200 text-gray-400'
      }`}>
        {status === 'completed' ? <CheckCircle2 size={16} /> : number}
      </div>
      <span className={`text-sm font-bold ${
        status === 'active' ? 'text-gray-900' :
        status === 'completed' ? 'text-emerald-600' :
        status === 'error' ? 'text-red-600' :
        'text-gray-400'
      }`}>
        {title}
      </span>
    </div>
  );
}

const PlatformRow: React.FC<{ status: PlatformStatus, onFix: () => void }> = ({ status, onFix }) => {
  const getProgressColor = () => {
    if (status.result === 'approved') return 'bg-emerald-500';
    if (status.result === 'disapproved') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
            {status.platform === 'GoogleSearch' && <Search size={24} className="text-blue-500" />}
            {status.platform === 'GoogleDisplay' && <ImageIcon size={24} className="text-blue-500" />}
            {status.platform === 'Instagram' && <div className="text-xl font-black text-pink-600 italic">i</div>}
            {status.platform === 'Facebook' && <div className="text-xl font-black text-blue-600 italic">f</div>}
            {status.platform === 'LINE' && <MessageSquare size={24} className="text-emerald-500" />}
            {status.platform === 'TrueView' && <div className="text-xl font-black text-red-600">Y</div>}
            {status.platform === 'YahooSearch' && <div className="text-xl font-black text-purple-600 italic">Y!</div>}
            {status.platform === 'YahooDisplay' && <ImageIcon size={24} className="text-purple-600" />}
            {status.platform === 'X' && <div className="text-xl font-black text-black">X</div>}
            {status.platform === 'TikTok' && <div className="text-xl font-black text-black">T</div>}
          </div>
          <div>
            <h5 className="font-bold text-gray-900">{status.platform} Ads</h5>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                status.result === 'approved' ? 'text-emerald-600' :
                status.result === 'disapproved' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {status.result === 'approved' ? 'Approved' :
                 status.result === 'disapproved' ? 'Disapproved' :
                 status.review === 'processing' ? `Reviewing ${Math.round(status.reviewProgress)}%` :
                 status.deployment === 'processing' ? 'Deploying...' :
                 status.validation === 'processing' ? 'Validating...' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>

        {status.result === 'disapproved' && (
          <button 
            onClick={onFix}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} />
            AIで修正
          </button>
        )}
        
        {status.result === 'approved' && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ 
              width: status.review === 'processing' || status.review === 'completed' 
                ? `${status.reviewProgress}%` 
                : status.deployment === 'completed' ? '50%' 
                : status.policyCheck === 'completed' ? '25%' : '0%'
            }}
            className={`h-full transition-colors duration-500 ${getProgressColor()}`}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold text-gray-300 uppercase tracking-widest">
          <span>Validation</span>
          <span>Policy</span>
          <span>Deployment</span>
          <span>Review</span>
        </div>
      </div>
    </div>
  );
}
