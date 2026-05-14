import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "申し訳ありません。エラーが発生しました。";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "アクセス権限がありません。管理者にお問い合わせください。";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
            <p className="text-gray-600 mb-8">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all"
            >
              アプリを再読み込みする
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
