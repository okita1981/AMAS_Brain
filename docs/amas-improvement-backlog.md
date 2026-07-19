# AMAS Improvement Backlog

- **種別**: 正本（Canonical Document）
- **役割**: P0〜P3全Issueの一元管理。Issueの状態・優先度・根拠・対応Phase・受入条件・Close条件の**正本**はこの文書のみに存在する
- **決定日**: 2026-07-19（Gate 2）
- **運用ルール**: [amas-architecture-review.md](amas-architecture-review.md) と [amas-security-and-wallet-design.md](amas-security-and-wallet-design.md) は、設計上必要な問題をIssue IDで参照するに留め、本文書のIssue全文・statusを複製しない。Issueのstatus更新は本文書でのみ行う
- **出典**: [amas-platform-review-2026-07-19.md](amas-platform-review-2026-07-19.md) §12（Fable Gate 1レビュー）
- **本文書作成時点での検証状態**: 全28件、Fable Gate 1レビュー（読み取り専用）が唯一の根拠であり、Gate 2時点でいずれのIssueも修正・再検証は行っていない。**全件status=Open（P0-6のみOpen / Temporarily Deferred）。Closeされた項目はない。**

---

## P0（本番利用を阻止する問題）

### P0-1｜Firestore wallets updateルールが残高の任意書き換えを許可
- **Priority**: P0
- **観測事実**: `firestore.rules`のwallets updateルールは、オーナー自身が`isValidWallet`（型チェックのみ）を満たせば`balance_total`等を任意額に書き換え可能
- **影響**: チャージなしで広告予算を計上できる。預り金台帳が信頼不能になる
- **根拠**: `firestore.rules:238`
- **status**: Open
- **対応Phase**: Phase 0（Security and Governance）
- **ブロッカー**: Phase 1開始の前提（Wallet台帳再設計の一部）
- **受入条件**: サーバー側検証を経ない残高書き換えがFirestoreルール・API双方で不可能であることを実データで確認
- **検証証跡**: 未検証（Gate 1 Fable Reviewの記載のみ）
- **Close条件**: 上記受入条件をProduction verifiedで満たすこと
- **Parking Lot判定**: Active（Phase 0対応）

### P0-2｜Firestore transactions createでユーザーが完了済み取引を自作可能
- **Priority**: P0
- **観測事実**: `transactions` createルールはユーザー自身が`status:'completed'`・任意額の取引を作成することを許可する（isValidTransactionは型とenumのみ検証）
- **影響**: admin承認フロー（銀行振込等）を完全バイパス可能。会計証跡が偽造されうる
- **根拠**: `firestore.rules:229-231`
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: Phase 1開始の前提
- **受入条件**: ユーザーによる`status:'completed'`取引の自己作成が不可能であることを確認
- **検証証跡**: 未検証
- **Close条件**: 受入条件をProduction verifiedで満たすこと
- **Parking Lot判定**: Active（Phase 0対応）

