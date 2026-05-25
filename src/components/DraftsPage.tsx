// 下書き一覧ページ。
// ad-campaign-studio の DraftsPage.tsx を AMAS のライトテーマで移植。
// 一覧表示・検索・状態フィルター・復元・削除を提供。
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Search, Trash2, X } from 'lucide-react';
import type { Draft, DraftSummary } from '../types';
import { deleteDraft, getDraft, listDrafts } from '../services/aiService';

function formatDate(ms: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function StatusBadge({ status }: { status: 'draft' | 'completed' }) {
  if (status === 'completed') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        完了
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
      下書き
    </span>
  );
}

function DeleteConfirmDialog({
  draftName,
  onConfirm,
  onCancel,
}: {
  draftName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">本当に削除しますか？</p>
            <p className="text-gray-500 text-xs mt-0.5 break-all">「{draftName}」を削除します。</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs mb-5">この操作は元に戻せません。</p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}

export interface DraftsPageProps {
  userId: string;
  // 復元ボタン押下時に呼ばれる。呼び出し元(App)で activeTab を切り替え、
  // NewCampaignWizard に initialDraft を渡す責務を持つ。
  onRestore: (draft: Draft) => void;
}

export default function DraftsPage({ userId, onRestore }: DraftsPageProps) {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftSummary | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'completed'>('all');

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await listDrafts(userId);
      setDrafts(list);
    } catch (err: any) {
      setDrafts([]);
      setLoadError(err?.message || '下書きの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) reload();
  }, [userId, reload]);

  const handleRestore = async (summary: DraftSummary) => {
    setRestoringId(summary.id);
    try {
      const full = await getDraft(summary.id);
      onRestore(full);
    } catch (err: any) {
      alert(err?.message || '下書きの読み込みに失敗しました');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);
    try {
      await deleteDraft(target.id);
      setDrafts(prev => prev.filter(d => d.id !== target.id));
    } catch (err: any) {
      alert(err?.message || '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDrafts = useMemo(() => {
    return drafts.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [drafts, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {deleteTarget && (
        <DeleteConfirmDialog
          draftName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div>
        <h3 className="text-xl font-bold text-gray-900">過去のキャンペーン</h3>
        <p className="text-xs text-gray-500 mt-1">
          保存した下書きを読み込んで編集・再入稿できます
        </p>
      </div>

      {/* 検索バー */}
      {!loading && drafts.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="キャンペーン名で検索"
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                aria-label="クリア"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-bold text-gray-600 shrink-0">状態：</label>
            <div className="flex gap-2">
              {(['all', 'draft', 'completed'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? 'すべて' : s === 'draft' ? '下書き' : '完了'}
                </button>
              ))}
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="text-xs text-gray-400 hover:text-gray-900 ml-auto"
              >
                絞り込みをリセット
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
          <p className="text-sm font-bold text-red-700">下書きの取得に失敗しました</p>
          <p className="text-xs text-red-600 mt-1">{loadError}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
          >
            再試行
          </button>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-sm font-bold text-gray-700">保存された下書きはありません</p>
          <p className="text-xs text-gray-400 mt-2">
            新規入稿ウィザードのフッターから「下書き保存」できます
          </p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm text-gray-500">条件に一致する下書きが見つかりませんでした</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="mt-3 text-xs text-blue-600 hover:underline"
          >
            絞り込みをリセット
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
            <span>キャンペーン名</span>
            <span className="text-center">ステータス</span>
            <span className="text-right">最終更新</span>
            <span className="text-right">操作</span>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredDrafts.map(d => {
              const isRestoring = restoringId === d.id;
              const isDeleting = deletingId === d.id;
              return (
                <div
                  key={d.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-4 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{d.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">作成: {formatDate(d.createdAt)}</p>
                  </div>
                  <div className="flex justify-center">
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-gray-500 text-right whitespace-nowrap">
                    {formatDate(d.updatedAt)}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleRestore(d)}
                      disabled={isRestoring || isDeleting}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          読込中…
                        </>
                      ) : (
                        <>
                          <Edit3 size={12} />
                          編集・再入稿
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(d)}
                      disabled={isRestoring || isDeleting}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40"
                      title="削除"
                      aria-label="削除"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {filteredDrafts.length !== drafts.length
            ? `${filteredDrafts.length}件 / 全${drafts.length}件`
            : `全${drafts.length}件`}
        </p>
      )}
    </div>
  );
}
