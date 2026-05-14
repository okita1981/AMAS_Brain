import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, Zap, BarChart3, PieChart, FileText, Award, Download, Copy, FileJson } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

export type PlanType = 'free' | 'lite' | 'standard' | 'pro' | 'agency';

interface PlatformData {
  name: string;
  share: number;
  spend: number;
  cvi: number;
  momChange?: string;
  isBest?: boolean;
  isWorst?: boolean;
}

interface Strategy {
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  reason: string;
  effect: string;
}

interface DailyData {
  date: string;
  spend: number;
  conversions: number;
  cpa: number;
  cvi_score: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface MonthlyReportTemplateProps {
  plan: PlanType;
  clientName: string;
  logoUrl?: string;
  campaignName: string;
  targetPeriod: string;
  year: string;
  
  // Performance Data
  totalSpend: number;
  totalCv: number;
  avgCvi: number;
  avgCpa: number;
  
  // MoM Data
  spendMom: string;
  cvMom: string;
  cviMom: string;
  cpaMom: string;
  
  // Platform Data
  platforms: PlatformData[];
  
  // AI Content
  aiSummary: string;
  aiPlatformInsights: string;
  nextMonthStrategies: Strategy[];
  aiAutoActions: string[];
  
  // Raw Data for CSV
  dailyData: DailyData[];
  onClose?: () => void;
}

export const MonthlyReportTemplate: React.FC<MonthlyReportTemplateProps> = ({
  plan,
  clientName,
  logoUrl,
  campaignName,
  targetPeriod,
  year,
  totalSpend,
  totalCv,
  avgCvi,
  avgCpa,
  spendMom,
  cvMom,
  cviMom,
  cpaMom,
  platforms,
  aiSummary,
  aiPlatformInsights,
  nextMonthStrategies,
  aiAutoActions,
  dailyData,
  onClose
}) => {
  const isAgency = plan === 'agency';
  const isPro = plan === 'pro' || isAgency;
  const isStandard = plan === 'standard' || isPro;
  const isFree = plan === 'free' || plan === 'lite';

  const isEmpty = totalSpend === 0 && totalCv === 0;

  const handleDownloadPdf = async () => {
    const pages = document.querySelectorAll('.pdf-page');
    if (pages.length === 0) return;

    try {
      // Show loading state or feedback if needed
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Capture each page as a high-quality JPEG
        const dataUrl = await htmlToImage.toJpeg(page, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: i === 0 ? '#0A0F1E' : '#ffffff'
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      pdf.save(`MonthlyReport_${campaignName}_${targetPeriod}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDFの生成に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。');
    }
  };

  const handleDownloadCsv = () => {
    if (isFree) {
      alert('CSVダウンロードはスタンダードプラン以上でご利用いただけます。アップグレードをご検討ください。');
      return;
    }

    // Section 1: Daily Data
    const section1Header = '--- 日次データ ---';
    const section1Data = dailyData.map(d => ({
      '日付': d.date,
      '広告費': d.spend,
      'コンバージョン': d.conversions,
      'CPA': d.cpa,
      'CVIスコア': d.cvi_score
    }));
    
    let csvContent = section1Header + '\n' + Papa.unparse(section1Data, { quotes: true });

    // Section 2: Platform Data
    const section2Header = '--- 媒体別データ ---';
    const section2Data = platforms.map(p => ({
      '媒体名': p.name,
      '予算シェア(%)': p.share,
      '消化金額': p.spend,
      '推定CV数': Math.round(p.spend / (avgCpa || 1)),
      'CPA': avgCpa,
      'CVI貢献度': p.cvi
    }));
    
    csvContent += '\n\n\n' + section2Header + '\n' + Papa.unparse(section2Data, { quotes: true });

    // Section 3: AI Insights
    const section3Header = '--- AIインサイト ---';
    const section3Data = [
      { '項目': 'サマリー', '内容': aiSummary },
      { '項目': '媒体別インサイト', '内容': aiPlatformInsights },
      { '項目': '来月の戦略(全体)', '内容': nextMonthStrategies.map(s => s.action).join(' / ') },
      { '項目': '戦略1', '内容': nextMonthStrategies[0]?.action || '' },
      { '項目': '戦略2', '内容': nextMonthStrategies[1]?.action || '' },
      { '項目': '戦略3', '内容': nextMonthStrategies[2]?.action || '' },
      { '項目': '自動実行アクション', '内容': aiAutoActions.join(', ') },
      { '項目': 'レポート生成日時', '内容': new Date().toLocaleString('ja-JP') }
    ];
    
    csvContent += '\n\n\n' + section3Header + '\n' + Papa.unparse(section3Data, { quotes: true });

    // Add BOM for Japanese Excel
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PerformanceData_${campaignName}_${targetPeriod}.csv`;
    link.click();
  };

  const handleDownloadJson = () => {
    if (!isAgency) return;
    
    const data = {
      clientName,
      campaignName,
      targetPeriod,
      performance: {
        totalSpend,
        totalCv,
        avgCvi,
        avgCpa,
        mom: { spendMom, cvMom, cviMom, cpaMom }
      },
      platforms,
      aiInsights: {
        summary: aiSummary,
        platformInsights: aiPlatformInsights,
        strategies: nextMonthStrategies,
        autoActions: aiAutoActions
      },
      dailyData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ReportData_${campaignName}_${targetPeriod}.json`;
    link.click();
  };

  const [copied, setCopied] = React.useState(false);

  const handleCopyText = () => {
    const text = `
【月次運用報告書：${campaignName}】
期間：${targetPeriod}

■ 今月の実績
広告費：¥${totalSpend.toLocaleString()} (${spendMom})
CV数：${totalCv.toLocaleString()} (${cvMom})
CPA：¥${Math.round(avgCpa).toLocaleString()} (${cpaMom})
CVIスコア：${avgCvi.toFixed(1)} (${cviMom})

■ AIサマリー
${aiSummary}

■ 来月の戦略
${nextMonthStrategies.map((s, i) => `${i + 1}. ${s.action}\n   理由：${s.reason}\n   期待効果：${s.effect}`).join('\n\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="report-container" className="bg-gray-100 p-8 flex flex-col items-center font-sans h-auto overflow-visible min-h-screen">
      {/* Navigation / Header */}
      <div className="w-[794px] mb-6 flex justify-between items-center no-pdf">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
        >
          <TrendingUp className="rotate-[-90deg]" size={16} />
          ← ダッシュボードに戻る
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Report View Mode</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Page 1: Cover */}
      <div className="pdf-page w-[794px] min-h-[1122px] bg-[#0A0F1E] relative p-16 flex flex-col items-center justify-center text-white overflow-visible mb-[48px] break-inside-avoid" id="pdf-page-1">
        <div className="absolute top-20 flex flex-col items-center">
          {isAgency && logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-16 object-contain mb-4" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Zap size={32} className="text-[#0A0F1E] fill-[#0A0F1E]" />
              </div>
              <span className="text-2xl font-black tracking-tighter">AMAS</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center mt-20">
          <h1 className="text-[48px] font-bold mb-4 tracking-tight">月次運用報告書</h1>
          <p className="text-[14px] text-gray-400 tracking-[0.3em] uppercase font-medium">MONTHLY PERFORMANCE REPORT</p>
        </div>

        <div className="absolute bottom-40 w-full px-20 flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Target Period</span>
            <span className="text-xl font-medium">{targetPeriod}</span>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Campaign Scope</span>
            <span className="text-xl font-medium">{campaignName}</span>
          </div>
        </div>

        <div className="absolute bottom-20 flex flex-col items-center gap-4">
          <div className="text-2xl font-bold">Prepared for {clientName} 様</div>
          <div className="text-[10px] text-gray-600 tracking-[0.5em] uppercase font-mono">
            AI GENERATED • CONFIDENTIAL • {year}
          </div>
        </div>
      </div>

      {/* Page 2: Executive Summary */}
      <div className="pdf-page w-[794px] min-h-[1122px] bg-white relative p-16 flex flex-col overflow-visible mb-[48px] break-inside-avoid" id="pdf-page-2">
        <div className="mb-12">
          <h2 className="text-[32px] font-bold text-black mb-1">Executive Summary</h2>
          <p className="text-[14px] text-gray-400 font-medium">エグゼクティブ・サマリー</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* CVI Card */}
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">平均CVIスコア</span>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-bold text-black">{avgCvi.toFixed(1)}</span>
              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${cviMom.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {cviMom.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{cviMom}</span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold uppercase">vs Prev Month</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Efficiency Up</span>
            </div>
          </div>

          {/* CPA Card */}
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">平均CPA</span>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold text-black">¥{Math.round(avgCpa).toLocaleString()}</span>
              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${cpaMom.startsWith('-') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {cpaMom.startsWith('-') ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  <span>{cpaMom}</span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold uppercase">vs Prev Month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 mb-12">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance Metric</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actual Value</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Growth (MoM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4 text-sm font-bold text-gray-900">広告費合計 (Total Spend)</td>
                <td className="py-4 text-right text-base font-bold text-gray-900">¥{totalSpend.toLocaleString()}</td>
                <td className="py-4 text-right">
                  <span className={`text-xs font-bold ${spendMom.startsWith('+') ? 'text-blue-600' : 'text-gray-600'}`}>{spendMom}</span>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-sm font-bold text-gray-900">コンバージョン数 (CV Count)</td>
                <td className="py-4 text-right text-base font-bold text-gray-900">{totalCv.toLocaleString()}</td>
                <td className="py-4 text-right">
                  <span className={`text-xs font-bold ${cvMom.startsWith('+') ? 'text-blue-600' : 'text-gray-600'}`}>{cvMom}</span>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-sm font-bold text-gray-900">CVIスコア (CVI Score)</td>
                <td className="py-4 text-right text-base font-bold text-gray-900">{avgCvi.toFixed(1)}</td>
                <td className="py-4 text-right">
                  <span className={`text-xs font-bold ${cviMom.startsWith('+') ? 'text-blue-600' : 'text-gray-600'}`}>{cviMom}</span>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-sm font-bold text-gray-900">獲得単価 (CPA)</td>
                <td className="py-4 text-right text-base font-bold text-gray-900">¥{Math.round(avgCpa).toLocaleString()}</td>
                <td className="py-4 text-right">
                  <span className={`text-xs font-bold ${cpaMom.startsWith('-') ? 'text-blue-600' : 'text-gray-600'}`}>{cpaMom}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-auto bg-blue-50 rounded-3xl p-8 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest">今月のまとめ</h3>
          </div>
          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
            {isEmpty ? "広告配信が開始されると、ここに分析レポートが自動生成されます。まずはWalletへのチャージとキャンペーンの承認を完了させましょう。" : aiSummary}
          </p>
        </div>
      </div>

      {/* Page 3: Platform Performance */}
      <div className="pdf-page w-[794px] min-h-[1122px] bg-white relative p-16 flex flex-col overflow-visible mb-[48px] break-inside-avoid" id="pdf-page-3">
        <div className="mb-12">
          <h2 className="text-[32px] font-bold text-black mb-1">Platform Performance</h2>
          <p className="text-[14px] text-gray-400 font-medium">媒体別パフォーマンス分析</p>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Budget Share</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Est. Spend</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">CVI Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {platforms.map((p, i) => (
                <tr key={i} className={p.isBest ? 'bg-blue-50/50' : p.isWorst ? 'bg-rose-50/50' : ''}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                        <PieChart size={14} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">{p.share}%</span>
                      <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${p.share}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right text-sm font-medium text-gray-600">¥{p.spend.toLocaleString()}</td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-bold ${p.isBest ? 'text-blue-600' : p.isWorst ? 'text-rose-600' : 'text-gray-900'}`}>
                      {p.cvi.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BarChart3 size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-70">AI Platform Insights</h3>
          </div>
          <p className="text-base font-medium leading-relaxed opacity-90">
            {isEmpty ? "広告配信が開始されると、ここに分析レポートが自動生成されます。" : aiPlatformInsights}
          </p>
        </div>
      </div>

      {/* Page 4: Next Month Strategy */}
      <div className="pdf-page w-[794px] min-h-[1122px] bg-white relative p-16 flex flex-col overflow-visible mb-[48px] break-inside-avoid" id="pdf-page-4">
        <div className="mb-12">
          <h2 className="text-[32px] font-bold text-black mb-1">Next Month Strategy</h2>
          <p className="text-[14px] text-gray-400 font-medium">来月のAI戦略提言</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-12">
          {nextMonthStrategies.map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  s.priority === 'High' ? 'bg-rose-100 text-rose-700' : 
                  s.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  Priority: {s.priority}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strategy {i + 1}</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{s.action}</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Reason</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.reason}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Expected Effect</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.effect}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">AIが自動実行すること</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {aiAutoActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded border border-emerald-500 flex items-center justify-center bg-emerald-50">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-8 border-t border-gray-100 flex flex-wrap gap-4 no-pdf">
          <button 
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A0F1E] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <FileText size={16} />
            📄 PDFダウンロード
          </button>

          {isPro && (
            <button 
              onClick={handleCopyText}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              <Copy size={16} />
              {copied ? 'コピーしました！' : 'レポートテキストをコピー'}
            </button>
          )}
          
          <button 
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            CSVダウンロード
            {isFree && <span className="text-[8px] bg-gray-100 px-1 rounded ml-1">Pro/Agency</span>}
          </button>

          {isAgency && (
            <button 
              onClick={handleDownloadJson}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <FileJson size={16} />
              JSONダウンロード
            </button>
          )}

          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors ml-auto"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-pdf { display: none !important; }
        }
        .pdf-page {
          page-break-after: always;
          page-break-inside: avoid;
        }
      `}} />
    </div>
  );
};
