import React from 'react';
import { Zap, Terminal } from 'lucide-react';
import { Transaction } from '../types';

interface PlatformSpend {
  platform: string;
  campaignName?: string;
  amount: number; // Net amount (Excl. Tax)
  tax?: number;
  subtotal?: number;
}

interface InvoiceSummary {
  openingBalance: number; // Incl. Tax
  openingBalanceTax: number;
  totalDeposits: number; // Incl. Tax
  totalDepositsTax: number;
  totalAdSpendExclTax: number;
  totalAdSpendTax: number;
  totalAdSpendInclTax: number;
  closingBalance: number; // Incl. Tax
  closingBalanceTax: number;
  closingBalanceAdBudget: number;
}

interface InvoiceTemplateProps {
  transactions: Transaction[];
  platformSpend: PlatformSpend[];
  summary: InvoiceSummary;
  companyName: string;
  address: string;
  phone: string;
  taxId: string;
  period: string;
  issuerName?: string;
  issuerAddress?: string;
  issuerTaxId?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  transactions,
  platformSpend,
  summary,
  companyName,
  address,
  phone,
  taxId,
  period,
  issuerName,
  issuerAddress,
  issuerTaxId
}) => {
  return (
    <div className="bg-gray-100 p-8 flex flex-col items-center font-sans">
      <div className="pdf-page w-[794px] min-h-[1123px] bg-white relative pl-[85px] pr-20 py-16 flex flex-col shadow-2xl mb-8" id="invoice-page">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
              <Zap size={28} className="fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">AMAS</h1>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Autonomous Marketing Agent System</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-gray-900 mb-1">広告運用明細書</h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Ad Performance Statement</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          {/* Customer Info */}
          <div className="space-y-4">
            <div className="border-l-4 border-black pl-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">宛先 / BILL TO</p>
              <h3 className="text-2xl font-bold text-gray-900">{companyName || 'お客様'} 御中</h3>
            </div>
            <div className="pl-5 space-y-1 text-sm text-gray-600">
              {address && <p>{address}</p>}
              {phone && <p>TEL: {phone}</p>}
              {taxId && <p>登録番号: {taxId}</p>}
            </div>
          </div>

          {/* Issuer Info */}
          <div className="relative">
            <div className="space-y-4 text-right">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">発行者 / ISSUER</p>
                <h3 className="text-xl font-bold text-gray-900">{issuerName || 'AMAS 運用事務局'}</h3>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {issuerAddress ? (
                  issuerAddress.split('\n').map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <>
                    <p>〒150-0002 東京都渋谷区渋谷2-24-12</p>
                    <p>渋谷スクランブルスクエア</p>
                  </>
                )}
                <p>登録番号: {issuerTaxId || 'T1234567890123'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Period */}
        <div className="mb-8 pb-4 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">対象期間 / PERIOD</p>
          <p className="text-lg font-bold text-gray-900">{period}</p>
        </div>

        {/* Tables Section */}
        <div className="flex-1 space-y-10">
          {/* 1. Ad Spend Breakdown */}
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-black"></div>
              ① 広告運用内訳（媒体 / キャンペーン） / AD PERFORMANCE BREAKDOWN
            </h3>
            {platformSpend.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[40%]">運用内訳 (媒体/キャンペーン)</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-[20%]">運用金額 (税抜)</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-[20%]">消費税 (10%)</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-[20%]">小計 (税込)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {platformSpend.map((s, i) => {
                    const tax = s.tax ?? Math.floor(s.amount * 0.1);
                    const subtotal = s.subtotal ?? (s.amount + tax);
                    return (
                      <tr key={i} className="group">
                        <td className="py-3">
                          <p className="text-xs font-bold text-gray-900">
                            {s.platform} {s.campaignName ? <span className="text-gray-400 font-normal">({s.campaignName})</span> : ''}
                          </p>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs font-medium text-gray-900">¥{s.amount.toLocaleString()}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs font-medium text-gray-900">¥{tax.toLocaleString()}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs font-bold text-gray-900">¥{subtotal.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900 bg-gray-50">
                    <td className="py-3 text-xs font-black text-gray-900">合計</td>
                    <td className="py-3 text-right text-xs font-black text-gray-900">¥{summary.totalAdSpendExclTax.toLocaleString()}</td>
                    <td className="py-3 text-right text-xs font-black text-gray-900">¥{summary.totalAdSpendTax.toLocaleString()}</td>
                    <td className="py-3 text-right text-xs font-black text-gray-900">¥{summary.totalAdSpendInclTax.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                <p className="text-sm font-bold text-gray-400">対象期間の利用実績はありません。</p>
              </div>
            )}
          </div>

          {/* 2. Wallet Activity (Deposits) */}
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-black"></div>
              ② 入金履歴 / DEPOSIT HISTORY
            </h3>
            {transactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">日付 / DATE</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">項目 / DESCRIPTION</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">チャージ額(税込) / CHARGE (INCL. TAX)</th>
                    <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">内消費税(10%) / TAX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="group">
                      <td className="py-3 text-xs font-mono text-gray-500">
                        {new Date(t.timestamp).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3">
                        <p className="text-xs font-bold text-gray-900">
                          {t.description || (t.type === 'credit_card' ? 'クレジットカードチャージ' : '銀行振込チャージ')}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs font-bold text-gray-900">¥{t.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs font-medium text-gray-900">¥{Math.floor(t.amount - (t.amount / 1.1)).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                <p className="text-sm font-bold text-gray-400">対象期間の入金履歴はありません。</p>
              </div>
            )}
          </div>
        </div>

        {/* Balance Summary Section */}
        <div className="mt-8 border-t-2 border-black pt-8">
          {/* Wallet Stats (Moved to bottom) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 text-white p-5 rounded-2xl h-[100px] flex flex-col justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">総残高 (税込)</p>
              <p className="text-2xl font-black">¥{summary.closingBalance.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl h-[100px] flex flex-col justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-gray-500">広告運用予算 (税抜)</p>
              <p className="text-2xl font-black text-gray-900">¥{summary.closingBalanceAdBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl h-[100px] flex flex-col justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-gray-500">消費税預り金</p>
              <p className="text-2xl font-black text-gray-900">¥{summary.closingBalanceTax.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mb-4">
            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">残高サマリー / BALANCE SUMMARY</p>
            <p className="text-[9px] text-gray-400 font-mono whitespace-nowrap">※翌月繰越(税込)＝前月繰越(税込)＋当月チャージ(税込)－当月利用合計(税込)</p>
          </div>
          <div className="bg-black text-white rounded-2xl p-8 grid grid-cols-5 gap-4 items-center">
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">前月繰越(税込)</p>
              <p className="text-lg font-bold">¥{summary.openingBalance.toLocaleString()}</p>
              <p className="text-[7px] text-gray-500 mt-1">内消費税¥{summary.openingBalanceTax.toLocaleString()}</p>
            </div>
            <div className="text-center text-gray-500 text-xl font-light">+</div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">当月チャージ(税込)</p>
              <p className="text-lg font-bold text-blue-400">¥{summary.totalDeposits.toLocaleString()}</p>
              <p className="text-[7px] text-blue-900 mt-1">内消費税¥{summary.totalDepositsTax.toLocaleString()}</p>
            </div>
            <div className="text-center text-gray-500 text-xl font-light">－</div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">当月利用合計(税込)</p>
              <p className="text-lg font-bold text-rose-400">¥{summary.totalAdSpendInclTax.toLocaleString()}</p>
              <p className="text-[7px] text-rose-900 mt-1">内消費税¥{summary.totalAdSpendTax.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end items-center gap-6">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">翌月繰越残高(税込) / CLOSING BALANCE</p>
            <p className="text-3xl font-black text-emerald-600">¥{summary.closingBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span>AMAS - AUTONOMOUS MARKETING AGENT SYSTEM • PERFORMANCE STATEMENT</span>
          </div>
          <span>ISSUED: {new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{String(new Date().getDate()).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
};
