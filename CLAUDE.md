# CLAUDE.md

## 位置づけ
本プロジェクトは **Aisle（出現設計フレームワーク）の実装・実行レイヤー**。設計思想・ID体系（S/T/C/P/M/A/K/E-ID）はAisle側で定義され、AMASはそれを広告運用自動化として実装する。

- **Aisle 設計・資料**：`C:\Users\kousu\OneDrive\Desktop\CLAUDE Aisle\`
- **AMAS 紹介資料・規約**：`C:\Users\kousu\OneDrive\Desktop\AMAS\`
- 物理的にはフォルダ分離（OneDrive同期・Cloud Runデプロイ単位・依存関係が独立しているため）。
- 設計の話はAisle側のセッションで、実装の話はここで対応する。

## 現在のアーキテクチャ
- フロントエンド: React 18 + Vite
- バックエンド: Express + TypeScript (server.ts)
- データベース: Firebase Firestore
- デプロイ: GitHub → Cloud Run自動デプロイ (AMAS Projectプロジェクト, us-west1)

## AI役割分担
- Claude (claude-sonnet-4-5): 戦略立案・分析・daily-check・budget-rebalance・weekly-report
- GPT-4o: コピー生成・クリエイティブ生成
- GPT Image 2 (gpt-image-1): バナー画像生成（日本語テキスト込み一発生成）
- Gemini (gemini-2.5-flash-preview-05-20): フォールバック

## 環境変数（Cloud Run app-containerに設定済み）
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

## 次回やること
- バナーのテキスト二重表示の修正
- claude-adsの組み込み検討
- Geminiフォールバックの動作確認
- デプロイ先の変更検討（Aisleサイト内への展開）
- mureoワークフローのUI組み込み
- バナー生成プロンプトの品質改善
