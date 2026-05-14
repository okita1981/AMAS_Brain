import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  History, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Save,
  Building2,
  QrCode,
  FileText,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction, WalletState, User } from '../types';

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

interface WalletProps {
  userUid: string;
}

export default function Wallet({ userUid }: WalletProps) {
  const [wallet, setWallet] = useState<Partial<WalletState> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(55000);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState<'card' | 'bank' | 'qr' | 'invoice'>('card');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMessage('チャージが完了しました。反映まで数分かかる場合があります。');
      // Clear the URL params without reloading
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      setError('決済がキャンセルされました。');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('setup_success') === 'true') {
      setSuccessMessage('カードを登録しました。反映まで数分かかる場合があります。');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('setup_canceled') === 'true') {
      setError('カード登録がキャンセルされました。');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!userUid) return;

    // Listen to user data
    const userRef = doc(db, 'users', userUid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data() as User);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userUid}`);
    });

    // Listen to wallet balance
    const walletRef = doc(db, 'wallets', userUid);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WalletState;
        
        // Safety check: If there are no transactions but there is a balance,
        // it's likely legacy dummy data. Reset it to 0 for a clean production state.
        // We check transactions state which is updated by the other listener.
        // However, since listeners are independent, we'll check Firestore directly if needed
        // or just rely on the fact that a new user should have 0.
        // For now, let's apply the same logic as App.tsx but using the data from this snapshot.
        // We'll also check if the balance is exactly 45500 which was the dummy value.
        if (data.balance_total === 45500 || (data.balance_total > 0 && (!transactions || transactions.length === 0))) {
          console.log("Legacy dummy wallet data detected in Wallet component. Resetting to 0.");
          const resetData = {
            ...data,
            balance_total: 0,
            balance_ad_budget: 0,
            tax_holding: 0,
            status: 'inactive' as "active" | "paused" | "inactive"
          };
          setWallet(resetData);
          updateDoc(walletRef, {
            balance_total: 0,
            balance_ad_budget: 0,
            tax_holding: 0,
            status: 'inactive'
          }).catch(err => console.error("Failed to reset legacy wallet in component:", err));
        } else {
          setWallet(data);
        }
      } else {
        // Initialize wallet if not exists
        setDoc(walletRef, {
          balance_total: 0,
          balance_ad_budget: 0,
          tax_holding: 0,
          status: 'inactive',
          autoChargeEnabled: false,
          autoChargeThreshold: 10000,
          autoChargeAmount: 55000,
          lastResetAt: Date.now(),
          paymentMethods: [],
          monthlyUsage: {
            monthlyDeposit: 0,
            monthlyCreatives: 0,
            monthlyCampaigns: 0,
            lastResetAt: Date.now()
          }
        }).catch(error => {
          handleFirestoreError(error, OperationType.WRITE, `wallets/${userUid}`);
        });
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `wallets/${userUid}`);
      setIsLoading(false);
    });

    // Listen to transactions
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef, 
      where('userUid', '==', userUid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        // Filter out legacy dummy transactions that were created during development
        // These typically have specific IDs or were created on 2026/3/22
        .filter(tx => {
          const dummyIds = ['0r39e3u5', 'aqkl6xnk', '8nyf32j7', 'n2dtwjm', '6ufghrpo', 'rr5uu2ed', '0vvuwpnv', 'yycpxhmi', 'fmyigzib', '95oc3lqt', '4z5eikst'];
          if (dummyIds.includes(tx.id)) return false;
          
          // Also filter by date if it's exactly the dummy date and amount
          const txDate = new Date(tx.timestamp);
          if (txDate.getFullYear() === 2026 && txDate.getMonth() === 2 && txDate.getDate() === 22 && tx.amount === 50000) {
            return false;
          }
          
          return true;
        });
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => {
      unsubscribeUser();
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [userUid]);

  const handleCharge = async () => {
    setIsCharging(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chargeAmount,
          userId: userUid,
          successUrl: window.location.origin + '/wallet?success=true',
          cancelUrl: window.location.origin + '/wallet?canceled=true',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "決済セッションの作成に失敗しました。");
      }
    } catch (err: any) {
      setError(err.message);
      setIsCharging(false);
    }
  };

  const handleSaveCard = async () => {
    if (!userUid) return;
    setIsSavingCard(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userUid,
          successUrl: window.location.origin + '/wallet?setup_success=true',
          cancelUrl: window.location.origin + '/wallet?setup_canceled=true',
        }),
      });

      const data = await response.json();
      if (data.url) {
        // Stripe-hosted setup page collects the card details directly.
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "カード登録セッションの作成に失敗しました。");
      }
    } catch (err: any) {
      setError(err.message);
      setIsSavingCard(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [localAutoChargeSettings, setLocalAutoChargeSettings] = useState({
    threshold: 0,
    amount: 0
  });

  useEffect(() => {
    if (wallet) {
      setLocalAutoChargeSettings({
        threshold: wallet.autoChargeThreshold || 0,
        amount: wallet.autoChargeAmount || 0
      });
    }
  }, [wallet?.autoChargeThreshold, wallet?.autoChargeAmount]);

  const handleSaveAutoChargeSettings = async () => {
    if (!userUid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'wallets', userUid), {
        autoChargeThreshold: localAutoChargeSettings.threshold,
        autoChargeAmount: localAutoChargeSettings.amount
      });
      // Show success feedback if needed
    } catch (err) {
      console.error("Failed to save auto charge settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutoCharge = async () => {
    if (!userUid || !wallet) return;
    try {
      await updateDoc(doc(db, 'wallets', userUid), {
        autoChargeEnabled: !wallet.autoChargeEnabled
      });
    } catch (err) {
      console.error("Failed to toggle auto charge:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600">
              <Plus className="rotate-45" size={20} />
            </button>
          </motion.div>
        )}
        {error && !showChargeModal && !showAddCardModal && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-500" size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              <Plus className="rotate-45" size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <WalletIcon className="text-indigo-600" />
            ウォレット & 決済
          </h2>
          <p className="text-gray-500 text-sm mt-1">広告運用予算の管理とデポジットのチャージ</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowChargeModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={18} />
            チャージする
          </button>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-indigo-100 font-medium">現在のデポジット残高</span>
              <ShieldCheck className="text-indigo-200 opacity-50" size={24} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-indigo-100 mb-1 opacity-70">総残高 (税込)</p>
                <p className="text-2xl font-bold">¥{(wallet?.balance_total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-indigo-100 mb-1 opacity-70">広告運用予算 (税抜)</p>
                <p className="text-2xl font-bold text-emerald-300">¥{(wallet?.balance_ad_budget || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-indigo-100 mb-1 opacity-70">消費税預り金</p>
                <p className="text-2xl font-bold text-indigo-200">¥{(wallet?.tax_holding || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm text-indigo-100">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <div className={`w-2 h-2 ${wallet?.balance_total && wallet.balance_total > 0 ? 'bg-emerald-400' : 'bg-rose-400'} rounded-full animate-pulse`} />
                {wallet?.balance_total && wallet.balance_total > 0 ? '運用可能' : '予算不足 / 停止中'}
              </div>
              <span>次回更新日: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
        </motion.div>

        {/* Auto Charge Settings Card */}
        {/* Auto Charge Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="text-gray-400" size={20} />
              <h3 className="font-bold text-gray-900">オートチャージ設定</h3>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsLocked(!isLocked)}
                className={`p-2 rounded-xl transition-all ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}
                title={isLocked ? "編集をロック解除" : "編集をロック"}
              >
                {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
              <button 
                onClick={handleSaveAutoChargeSettings}
                disabled={isSaving || isLocked}
                className="px-4 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all disabled:bg-gray-300 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                設定を保存
              </button>
            </div>
          </div>
          
          <div className={`space-y-6 flex-1 transition-all ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">自動チャージ</p>
                <p className="text-xs text-gray-400">残高不足時に自動で決済</p>
              </div>
              <button 
                onClick={toggleAutoCharge}
                disabled={isLocked}
                className={`w-12 h-6 rounded-full transition-colors relative ${wallet?.autoChargeEnabled ? 'bg-indigo-600' : 'bg-gray-200'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${wallet?.autoChargeEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">条件設定</p>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">自動チャージの条件設定</label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">残高 ¥</span>
                  <input 
                    type="number"
                    value={localAutoChargeSettings.threshold}
                    onChange={(e) => setLocalAutoChargeSettings({ ...localAutoChargeSettings, threshold: parseInt(e.target.value) || 0 })}
                    className="flex-1 min-w-0 bg-gray-50 border-none rounded-lg py-1.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-500">以下</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">チャージ金額 (税込)</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={[11000, 33000, 55000, 110000, 330000, 550000].includes(localAutoChargeSettings.amount) ? localAutoChargeSettings.amount : 0}
                    onChange={(e) => setLocalAutoChargeSettings({ ...localAutoChargeSettings, amount: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border-none rounded-lg py-1.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {[11000, 33000, 55000, 110000, 330000, 550000].map(amt => (
                      <option key={amt} value={amt}>
                        ¥{amt.toLocaleString()} (内消費税 ¥{Math.floor(amt / 11).toLocaleString()})
                      </option>
                    ))}
                    <option value={0}>カスタム入力</option>
                  </select>
                  
                  {(![11000, 33000, 55000, 110000, 330000, 550000].includes(localAutoChargeSettings.amount) || localAutoChargeSettings.amount === 0) && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
                      <input 
                        type="number"
                        placeholder="金額を入力"
                        value={localAutoChargeSettings.amount || ''}
                        onChange={(e) => setLocalAutoChargeSettings({ ...localAutoChargeSettings, amount: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                      />
                      {localAutoChargeSettings.amount > 0 && (
                        <p className="text-[9px] text-gray-400 mt-1">
                          ※内消費税 ¥{Math.floor(localAutoChargeSettings.amount / 11).toLocaleString()} が含まれます
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 flex gap-2">
              <AlertCircle className="text-amber-500 shrink-0" size={16} />
              <div className="space-y-1">
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  オートチャージを有効にすると、広告配信が停止するリスクを最小限に抑えられます。
                </p>
                <p className="text-[9px] text-amber-600 leading-relaxed">
                  ※現在はプロトタイプ版です。本番環境では、登録されたカードからStripeの「Off-Session」決済を利用して自動的にチャージが実行されます。
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Method Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <CreditCard className="text-gray-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">お支払い方法</h3>
                <p className="text-xs text-gray-400">決済手段の管理と追加</p>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 p-1 rounded-xl">
              {[
                { id: 'card', label: 'カード', icon: CreditCard },
                { id: 'bank', label: '銀行振込', icon: Building2 },
                { id: 'qr', label: 'QR決済', icon: QrCode },
                { id: 'invoice', label: '請求書', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePaymentTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activePaymentTab === tab.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {activePaymentTab === 'card' && (
                <div className="space-y-4">
                  {wallet?.paymentMethods && wallet.paymentMethods.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {wallet.paymentMethods.map((pm) => (
                        <div key={pm.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                              <span className="text-[10px] font-bold uppercase text-gray-400">{pm.brand}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">•••• •••• •••• {pm.last4}</p>
                              <p className="text-[10px] text-gray-400">有効期限: {pm.expiryMonth}/{pm.expiryYear} • {pm.cardHolder}</p>
                            </div>
                          </div>
                          {pm.isDefault && (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg">デフォルト</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                      <CreditCard className="text-gray-300 mb-3" size={32} />
                      <p className="text-sm font-bold text-gray-400">カードが登録されていません</p>
                      <p className="text-[10px] text-gray-400 mt-1">オートチャージにはカード登録が必要です</p>
                    </div>
                  )}

                  <button 
                    onClick={() => setShowAddCardModal(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-sm text-gray-400 font-bold hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                    新しいカードを追加
                  </button>
                </div>
              )}

              {activePaymentTab === 'bank' && (
                <div className="space-y-4">
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex gap-3">
                      <Info className="text-amber-500 shrink-0" size={18} />
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-amber-900">銀行振込（前払い）</p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          振込手数料はお客様負担となります。入金確認後、1〜2営業日以内に残高に反映されます。
                        </p>
                        <button className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition-all">
                          振込先情報を表示
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePaymentTab === 'qr' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-600 hover:bg-indigo-50 transition-all group">
                      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <Smartphone className="text-red-500" size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">PayPay</span>
                    </button>
                    <button className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-600 hover:bg-indigo-50 transition-all group">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <Smartphone className="text-green-500" size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">LINE Pay</span>
                    </button>
                  </div>
                </div>
              )}

              {activePaymentTab === 'invoice' && (
                <div className="space-y-4">
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex gap-3">
                      <Building2 className="text-indigo-600 shrink-0" size={18} />
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-indigo-900">法人向け請求書払い（後払い）</p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          月額10万円以上のご利用がある法人様限定のプランです。審査が必要となります。
                        </p>
                        <button className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-all">
                          利用申請を行う
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="text-blue-500" size={20} />
                  <h4 className="text-sm font-bold text-gray-900">セキュアな決済環境</h4>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                  お客様の決済情報は国際基準のセキュリティ（PCI DSS）に準拠したStripe社によって安全に保護されています。AMASが直接カード番号を閲覧・保持することはありません。
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">PCI Compliant</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] text-gray-400">領収書の発行は「取引履歴」から行えます</p>
                <button className="text-[10px] text-indigo-600 font-bold hover:underline">
                  詳細設定
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-gray-400" size={20} />
            <h3 className="font-bold text-gray-900">取引履歴</h3>
          </div>
          <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
            すべて見る
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">日付</th>
                <th className="px-6 py-4">内容</th>
                <th className="px-6 py-4">ステータス</th>
                <th className="px-6 py-4 text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.type === 'spend' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                        }`}>
                          {tx.type === 'spend' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.type === 'spend' ? '広告費支払い' : 'デポジットチャージ'}
                          </p>
                          <p className="text-[10px] text-gray-400">{tx.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                        tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.status === 'completed' ? <CheckCircle2 size={10} /> : 
                         tx.status === 'pending' ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                        {tx.status === 'completed' ? '完了' : tx.status === 'pending' ? '保留中' : '失敗'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      tx.type === 'spend' ? 'text-gray-900' : 'text-emerald-600'
                    }`}>
                      {tx.type === 'spend' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                    取引履歴はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCardModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900">カードを追加</h3>
                  <button onClick={() => setShowAddCardModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl">
                    <ShieldCheck className="text-indigo-500 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-xs text-gray-700 leading-relaxed">
                      カード情報は <span className="font-bold">Stripeの安全な決済画面</span>で直接入力されます。
                      AMASのサーバーがカード番号やCVCを受け取ることはありません。
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveCard}
                      disabled={isSavingCard}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      {isSavingCard ? <Loader2 className="animate-spin" size={20} /> : 'Stripeで安全にカードを登録'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4">
                      登録することで、利用規約に同意したものとみなされます。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Charge Modal */}
      <AnimatePresence>
        {showChargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChargeModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900">デポジットをチャージ</h3>
                  <button onClick={() => setShowChargeModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-rose-50 rounded-2xl flex gap-3 text-rose-700 text-sm">
                    <AlertCircle className="shrink-0" size={18} />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">チャージ金額を選択 (10%消費税込み)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[11000, 33000, 55000, 110000, 330000, 550000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setChargeAmount(amount)}
                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                          chargeAmount === amount 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>¥{amount.toLocaleString()}</span>
                          <span className="text-[9px] font-normal opacity-70">
                            内消費税 ¥{Math.floor(amount / 11).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mt-4">
                    <input 
                      type="number"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(Number(e.target.value))}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      placeholder="カスタム金額を入力"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">JPY</span>
                  </div>
                  {chargeAmount > 0 && (
                    <p className="text-[10px] text-gray-400 text-right px-2">
                      ※内消費税 ¥{Math.floor(chargeAmount / 11).toLocaleString()} が含まれます
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <button 
                    onClick={handleCharge}
                    disabled={isCharging || chargeAmount < 1000}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isCharging ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <CreditCard size={20} />
                        決済画面へ進む
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-gray-400">
                    Stripeによる安全な決済が提供されます。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
