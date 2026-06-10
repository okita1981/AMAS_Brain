# CLAUDE.md

> 🧭 **このファイルの一番上 = プロジェクトの最重要指針。** 以下「AMAS のコンセプトとコア」は、すべての実装・仕様判断の基準となる根幹。迷ったら必ずここに立ち返ること。

---

# AMAS のコンセプトとコア（最重要・全判断の基準）

## 誰のための何か
デジタル広告をこれまで導入できなかった人のためのサービス。
予算が限られ代理店に相手にされない、マーケ人材がいない人たち——
町の塗装屋、士業、飲食店の求人など。
代理店主導でもインハウス化が進んでも埋まらない「マーケ難民」のポジションを取る。

## 最優先の価値基準：UI/UX ＞ 精度
このサービスの成否は配信精度ではなく、素人が直感的に使えるかで決まる。
あらゆる実装・仕様判断の基準は「マーケ知識ゼロの個人事業主が、迷わず操作できるか」。
精度の作り込みより、操作のわかりやすさ・少額導線・直感的な成果表示を優先する。

## コア3点 ＝「今すぐ・誰でも・少額で」

### ① 今すぐ：思いついた瞬間に広告を出せる（スピード）
「広告出したい → 今日出せる」までの距離を極限まで短くする。
広告業界はここが異常に重い（見積・打ち合わせ・専門家が必須）。
AMASは 見積不要・打ち合わせ不要・専門家不要 で "広告出したい→出せた" を最短にする。

### ② 誰でも：マーケ知識がなくても成果が理解できる（わかりやすさ）
CTR / CVR / CPA / ROAS といった指標は提供する（上級者やデータを見たい人のために残す）。
ただし、それらを理解しなくても成果がわかる作りを最優先する。
ユーザーが本当に知りたいのは「問い合わせ来た？ 応募来た？ 電話鳴った？」。
専門用語を消すのではなく、専門用語を知らなくても直感的に成果が伝わる
表現・導線を上に重ねる。広告の専門家にならなくていい、がコア。

### ③ 少額で：小さく始められる（心理的ハードルの低さ）
代理店は月20〜50万が普通。だが町の塗装屋は「まず1万円試したい」。
"失敗しても痛くない" が価値。少額チャージ・少額出稿を当たり前にする。

## 実装時の判断指針
- 新機能・仕様変更は、まず「コアを磨くものか、枝葉か」を問う。
- コアの直感性を損なう複雑さは、高機能でも採用しない。
- 仕様変更を厭わず、UI/UX の追求を繰り返す前提で開発する。
- 迷ったら「これは"今すぐ・誰でも・少額で"を強めるか？」に立ち返る。

---

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
