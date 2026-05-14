# CLAUDE.md

## 現在のアーキテクチャ
- フロントエンド: React 18 + Vite
- バックエンド: Express + TypeScript (server.ts)
- データベース: Firebase Firestore
- デプロイ: GitHub → Cloud Run (自動デプロイ)

## AI役割分担
- Claude (claude-sonnet-4-5): 戦略立案・分析・daily-check・budget-rebalance・weekly-report
- GPT-4o: コピー生成・クリエイティブ生成
- GPT Image 2 (gpt-image-1): バナー画像生成
- Gemini (gemini-1.5-flash): フォールバック

## 次回やること
- バナーのテキスト二重表示の修正
- claude-adsの組み込み検討
- Geminiフォールバックのモデル名修正
- デプロイ先の変更検討（Aisleサイト内への展開）
- mureoワークフローのUI組み込み
- バナー生成プロンプトの品質改善

## 環境変数（Cloud Run app-containerに設定済み）
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
