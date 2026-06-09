# CLAUDE.md

## 位置づけ
本プロジェクトは **Aisle（出現設計フレームワーク）の実装・実行レイヤー**。設計思想・ID体系（S/T/C/P/M/A/K/E-ID）はAisle側で定義され、AMASはそれを広告運用自動化として実装する。

- **Aisle 設計・資料**：`C:\Users\kousu\OneDrive\Desktop\CLAUDE Aisle\`
- **AMAS 紹介資料・規約**：`C:\Users\kousu\OneDrive\Desktop\AMAS\`
- 物理的にはフォルダ分離（OneDrive同期・Cloud Runデプロイ単位・依存関係が独立しているため）。
- 設計の話はAisle側のセッションで、実装の話はここで対応する。

## 現在のアーキテクチャ
- フロントエンド: React 18 + Vite
- バックエンド: Vercel Functions (api/*.ts, @vercel/node)
- 共通モジュール: lib/firebase.ts, lib/stripe.ts, lib/claude.ts, lib/csv.ts, lib/http.ts
- データベース: Firebase Firestore（サーバ側は FIREBASE_SERVICE_ACCOUNT_KEY 環境変数で初期化）
- ストレージ: Firebase Storage（バナー画像）
- デプロイ: GitHub → Vercel自動デプロイ

## AI役割分担
- Claude (claude-sonnet-4-5): 戦略立案・分析・daily-check・budget-rebalance・weekly-report
- GPT-4o: コピー生成・クリエイティブ生成
- GPT Image 2 (gpt-image-1): バナー画像生成（日本語テキスト込み一発生成）
- Gemini (gemini-2.5-flash): フォールバック

## 環境変数（Vercel プロジェクトに設定）
実コードが参照する必須14変数（+任意1）。

### AI / LLM
- OPENAI_API_KEY（コピー/バナー生成・KWサジェスト）
- ANTHROPIC_API_KEY（戦略立案・分析・各種ワークフロー）
- GEMINI_API_KEY（フォールバック生成・KWボリューム推定）

### 決済（Stripe）
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

### Firebase（サーバ側）
- FIREBASE_SERVICE_ACCOUNT_KEY（サービスアカウントJSON全体を文字列で）
- FIREBASE_STORAGE_BUCKET（任意。未設定時は `<project_id>.appspot.com`）

### Google Ads API ※ベーシックアクセス審査中。本番接続まで**ダミー値でデプロイ**予定
- GOOGLE_ADS_CLIENT_ID
- GOOGLE_ADS_CLIENT_SECRET
- GOOGLE_ADS_DEVELOPER_TOKEN
- GOOGLE_ADS_REFRESH_TOKEN（審査通過後に取得）

### Meta 広告 API ※現状未接続。接続まで**ダミー値でデプロイ**予定
- META_APP_ID
- META_APP_SECRET
- META_ACCESS_TOKEN

### アプリ基底URL
- APP_URL（OAuth/Stripe コールバックURLの基底。Deploy後に確定URLへ更新）

## 次回やること
- 【次回開始】環境変数（上記「環境変数」セクション参照）をVercelに設定してDeployする。Google Ads / Meta 系は審査中・未接続のためダミー値で登録
- 各APIキーをAMAS専用に新規発行してから設定すること
- バナーのテキスト二重表示の修正
- claude-adsの組み込み検討
- Geminiフォールバックの動作確認
- デプロイ先の変更検討（Aisleサイト内への展開）
- mureoワークフローのUI組み込み
- バナー生成プロンプトの品質改善
-【課題】KWボリューム推定をGemini推定からGoogle Ads API（generateKeywordIdeas）の実データに移行する（Google Ads API接続後に対応）
