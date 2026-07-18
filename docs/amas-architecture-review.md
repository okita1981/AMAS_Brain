# AMAS Architecture Review

- **種別**: 正本（Canonical Document）
- **役割**: 現在地と目標構造。「何を残し・何を再設計し・何を廃止するか」の実体（ファイル・モジュール単位）を規定する
- **決定日**: 2026-07-19（Gate 2）
- **関連文書**: 決定理由は [amas-decision-log.md](amas-decision-log.md)（特にD6）。現状の詳細な証拠は [amas-platform-review-2026-07-19.md](amas-platform-review-2026-07-19.md)。Issue単位の詳細は [amas-improvement-backlog.md](amas-improvement-backlog.md)（Issue IDのみ引用し、全文は複製しない）

---

## 1. 現在の実装

Fable Reviewの証拠強度表（Evidence §4）を要約する。詳細はEvidence文書を参照。

| 領域 | 現状 | 証拠強度 |
|---|---|---|
| AI生成（コピー・バナー・戦略・審査文章） | 実装済み | Code exists＋Static verification only |
| Stripeチャージ | 実装済み（冪等性・上限は未実装） | Code exists＋Static verification only |
| CSV書き出し | 実装済み（唯一実動する「入稿」） | Code exists＋Static verification only |
| 媒体API入稿・OAuth連携 | 成功偽装／偽トークン | Mock |
| 媒体審査・配信・成果・CVI | 乱数演出 | Mock |
| ガードレール・オートチャージ等 | 保存のみ、未参照 | UI only |
| テスト | 皆無 | — |

**構成**: React SPA（App.tsx単一10,326行）＋Vercel Functions 26本＋Firestore＋Firebase Storage＋Stripe。cron/キュー基盤なし。媒体抽象化レイヤーなし。

## 2. 目標アーキテクチャ

D2（媒体複雑性の吸収）・D3（アカウントモデルのユーザー体験統一）・D8（Google Ads PAUSED E2E）を満たす構成:

```
[ユーザー入力] → [生成] → [決定的バリデーション] → [AI審査] → [人間承認]
   → [媒体Adapter（Google Ads先行）] → [PAUSED入稿] → [結果取得]
   → [AMAS状態同期] → [監査記録]
```

- **認証**: 全APIでIDトークン検証を必須化（現状=無認証、Backlog P0-3）。
- **Wallet**: サーバー側で残高・チャージ上限・消費を一元管理する台帳（詳細は[amas-security-and-wallet-design.md](amas-security-and-wallet-design.md)）。
- **媒体Adapter**: Google Ads専用Adapterを最初に実装し、他媒体は共通インターフェースの検証後に追加（D8はGoogle Adsのみ）。
- **スケジューラー**: 定期実行基盤（cron/キュー）を新設（現状=不在、Backlog P1-2）。

## 3. 残す／再設計／廃止（D6の実体化）

### 3.1 残す（コンセプト・ブランド・主要UX・AI生成資産）
- AI生成プロンプト群・生成ロジック: `src/services/aiService.ts`のコピー生成・バナー生成プロンプト構築部分、`api/ai/gpt.ts`・`api/ai/claude.ts`・`api/ai/gemini.ts`・`api/ai/image-generate.ts`のフォールバック構造。
- AI法令審査ロジックの骨格: `api/ai/policy-check.ts`（Gemini審査呼び出し部分。判定結果の反映先は再設計）。
- CSV出力の知見（媒体別レイアウト定義）: `lib/csv.ts`・`api/export/csv.ts`（手動入稿支援として当面維持。API入稿実装後の位置づけはPhase 1〜2で再評価）。
- Stripe Checkout/Webhookの骨格: `api/payments/create-checkout-session.ts`・`api/payments/webhook.ts`（署名検証・税区分の考え方は維持、冪等性・上限は再設計＝3.2）。
- UI/UXデザイン・主要画面構成（ダッシュボード・wizard・Wallet画面の情報設計思想）。
- コンセプト・ブランド（CLAUDE.md冒頭の「今すぐ・誰でも・少額で」）。

### 3.2 再設計
- **認証・認可**: 全API（`api/*`）へのIDトークン検証層の新設。Firestoreルール（`firestore.rules`）の権限穴修正（Backlog P0-1, P0-2, P0-3）。
- **Wallet台帳**: 残高・チャージ上限・消費・冪等性を持つサーバー側台帳へ再設計（現状のクライアント主導残高書き込みを廃止。詳細は[amas-security-and-wallet-design.md](amas-security-and-wallet-design.md)）。
- **承認**: 施策承認（現状Reactローカルstateのみ、Backlog P1-8）をサーバー永続化＋承認記録付きへ再設計。
- **監査**: admin操作のみの現行audit_logs（`App.tsx`内`logAdminAction`）を、AI判断・入稿・残高変動を含む横断監査へ拡張（D7のcommon_id横串履歴パターンを採用検討）。
- **状態遷移**: campaign/wallet/draftの状態機械を、クライアント主導（`setInterval`・ローカルstate依存）からサーバー主導へ再設計。
- **媒体接続**: 実OAuthトークン交換の実装（現状`api/auth/google/callback.ts`・`api/provision-accounts.ts`は未実装・偽トークン、Backlog P1-1）。Google Ads Adapterを新設。
- **データ取得**: 媒体メトリクス取得の仕組みを新設（現状皆無、Backlog該当なし＝完全新規）。
- **スケジューラー**: cron/キュー基盤の新設（現状`vercel.json`にcrons不在、Backlog P1-2）。
- **実行管理**: 冪等な入稿・再実行・部分成功処理を新設（D7のSwitch Media知見＝部分成功・劣化継続パターンを参照）。
- **停止・復旧**: 残高0自動停止・緊急停止・媒体側停止APIとの連携を新設。
- **結果評価・学習**: `api/workflow/learn.ts`（現状書き込みのみ、読み出し不在）を、判断への反映まで含めて再設計。