### P0-3｜全26 APIエンドポイントが無認証
- **Priority**: P0
- **観測事実**: 全Vercel Functions（api/*）がFirebase IDトークン検証を行わず、Admin SDK経由でFirestoreルールもバイパスする。`api/drafts/[id].ts`は所有権チェックなしのGET/DELETEを許可
- **影響**: `userId`を自称するだけで他人のデータ操作（下書き閲覧・削除・キャンペーン強制active化・他人名義アップロード等）が可能
- **根拠**: `lib/http.ts`（認証ヘルパー不在）、`api/drafts/[id].ts:32-40`、`api/campaigns/deploy.ts`、`api/payments/save-card.ts:9`
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: Phase 1開始の前提（Phase 1のGoogle Ads PAUSED入稿は認証済みAPIの上で行う必要がある）
- **受入条件**: 全APIでIDトークン検証必須。無認証リクエストが全エンドポイントで拒否されることを確認
- **検証証跡**: Milestone 1（API認証基盤）のみ検証済み。既存APIへの適用・所有権検証は未検証（下記Milestone参照）
- **Close条件**: 受入条件をProduction verifiedで満たすこと
- **Parking Lot判定**: Active（Phase 0対応）

#### Milestone 1｜API認証基盤

- **状態**: Complete / Verified
- **実装**:
  - サーバー側Firebase ID token検証ヘルパー（`lib/auth.ts`）
  - クライアント側認証fetchヘルパー（`src/lib/apiClient.ts`）
  - Vitest最小テスト基盤（`vitest.config.ts`）
  - GitHub Actions検証workflow（`.github/workflows/unit-a-verification.yml`）
- **Evidence**:
  - commit `f1eaee43ab78810bacb4e93aa13ede9b3aa0bb32`
  - GitHub Actions run `29655579292`
  - Vitest 12/12 PASS
  - production build PASS
  - 実施日 2026-07-19
- **残り**:
  - 既存APIへの認証適用
  - 自己申告userIdの排除
  - 所有権検証
  - 管理者権限検証
  - 対象エンドポイントごとの401/403/200検証
- **Close禁止**: Milestone 1完了だけではP0-3をCloseしない。既存APIへの適用と所有権検証が完了するまでOpenを維持する。
- **既存26 APIは現時点で未保護。**

### P0-4｜deploy.tsが実API呼び出しなしで成功を捏造
- **Priority**: P0
- **観測事実**: `api/campaigns/deploy.ts`は媒体資格情報の有無に関わらず実API呼び出しコードを持たず、`mode:'production'`・`externalId`を捏造してcampaignを`active`化する
- **影響**: ユーザーに「配信中」という虚偽状態を提示する。将来の実API接続時に誤配信・二重配信の温床となる
- **根拠**: `api/campaigns/deploy.ts:59-77`
- **status**: Open
- **対応Phase**: Phase 1（Google Ads PAUSED E2Eで実API呼び出しに置き換える）
- **ブロッカー**: Phase 1完了の必須条件（D6の廃止対象そのもの）
- **受入条件**: 成功偽装パスが完全に除去され、実API呼び出し結果（成功/失敗）のみが状態に反映されることを確認
- **検証証跡**: 未検証
- **Close条件**: Google Ads実API呼び出し経路のみで動作することをProduction verifiedで示すこと
- **Parking Lot判定**: Active（Phase 1対応）

### P0-5｜媒体資格情報のFirestore平文保存
- **Priority**: P0
- **観測事実**: `client_secret`/`developer_token`/`refresh_token`がFirestore usersドキュメントに平文保存され、`deploy.ts`がそのまま読み出す
- **影響**: P0-3（無認証API）と組み合わさると漏洩面が拡大する
- **根拠**: `api/campaigns/deploy.ts:38-55`、`api/auth/google/url.ts:11-20`
- **status**: Open
- **対応Phase**: Phase 0（Secret管理機構の導入）
- **ブロッカー**: Phase 1開始の前提
- **受入条件**: 媒体資格情報がFirestoreに平文保存されず、然るべきSecret管理機構を経由して参照されることを確認
- **検証証跡**: 未検証
- **Close条件**: 受入条件をProduction verifiedで満たすこと
- **Parking Lot判定**: Active（Phase 0対応）

### P0-7｜Client FirestoreとAdmin SDKのdatabase不一致

- **Priority**: P0
- **観測事実**: `src/firebase.ts`（Client）は`getFirestore(app, firebaseConfig.firestoreDatabaseId)`でnamed database（`ai-studio-449e39ee-b303-411e-af3a-a74c5ccb0886`）へ明示的に接続する一方、`lib/firebase.ts`（Admin SDK・Server）は`admin.firestore()`という引数を取らないレガシー名前空間APIを使用していた。このAPIは常にプロジェクトの`(default)`データベースへ接続する（`firebase-admin@13.7.0`の型定義で確認）。`api/payments/webhook.ts`を含む12ファイルすべてがこの`db`を経由してwallets/transactionsへ書き込む
- **影響**: Stripe webhookによる実課金処理が、UIが読み取るnamed databaseとは別のdatabaseへ書き込まれていた可能性がある。実データの所在はUnit DB-A Step 6で読み取り専用確認を試みたが、Firebase CLI認証情報がサンドボックスに存在しないため確認不能（下記Milestone参照）
- **根拠**: `lib/firebase.ts`（修正前）、`node_modules/firebase-admin/lib/firebase-namespace-api.d.ts:43`、`api/payments/webhook.ts:66,90-91`
- **status**: Open
- **対応Phase**: Phase 0（Security and Governance）
- **ブロッカー**: Phase 0完了の必須条件。Unit B1のFirestore Rules本番deployより先に解決すべき（Rulesの内容がどれだけ正しくても、書き込み先DBが違えば無意味なため）
- **受入条件**: Admin SDKがnamed database（`ai-studio-449e39ee-b303-411e-af3a-a74c5ccb0886`）へ接続し、Client/Admin/Rulesの接続先が一致することをProduction verifiedで確認
- **検証証跡**: 未検証（Unit DB-Aでコード修正・CI検証まで実施。本番反映・実データ所在確認は未完了）
- **Close条件**: Production verifiedで接続先一致を確認、かつ実データ所在確認（Step 6）が完了していること
- **Parking Lot判定**: Active（Phase 0対応・最優先）

#### Milestone 1｜Admin SDKのnamed database接続化（Unit DB-A）

- **状態**: 実装済み・CI検証未完了→検証後に追記
- **実装**: `lib/firebase.ts`の`db` exportを`admin.firestore()`から`getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId)`（モジュラーAPI）へ変更。database IDは`firebase-applet-config.json`を唯一のソースとして参照（ハードコード禁止）
- **残り**: 本番反映（mainへのmerge・Vercel Production deploy）、実データ所在の確認（Firebase CLI認証がサンドボックスにないため未実施）、データ移行要否の実施判断
- **Close禁止**: 本Milestone完了だけではP0-7をCloseしない

### P0-8｜firebase.jsonのFirestore Rules deploy targetが`(default)`になる

- **Priority**: P0
- **観測事実**: 修正前の`firebase.json`は`firestore.database`キーを持たないオブジェクト形式であり、firebase-tools（`lib/firestore/fsConfig.js`の`getFirestoreConfig()`）の実装上、`databaseId`が`(default)`に解決される。`firebase deploy --only firestore:rules`を実行した場合、named database（`ai-studio-449e39ee-b303-411e-af3a-a74c5ccb0886`）ではなく`(default)`へRulesがdeployされる。この挙動はfirebase-tools 13.35.1の`getFirestoreConfig()`をネットワーク接続・ログインなしで直接実行し、実際の戻り値で確認した（内部コード読み取りのみに依拠していない）
- **影響**: Unit B1で作成したFirestore Rules（P0-1/P0-2等の修正）が、意図しないdatabaseへdeployされ、named database側は無防備なまま残るリスク
- **根拠**: `firebase.json`（修正前）、`node_modules/firebase-tools/lib/firestore/fsConfig.js:28-36`（実行確認済み）
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: Unit B1のFirestore Rules本番deployの前提条件
- **受入条件**: `firebase.json`が`database`キーを持つオブジェクト形式であり、`--only firestore:rules`実行時にnamed databaseが正しく選択されることを確認
- **検証証跡**: `database`キー追加を実装済み。実deployでの確認は未実施（本番deploy自体が今回のスコープ外）
- **Close条件**: 実際のRules deployでnamed databaseが対象になることをProduction verifiedで確認
- **Parking Lot判定**: Active（Phase 0対応・P0-7と同時解決）

### P0-6｜Secret平文混入（AMAS諸々メモ.docx）
- **Priority**: P0
- **観測事実**: `AMAS諸々メモ.docx`本文にGoogle OAuth Client Secret・Google Ads Developer Token・Meta Access Token・Anthropic API Keyが平文で混入している（OneDrive同期フォルダ上）
- **影響**: Secretの外部漏洩リスク。ローテーション未実施のまま外部公開・実顧客利用に進むと重大インシデントになりうる
- **根拠**: Gate S1読み取り専用確認（2026-07-19）。値は非開示。Git追跡なし・Git履歴なし。ローカル漏洩候補3件（別プロジェクトAisle/AAWと推定・内容未確認）
- **status**: **Open / Temporarily Deferred**
- **reason**: 現行機能の動作確認に既存Credentialが必要なため
- **対応Phase**: Commercial / Financial Go Gate（横断Gate。特定の技術Phaseには紐付けない）
- **ブロッカー**: Phase 0・Phase 1の技術検証（テスト環境・PAUSED入稿・実広告費非消化）はブロックしない。**Commercial / Financial Go Gate通過前の必須Close対象**
- **required_before**: 外部公開・実顧客利用・実広告費を伴う本格運用
- **required_action**: 対象Credentialの失効・再発行／平文文書の無害化／OneDriveを含む再スキャン／Vercel環境変数の差し替え／値を含まない検証記録
- **受入条件**: 上記required_actionがすべて完了し、値を含まない検証記録が作成されていること
- **検証証跡**: 未検証（Gate S1の読み取り専用確認のみ実施済み。ローテーション・削除は未実施）
- **Close条件**: required_action全項目の完了＋値を含まない検証記録の作成
- **Parking Lot判定**: Active（Commercial / Financial Go Gate対応。Parking Lotには入れない）

---

## P1（中心価値・E2E成立を阻害する問題）

### P1-1｜媒体API実接続・SDKが皆無
- **Priority**: P1
- **観測事実**: Google Ads / Meta への実API呼び出しコード・SDKがリポジトリに存在しない。OAuthコールバックはトークン交換未実装（`api/auth/google/callback.ts:10`）。`api/provision-accounts.ts`は`sim_access_...`という偽トークンを保存する
- **影響**: 工程10〜19（入稿〜改善実行）が全て不成立
- **根拠**: `api/auth/google/callback.ts:10`、`api/provision-accounts.ts:29-34`、package.json（媒体SDK不存在）
- **status**: Open
- **対応Phase**: Phase 1（Google Ads PAUSED E2Eで新規実装）
- **ブロッカー**: Phase 1完了の必須条件
- **受入条件**: Google Ads実OAuthトークン交換・実API呼び出しが実装され、テストアカウントで動作確認できること
- **検証証跡**: 未検証
- **Close条件**: Production verifiedでGoogle Ads実接続を確認
- **Parking Lot判定**: Active（Phase 1対応）

### P1-2｜定期実行基盤（cron/キュー）不在
- **Priority**: P1
- **観測事実**: `vercel.json`にcrons設定が存在しない。daily-check等のworkflow APIは手動POST時のみ実行可能
- **影響**: 24時間監視・定期異常検知が物理的に不可能
- **根拠**: `vercel.json`
- **status**: Open
- **対応Phase**: Phase 2（Monitoring and Result Sync）
- **ブロッカー**: Phase 2完了の必須条件（Phase 1はPAUSED入稿までのため定期監視は不要）
- **受入条件**: 定期実行基盤が新設され、監視ジョブが設定間隔で自動実行されることを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで定期実行を確認
- **Parking Lot判定**: Active（Phase 2対応）

### P1-3｜審査・成果・CVIが乱数演出で実データと区別する印がない
- **Priority**: P1
- **観測事実**: 媒体審査（15秒間隔乱数承認）・フリート最適化（CVI乱数加算）・レポート数値（乱数）が、実データと区別する表示なくユーザーに提示される
- **影響**: 課金ユーザーが偽の「審査完了・配信中・成果改善」を実績と誤認するリスク。信頼毀損
- **根拠**: `App.tsx:1913-1965`、`App.tsx:5412-5433`、`App.tsx:2361-2377`
- **status**: Open
- **対応Phase**: Phase 1（Google Ads経路の是正に着手。ただし本Issue自体はPhase 1では完了しない。下記Milestone/Close条件を参照）
- **ブロッカー**: Phase 1完了条件の一部（Google Ads経路のMilestone達成が必要）。ただし本Issue自体のCloseはPhase 1完了の要件ではない
- **Milestone管理**: 本Issueは単一のCloseで管理せず、経路ごとのMilestoneとして進捗を記録する。
  - Milestone 1「Google Ads経路是正」: Google Ads入稿・審査・成果表示から乱数演出・成功偽装が排除され、実データまたは「未取得・未接続・検証環境」の正直な表示に置き換わること（Phase 1で達成を目指す）
  - Milestone 2「全経路是正」: 他媒体・レポート・共通UIを含む、本番到達可能な全経路から乱数・偽装表示が排除されること（Commercial / Financial Go Gateの「D6廃止対象の排除条件」と一致）
- **受入条件**: Milestone 1・Milestone 2の双方が実データで確認できること
- **検証証跡**: 未検証
- **Close条件**: **Milestone 1の達成のみでは本Issueをcloseしない。** Milestone 2まで到達し、Commercial / Financial Go Gateの「D6廃止対象の排除条件」を満たした時点でCloseとする。一部完了（Milestone 1のみ）を全体Closeとして扱わない
- **Parking Lot判定**: Active（Phase 1でMilestone 1着手、完全Close待ちはCommercial / Financial Go Gate対応）

### P1-4｜Stripe Webhook冪等性なし
- **Priority**: P1
- **観測事実**: `api/payments/webhook.ts`にevent.idの重複排除がない
- **影響**: Stripeのリトライで残高二重加算の余地がある
- **根拠**: `api/payments/webhook.ts:36-136`
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計の一部）
- **ブロッカー**: Phase 0完了の必須条件
- **受入条件**: 同一event.idの再送信で残高が二重加算されないことを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで冪等性を確認
- **Parking Lot判定**: Active（Phase 0対応）

### P1-5｜チャージ上限（プラン連動・残高連動）がサーバー側に不在
- **Priority**: P1
- **観測事実**: CLAUDE.md原設計の「今月チャージできる額＝プラン上限−現在の残高」を実装するコードが存在しない
- **影響**: 青天井防止の安全弁が機能せず、資金決済法リスクが増幅する
- **根拠**: `api/payments/webhook.ts`・`api/payments/create-checkout-session.ts`全文
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: Commercial / Financial Go Gateの必須確認事項と直結（資金決済法整理の前提となる技術要件）
- **受入条件**: サーバー側でプラン連動・残高連動のチャージ上限が実装され、上限超過リクエストが拒否されることを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで上限機能を確認
- **Parking Lot判定**: Active（Phase 0対応）

### P1-6｜残高消費・残高0自動停止のロジック不在
- **Priority**: P1
- **観測事実**: 広告費支出でWalletを減額するコードが存在しない。ヘルプAIは「チャージ額以上は絶対に配信されません」と回答するが対応実装がない
- **影響**: 実配信を接続した瞬間に「上限保証」が虚偽になる構造
- **根拠**: `aiService.ts:634-635,683`（回答文言）と、対応する消費コードの不存在
- **status**: Open
- **対応Phase**: Phase 2（実配信を扱う段階で設計・実装）。Phase 1はPAUSED入稿までのため実広告費消化は発生しない
- **ブロッカー**: 実配信を伴うPhaseの開始条件、かつCommercial / Financial Go Gateの前提
- **受入条件**: 残高消費ロジックと残高0時の自動停止が実装され、実データで動作確認できること
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 2対応）

### P1-7｜レガシーデータ自動リセットが実入金を消しうる
- **Priority**: P1
- **観測事実**: `Wallet.tsx`のレガシー判定ロジックが、残高>0かつtransactions未着のスナップショット競合時に本物の残高を0にFirestoreへ書き戻す
- **影響**: 実入金直後に残高が消失しうる
- **根拠**: `Wallet.tsx:155-170`
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計で当該ロジックごと除去）
- **ブロッカー**: Phase 0完了の必須条件
- **受入条件**: 当該レガシーリセットロジックが除去され、競合条件下でも残高が消失しないことを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 0対応）

### P1-8｜承認tasksが非永続
- **Priority**: P1
- **観測事実**: 施策承認のtasksがReactローカルstateのみで保持され、リロードで消失する
- **影響**: 承認境界が記録として残らない
- **根拠**: `App.tsx:2280,2573`
- **status**: Open
- **対応Phase**: Phase 1（D8の人間承認必須要件を満たすために必要）
- **ブロッカー**: Phase 1完了の必須条件
- **受入条件**: 承認tasksがサーバー側に永続化され、承認記録（誰が・いつ）が残ることを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 1対応）

### P1-9｜Client projectとAdmin projectの一致を保証する仕組みがない

- **Priority**: P1
- **観測事実**: `lib/firebase.ts`（修正前）は`FIREBASE_SERVICE_ACCOUNT_KEY`のservice account project_idと、Client設定（`firebase-applet-config.json`のprojectId）の一致を検証せず初期化していた
- **影響**: Vercel環境変数の設定ミスにより、Admin SDKが意図しないFirebaseプロジェクトへ接続しても検知されない
- **根拠**: `lib/firebase.ts`（修正前、初期化ブロック全体）
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: なし（P0-7と根本原因が近いが、project一致とdatabase一致は独立した軸のため別Issueとして管理）
- **受入条件**: project_id不一致時に起動時（コールドスタート時）にfail-fastで例外を投げることを確認
- **検証証跡**: Unit DB-Aで実装・Vitestモックテストを追加。CI検証は本レビュー完了後に追記
- **Close条件**: Production verifiedで不一致検知が機能することを確認（実際に不一致を起こして確認するテストは本番では危険なため、モックテスト＋コードレビューでの確認をもって足りるとする方針は別途合意が必要）
- **Parking Lot判定**: Active（Phase 0対応・P0-7実装の一部として今回同時対応）

### P1-10｜main push即Production反映という運用リスク

- **Priority**: P1
- **観測事実**: Vercel既定のGitHub連携により、`main`へのpush/mergeがそのままProduction deployへ反映される（直近commit時刻とdeployment作成時刻の相関から高確度で推定、Vercel Dashboard上の確定設定は未確認）。CIによる事前検証を経ずに本番へ反映される構造
- **影響**: 検証未了のコードがmainへpushされた瞬間に本番へ反映されるリスク。Database Alignmentのような接続先を変更する変更ほど、事前検証の重要性が高い
- **根拠**: 前回報告（B1 Deployment Readiness Review・Firebase Identity and Database Target Report）§12、Vercel標準のGitHub連携動作
- **status**: Open
- **対応Phase**: Parking Lot（技術Phaseではなく運用ルールの変更で対応。Unit DB-A時点でfeature branch運用（`fix/database-alignment`）を開始することで実務上の緩和を開始した）
- **ブロッカー**: なし
- **受入条件**: feature branch→CI Green→ユーザー合意→mainへmergeというワークフローが標準運用として定着すること
- **検証証跡**: Unit DB-Aから本ワークフローの運用を開始（本Issueとしての受入条件充足はまだ）
- **Close条件**: 運用ルールとして複数Unitにわたり定着したことを確認した時点でClose（技術的な実装物ではなく運用の定着が条件のため、Static/Production verifiedのいずれにも該当しない特殊なClose条件とする）
- **Parking Lot判定**: Parking Lot（運用ルールの定着待ち）

---

## P2（実運用・保守・UXを大きく損なう問題）

### P2-1｜satellite_pages metricsが未認証で更新可能
- **Priority**: P2
- **観測事実**: `firestore.rules`の該当ルールに`isAuthenticated()`判定が欠落しており、公開ページのmetricsが未認証を含む誰でも更新可能
- **影響**: 公開LPの成果数値・CVI偽装が可能
- **根拠**: `firestore.rules:261`
- **status**: Open
- **対応Phase**: Phase 0（ルール全体棚卸しの一部）
- **ブロッカー**: なし（サテライト機能自体がD8の最小実証範囲外のため、Phase 0の一般的セキュリティ強化の一環として扱う）
- **受入条件**: 未認証でのmetrics更新が不可能であることを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 0対応・優先度低）

### P2-2｜レポート数値のハードコード・乱数混入
- **Priority**: P2
- **観測事実**: MoM値のハードコード（例: "+5.2%"）、媒体別CVIへの乱数付与、来月戦略の固定文
- **影響**: 顧客向けレポートが事実に基づかない
- **根拠**: `App.tsx:3261-3296`
- **status**: Open
- **対応Phase**: Parking Lot（着手時期はレポート機能の本格再設計時。ただしClose条件は下記の通りGo Gateと連動する）
- **ブロッカー**: 通常のPhase進行のブロッカーではないが、**Commercial / Financial Go Gateの「D6廃止対象の排除条件」の対象**
- **受入条件**: 本番到達可能なレポート表示から乱数・ハードコード実績が排除され、実データまたは「未取得・未接続」の正直な表示に置き換わること
- **検証証跡**: 未検証
- **Close条件**: **本格再設計の着手だけでCloseしない。** Commercial / Financial Go Gateの「D6廃止対象の排除条件」を満たした時点でCloseとする
- **Parking Lot判定**: Parking Lot（着手時期は柔軟、Close条件はGo Gateと連動）

### P2-3｜クライアント直接残高加算の死にコード残存
- **Priority**: P2
- **観測事実**: `App.tsx`の`handleCharge`（Stripeを介さない残高直接加算）が、現在は無効化されたUI（`{false && ...}`）からのみ到達可能な形で残存
- **影響**: 誤って再有効化すると決済なしチャージが復活するリスク
- **根拠**: `App.tsx:2750-2802`、`App.tsx:5681`
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計時に完全除去）
- **ブロッカー**: なし（現状無効化済みのため緊急性は低いが、再設計時に確実に削除する）
- **受入条件**: 当該コードパスがコードベースから完全に除去されていること
- **検証証跡**: 未検証
- **Close条件**: コード除去をStatic verificationで確認
- **Parking Lot判定**: Active（Phase 0対応）

### P2-4｜storage/uploadが無認証・公開ACL・8MB
- **Priority**: P2
- **観測事実**: `api/storage/upload.ts`が無認証で8MBまでのファイルを公開ACLでアップロード可能にする
- **影響**: 画像ホスティングの踏み台化・コスト増
- **根拠**: `api/storage/upload.ts`
- **status**: Open
- **対応Phase**: Phase 0（P0-3の認証層実装と同時に対応）
- **ブロッカー**: なし
- **受入条件**: 認証済みユーザーのみアップロード可能であることを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 0対応）

### P2-5｜テスト0件・単一10,326行App.tsx
- **Priority**: P2
- **観測事実**: `*.test.*`/`*.spec.*`/CI設定が存在しない。`App.tsx`が単一10,326行
- **影響**: 回帰検証不能・保守困難
- **根拠**: リポジトリ全体調査（実測）
- **status**: Open
- **対応Phase**: Phase 0以降・継続的（再設計と並行してテストを追加していく）
- **ブロッカー**: なし（ただしPhase 1のE2E実証はテストエビデンスを伴うことが望ましい）
- **受入条件**: 新規実装箇所に対応するテストが存在すること（全面的な遡及テスト整備は求めない）
- **検証証跡**: 未検証
- **Close条件**: 継続対応のため単一のClose条件は設定せず、Phaseごとの新規実装にテストが伴うことを運用ルールとする
- **Parking Lot判定**: Active（Phase 0以降・継続）

### P2-6｜audit_logsのID採番がMath.random 9文字
- **Priority**: P2
- **観測事実**: 監査ログのID採番に`Math.random()`由来の9文字が使われている
- **影響**: 衝突時に監査ログ上書きの理論的余地がある
- **根拠**: `App.tsx:2829`
- **status**: Open
- **対応Phase**: Phase 0（監査再設計時に対応）
- **ブロッカー**: なし
- **受入条件**: 衝突耐性のあるID生成方式（UUID等）に置き換わっていることを確認
- **検証証跡**: 未検証
- **Close条件**: Static verificationで確認
- **Parking Lot判定**: Active（Phase 0対応）

### P2-7｜SubmissionSimulator経由deployが常に404
- **Priority**: P2
- **観測事実**: wizardのクライアント採番IDでdeployを呼ぶ経路が、`deploy.ts`が要求するFirestore保存後IDと一致せず常に404となる（もう一方の保存後呼び出し経路は正常）
- **影響**: 現行の一部入稿経路が機能不全（ただし握り潰されてcampaignは保存される）
- **根拠**: `App.tsx:9261,9306-9319` vs `api/campaigns/deploy.ts`
- **status**: Open
- **対応Phase**: Parking Lot（Phase 1で入稿経路自体を再設計するため、現行経路の個別修正は不要）
- **ブロッカー**: なし
- **受入条件**: 該当なし（再設計により経路自体が置き換わる）
- **検証証跡**: 未検証
- **Close条件**: Phase 1の新実装が本経路を代替した時点でClose
- **Parking Lot判定**: Parking Lot

### P2-8｜キーワードボリュームがGemini推定（実データなし）
- **Priority**: P2
- **観測事実**: `api/keywords/volume.ts`はGeminiによる推定値を返し、実媒体データに接続していない
- **影響**: 推定値が実測ボリュームであるかのように提示される
- **根拠**: `api/keywords/volume.ts:45-73`
- **status**: Open
- **対応Phase**: Parking Lot（Phase 3 Assisted Optimization候補）
- **ブロッカー**: なし（D8のPhase 1最小ループはターゲティング精緻化を必須要件としない）
- **受入条件**: 実データ接続時に推定値である旨の明示、または実API接続への置き換え
- **検証証跡**: 未検証
- **Close条件**: Phase 3着手時に再評価
- **Parking Lot判定**: Parking Lot

### P2-9｜Wallet初期作成経路の重複（初期値不一致）

- **Priority**: P2
- **観測事実**: `App.tsx`の`createWallet()`と`Wallet.tsx`独自のwallet作成分岐が、異なる初期値を書き込む（`status`: `'active'` vs `'inactive'`、`autoChargeThreshold`/`autoChargeAmount`: `0`/`0` vs `10000`/`55000`、`Wallet.tsx`側は型定義にない`lastResetAt`をトップレベルに書き込む）
- **影響**: どちらの経路でwalletが作られるかによってユーザーの初期状態が異なる。データ整合性・将来のマイグレーション設計を複雑にする
- **根拠**: Unit B1実装時に発見（`src/App.tsx`のcreateWallet相当ブロック・`src/components/Wallet.tsx:176-193`付近）
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計時に統一）
- **ブロッカー**: なし
- **受入条件**: wallet初期作成経路が単一化され、初期値が一貫することを確認
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで単一経路化を確認
- **Parking Lot判定**: Active（Phase 0対応）

### P2-10｜admin承認処理の非atomic性

- **Priority**: P2
- **観測事実**: 銀行振込等のadmin承認フロー（transactionsの`status`更新と対応するwallet残高更新）が単一のFirestore `runTransaction`で行われず、個別のupdateとして実行されうる（`api/payments/webhook.ts`のStripeパスは`runTransaction`済みだが、admin手動承認パスの実装状況は本Unitでは未精査）
- **影響**: 承認処理の途中でエラーが発生した場合、transaction statusとwallet残高が不整合になるリスク
- **根拠**: Unit DB-Aレビュー時の指摘（詳細コード箇所の特定は未実施、次回精査が必要）
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計時に精査・対応）
- **ブロッカー**: なし
- **受入条件**: admin承認に関わる全てのwallet/transaction更新が単一のFirestore Transactionで行われることを確認
- **検証証跡**: 未検証（該当コード箇所の特定自体が未完了）
- **Close条件**: Production verifiedで確認
- **Parking Lot判定**: Active（Phase 0対応・要追加調査）

### P2-11｜Transaction型とFirestore実データの不一致（未確認・要Step 6完了後再評価）

- **Priority**: P2
- **観測事実**: `types.ts`等のTransaction型定義と、実際にFirestoreへ書き込まれているtransactionsドキュメントの形状（`api/payments/webhook.ts`が書き込むフィールドと、Firestore Rules側の`isValidTransaction`が要求するフィールド）に差異がある可能性がある。ただし本Unitでは実データそのものを確認していない（Step 6が認証不能のためBlocked）ため、差異の実在は未確認
- **影響**: 型定義と実データの乖離が続くと、将来のリファクタ・マイグレーションで見落としが生じるリスク
- **根拠**: コードレビューのみ（`types.ts` vs `api/payments/webhook.ts:118-128` vs `firestore.rules`のtransactions create条件）。実データとの突合は未実施
- **status**: Open
- **対応Phase**: Phase 0
- **ブロッカー**: なし
- **受入条件**: 実データ確認（Step 6相当の作業がFirebase CLI認証復旧後に完了）後、型定義との差異を再評価し必要な修正を行う
- **検証証跡**: 未検証（実データ未確認のため、本Issueの重大性自体が暫定評価）
- **Close条件**: 実データ確認後に再評価し、差異がなければ観察事項としてClose、差異があれば修正後Close
- **Parking Lot判定**: Active（Phase 0対応・Step 6完了待ち）

---

## P3（改善価値はあるが現在のProduct Goalを阻止しない問題）

### P3-1｜package.json name/React バージョンの乖離
- **Priority**: P3
- **観測事実**: package.jsonのnameが"react-example"のまま。React 19系だがCLAUDE.mdはReact 18と記載
- **影響**: 軽微（実害はないが正確性を損なう）
- **根拠**: `package.json:2,32`
- **status**: Open
- **対応Phase**: Parking Lot
- **ブロッカー**: なし
- **受入条件**: package.json name修正・CLAUDE.md記載更新
- **検証証跡**: 未検証
- **Close条件**: 軽微修正の実施時
- **Parking Lot判定**: Parking Lot

### P3-2｜firebase-blueprint.jsonのrole enum不一致
- **Priority**: P3
- **観測事実**: blueprintのrole enum（admin/editor/viewer）とrules/types（admin/user/agent）が不一致。blueprint自体が設計残骸の可能性
- **影響**: 軽微（実行時に参照されていなければ実害なし、要確認）
- **根拠**: `firebase-blueprint.json` vs `firestore.rules:75`
- **status**: Open
- **対応Phase**: Phase 0（認可再設計時に整理）
- **ブロッカー**: なし
- **受入条件**: role定義が単一の正本に統一されること
- **検証証跡**: 未検証
- **Close条件**: Phase 0の認可再設計時にClose
- **Parking Lot判定**: Active（Phase 0対応・優先度低）

### P3-3｜transactionsの二重管理
- **Priority**: P3
- **観測事実**: `wallets.transactions`配列と独立した`transactions`コレクションが併存している
- **影響**: データ整合性リスク（軽微、現状は実害未確認）
- **根拠**: `firestore.rules:27-47`、`App.tsx:2787`
- **status**: Open
- **対応Phase**: Phase 0（Wallet台帳再設計時に単一化）
- **ブロッカー**: なし
- **受入条件**: 取引記録が単一のデータ構造に統一されること
- **検証証跡**: 未検証
- **Close条件**: Phase 0のWallet再設計時にClose
- **Parking Lot判定**: Active（Phase 0対応）

### P3-4｜プラン定義に非提供モデル名の宣伝的記載
- **Priority**: P3
- **観測事実**: プラン定義に"Gemini 1.5 Flash"・"Custom Fine-tuned Models"等、実際には使用していないモデル名が記載されている（実際の使用はgpt-4o/claude-sonnet-4-5/gemini-2.5-flash）
- **影響**: 誇大表示リスク（軽微〜中、景表法的観点では要注意）
- **根拠**: `types.ts:174,197,221,245,269`
- **status**: Open
- **対応Phase**: Parking Lot
- **ブロッカー**: なし（ただしCommercial / Financial Go Gate通過前には見直しが望ましい）
- **受入条件**: プラン記載を実装済みモデルに合わせて修正
- **検証証跡**: 未検証
- **Close条件**: 軽微修正の実施時、遅くともCommercial / Financial Go Gate前に対応
- **Parking Lot判定**: Parking Lot（ただしGo Gate前の見直し対象として記録）

### P3-5｜ヘルプAIが未実装機能を断定回答
- **Priority**: P3
- **観測事実**: ヘルプAIのシステムプロンプトが、オートチャージ・残高0自動停止・GA4連携等の未実装機能を実装済みであるかのように回答する
- **影響**: ユーザーの誤認（P1-6・P1-3と関連）
- **根拠**: `aiService.ts:583-711`
- **status**: Open
- **対応Phase**: Phase 0（早期の信頼性是正として優先）
- **ブロッカー**: なし
- **受入条件**: ヘルプAIの回答が実装状態と一致すること（未実装機能は「未実装」と回答する）
- **検証証跡**: 未検証
- **Close条件**: Production verifiedで回答内容と実装状態の一致を確認
- **Parking Lot判定**: Active（Phase 0対応・信頼性優先のため早期対応推奨）

### P3-6｜docs/はGoogle Ads API申請資料のみ
- **Priority**: P3
- **観測事実**: リポジトリ内`docs/`（Git未追跡）はGoogle Ads APIベーシックアクセス申請資料2点のみで構成されていた（本Backlog作成に伴い、新たに7件の正本・Evidence文書が同ディレクトリへ追加された）
- **影響**: なし（情報記録のみ。申請資料自体は正本体系と別管理）
- **根拠**: `docs/AMAS_GoogleAdsAPI_Application.pdf`, `docs/google-ads-api-application.html`
- **status**: Open（情報記録として）
- **対応Phase**: 該当なし
- **ブロッカー**: なし
- **受入条件**: 該当なし
- **検証証跡**: 該当なし
- **Close条件**: 対応不要（観察事項のため恒常的にOpenのまま保持してよい）
- **Parking Lot判定**: Parking Lot（対応不要の記録事項）

### P3-7｜onDraftRestored型エラー（既知・対応範囲外を継続）

- **Priority**: P3
- **観測事実**: `App.tsx`内の`onDraftRestored`まわりに、Unit A・Unit B1双方で確認済みの既存TypeScriptエラーが残存する（`tsc --noEmit`で検出。両Unitとも意図的に対応範囲外とし、lintをCIワークフローから除外することで回避してきた）
- **影響**: 軽微（型エラーのみ、実行時には影響しない。CIの`lint`ステップを別途走らせると失敗するため、既存2つのUnit workflowは`npm run lint`を意図的に含めていない）
- **根拠**: Unit A Verification Recovery時の`tsc --noEmit`全体実行結果、Unit B1完了報告
- **status**: Open
- **対応Phase**: Parking Lot
- **ブロッカー**: なし
- **受入条件**: 型エラーを修正し、CIワークフローへ`npm run lint`を含められる状態にする
- **検証証跡**: 未検証
- **Close条件**: 型エラー修正後、CIのlintステップがGreenになることを確認
- **Parking Lot判定**: Parking Lot（対応不要ではないが緊急性なし。今回Unit DB-Aでも対応範囲外として維持）

### 銀行振込税計算問題（独立Issue化なし・記録のみ）

Fable Gate 1レビュー由来の候補に「銀行振込の税計算不整合」があったが、当該機能のUI・作成経路（`handleCharge`に付随していた343行の死にコードJSXブロック）はUnit B1（commit `93e6d71`）で完全に削除済みである。表示自体が存在しないため独立Issueとしては登録しない。将来Wallet台帳再設計（Phase 0）で銀行振込チャージ機能を再実装する際に、税計算ロジックを新規設計として扱う。

---

## 集計

| Priority | 件数 | Open | Open/Temporarily Deferred | Closed |
|---|---|---|---|---|
| P0 | 8 | 7 | 1（P0-6） | 0 |
| P1 | 10 | 10 | 0 | 0 |
| P2 | 11 | 11 | 0 | 0 |
| P3 | 7 | 7 | 0 | 0 |
| **合計** | **36** | **35** | **1** | **0** |

**Closeされた項目はない。P0-6は誤ってCloseされていない。P0-7/P0-8/P1-9はUnit DB-Aで実装・CI検証まで進めたが、本番反映・実データ所在確認が未完了のためCloseしていない。**

### 2026-07-19 Unit DB-A（Database Alignment）による追加

新規登録: P0-7, P0-8, P1-9, P1-10, P2-9, P2-10, P2-11, P3-7（計8件）。既存28件のstatusは変更していない。