### 3.3 廃止対象
- `api/campaigns/deploy.ts`の成功偽装パス（実API呼び出しなしで`mode:'production'`を返す部分。Backlog P0-4）。
- wizard内の乱数による媒体審査演出（`App.tsx`の15秒間隔`setInterval`承認ロジック、`SubmissionSimulator`の審査進捗演出）。
- CVIの乱数加算ロジック（フリート最適化・AIヒアリング完了時・レポート生成時の各所、Backlog P1-3・D5参照）。
- `api/provision-accounts.ts`の偽トークン発行（`sim_access_...`）。
- シミュレーションを実機能に見せるあらゆる表示（「シミュレーションである」旨の明示がない箇所全般）。
- クライアント直接残高加算の死にコード（`App.tsx`の`handleCharge`旧経路、Backlog P2-3）。

## 4. 自律ループ

D8のPhase 1で閉じる区間（Evidence §6の断絶区間に対応）:

| 区間 | 現状（Evidence §6） | Phase 1で閉じるか |
|---|---|---|
| 観測 | 断絶 | 部分的に閉じる（Google Ads結果取得のみ） |
| 判断 | 部分（入力データ0のため無意味） | Phase 1では人間判断が主、AI提案は補助 |
| 承認 | 部分（非永続・乱数） | **閉じる**（永続化された人間承認必須） |
| 実行 | 断絶 | **閉じる**（Google Ads PAUSED入稿のみ、実API呼び出し） |
| 結果取得 | 断絶 | **閉じる**（Google Adsからの入稿結果取得） |
| 評価 | 断絶 | Phase 1では対象外（Phase 3以降） |
| 学習 | 断絶 | Phase 1では対象外（Phase 3以降） |

完全自律配信・Financial権限はD8により本Phaseの対象外。

## 5. 状態遷移

- **Campaign**: draft → reviewing → approved(human) → submitted(PAUSED) → [Phase 2以降: active/paused/completed]。現状の`reviewing→active`乱数遷移は廃止（3.3）。
- **Wallet**: 詳細は[amas-security-and-wallet-design.md](amas-security-and-wallet-design.md)。
- **Draft**: 現状の`campaign_drafts`（upsert・非バージョン管理）は、承認境界の前段データとして維持しつつ、承認後は不変スナップショットとして扱う方向へ再設計。

## 6. 媒体Adapter

- D8によりGoogle Ads Adapterのみを先行実装する。
- **D3が未決のため、Adapterのアカウント接続方式（誰が・どの権限で媒体アカウントを保持するか）はオープンな設計課題として残す。** Phase 1はテスト可能なアカウントでの検証に限定し、本課題の解消を待たずに技術実証を進める（D3参照）。
- 表側（ユーザー体験）は媒体によらず統一し、裏側（Adapter実装）は媒体別に最適化する（D3）。
- Switch Mediaの媒体別フィールド契約・文字数制約の業務知識（D7）をAdapterのバリデーション層に反映する。

## 7. 承認境界

- D2のユーザー体験契約（「AMASの提案を確認・承認するだけ」）と、D8の「PAUSED入稿までは人間承認必須」を両立させる。
- 承認は最低限「施策内容の確認」→「PAUSED入稿の承認」の2段階を想定（詳細設計はPhase 1着手時）。
- Financial権限（予算消化・入札変更等の承認）はD8の対象外であり、本Phaseでは設計しない。

## 8. 監査

- 誰が・いつ・何を承認/実行したかを記録する仕組みを新設（現状=admin操作のみ）。
- D7のcommon_id横串履歴パターン（ad-text-generatorの`storage.py`）を参考に、生成→審査→承認→入稿→結果を単一IDで追跡できる設計を検討する。

## 9. 段階的権限

D7・D8を踏まえ、Switch Media側で言語化された「Read-only→Write（PAUSED入稿まで）→Financial（基本渡さない）」の3段階権限モデルをAMASの権限設計の骨子として採用する。Phase 1はWrite（PAUSED入稿まで）の範囲に限定し、Financial権限（予算変更・配信開始・停止）は対象外とする。

## 10. Switch Mediaとの関係

D7の転用区分表（そのままコード再利用可能／設計パターンのみ／業務知識・ルールのみ／再設計が必要／転用しない）をそのまま適用する。詳細はEvidence文書§11。**共通コアの抽出は行わない**（D6）。Switch Media側のコード（`ad-campaign-studio`のreviewer.py・generator.py等）をAMASへ直接importまたは共有パッケージ化することはこの時点では判断しない。

## 未決事項（本文書レベル）

- D3のアカウント所有・管理方式（媒体ごとの検証が必要）。
- Google Ads以外の媒体Adapterの具体設計（D8の範囲外、Phase 5で再検討）。
- 監査ログの技術的実装方式（common_id方式を採用するか、他の設計にするかはPhase 0着手時に確定）。
