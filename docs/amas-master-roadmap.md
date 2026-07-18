# AMAS Master Roadmap

- **種別**: 正本（Canonical Document）
- **役割**: どの順番で到達するか
- **決定日**: 2026-07-19（Gate 2）
- **関連文書**: 各PhaseのIssue対応は [amas-improvement-backlog.md](amas-improvement-backlog.md) をIssue IDで参照（全文複製しない）。Phase設計の根拠は [amas-decision-log.md](amas-decision-log.md)（特にD6・D8）

---

## 現在地（2026-07-19時点）

**Phase 0未着手。Gate 2（合意内容の正本化）完了直後の状態。**

- Fable Gate 1レビュー: 完了（Evidence化済み）
- Gate 2（本文書を含む7文書（6正本＋1 Evidence）の作成）: 完了
- Phase 0（Security and Governance）: 未着手
- コード実装・Firestore Rules変更・API変更・環境変数変更・デプロイ状態変更: **一切未実施**
- P0-6（Secret平文混入）: **2026-07-19時点のスナップショット**＝Open / Temporarily Deferred（Commercial / Financial Go Gate前の必須Close対象、開発停止条件ではない）。**最新statusは必ず [amas-improvement-backlog.md](amas-improvement-backlog.md) を参照すること（本文書のstatus記載は更新しない）**

---

## Phase 0｜Security and Governance

**目的**: 実行アーキテクチャ再構築の土台となる認証・認可・Wallet台帳・監査の基礎を整備する。

**開始条件**: Gate 2の合意完了（本文書を含む7文書（6正本＋1 Evidence）の作成完了）。

**完了条件**:
- Backlogの「対応Phase: Phase 0」に該当する全Issueがstatus=Closeになること。該当Issue: **P0-1, P0-2, P0-3, P0-5, P1-4, P1-5, P1-7, P2-1, P2-3, P2-4, P2-6, P3-2, P3-3, P3-5**（詳細・受入条件は[amas-improvement-backlog.md](amas-improvement-backlog.md)参照）
- 認証・認可・Wallet台帳・監査の再設計がProduction verifiedで動作確認されること
- **テスト基盤の起動**: 本Phaseで新設・変更した認証・認可・Wallet台帳・監査の各モジュールに対応するテストが存在すること（全面遡及テストの整備は求めない。詳細は後述「テスト・品質の横断要件」章）

**検証証跡**: 未着手のため該当なし。

---

## Phase 1｜Google Ads PAUSED E2E

**目的**: D8（Decision Log）で確定した最小E2E実証を1本通す。

**開始条件**: Phase 0完了。

**範囲（D8を参照。ここでは繰り返さず要点のみ）**: Google Ads・1キャンペーン・テスト可能なアカウント・人間承認必須・PAUSED入稿まで・実広告費非消化・乱数/Mock/成功偽装なし・監査記録あり。

**目標ループ**:
```
入力 → 生成 → 決定的バリデーション → AI審査 → 人間承認
→ Google AdsへPAUSED入稿 → 結果取得 → AMAS上の状態同期 → 監査記録
```

**完了条件**:
- Backlogの「対応Phase: Phase 1」に該当する全Issueがstatus=Closeになること。該当Issue: **P0-4, P1-1, P1-8**
- **P1-3はPhase 1完了時点でCloseしない。** P1-3はGoogle Ads経路における乱数審査・乱数成果の除去が完了した時点で、P1-3のIssue内Milestone（「Google Ads経路: 完了」）として記録するに留める。P1-3自体のClose条件はCommercial / Financial Go Gate（本文書の該当章参照）と一致させ、他媒体・レポート・共通UIを含む本番到達可能な全経路から乱数・偽装表示が排除されるまでOpenを維持する（詳細は[amas-improvement-backlog.md](amas-improvement-backlog.md) P1-3参照）
- 上記目標ループがテストアカウントで1本、乱数・Mock・成功偽装を含まずに実行され、結果がProduction verifiedで確認されること
- 証拠強度がCode existsやStatic verification onlyで止まらず、Test evidence exists／Production verifiedに到達すること（Evidence文書§15の基準を継承）
- **横断品質要件（後述「テスト・品質の横断要件」章）に基づき、Phase 1で新規実装した範囲に対応するテストが存在すること**

**検証証跡**: 未着手のため該当なし。

---

## Phase 2｜Monitoring and Result Sync

**目的**: Phase 1で閉じた単発ループを、定期的な結果取得・状態同期へ拡張する。

**開始条件**: Phase 1完了。

**範囲**: 定期実行基盤（cron/キュー）の新設、Google Ads結果の定期取得、実配信を扱う場合の残高消費・残高0自動停止ロジック（実配信をこのPhaseで扱うかはPhase 1完了時の判断次第。Financial権限自体はD8により対象外のまま）。

**完了条件**:
- Backlogの「対応Phase: Phase 2」に該当する全Issueがstatus=Closeになること。該当Issue: **P1-2, P1-6**
- 定期実行基盤が実データでProduction verifiedに到達すること

**検証証跡**: 未着手のため該当なし。

---

## Phase 3｜Assisted Optimization

**目的**: 改善提案（budget-rebalance等）を「提示のみ」から「人間承認を経た適用」まで接続する。

**開始条件**: Phase 2完了。

**範囲**: 改善判断の適用経路の実装。KWボリューム推定の実データ接続検討（Backlog P2-8）。CVIの正式定義再検討条件（D5）が満たされていればここで再評価。

**完了条件**: Phase開始時に詳細化する（現時点では方向性のみ）。

**検証証跡**: 未着手のため該当なし。

---

## Phase 4｜Guardrailed Automation

**目的**: ガードレール（日次上限・自律承認しきい値等）を実際に機能させ、条件内自動実行を一部の操作に導入する。

**開始条件**: Phase 3完了。Financial権限の導入可否はCommercial / Financial Go Gate通過が前提。

**範囲**: Phase開始時に詳細化する。

**検証証跡**: 未着手のため該当なし。

---

## Phase 5｜Multi-platform Expansion

**目的**: Google Ads以外の媒体（Meta等）へAdapterを拡張する。

**開始条件**: Phase 4完了、かつD3（広告アカウントモデル）の未決事項（媒体ごとの所有・管理方式）が確定していること。

**範囲**: Meta Adapter等の追加。共通コア抽出の判断（D6の再検討条件＝AMASとSwitch Media双方で同一の責務・データ契約・ライフサイクルが実証された後）もこの段階以降で扱いうるが、自動的には発生しない。

**検証証跡**: 未着手のため該当なし。

---

## テスト・品質の横断要件（R-04・P2-5対応）

**位置づけ**: P2-5（テスト0件・単一10,326行App.tsx）のIssue正本は引き続き [amas-improvement-backlog.md](amas-improvement-backlog.md) に置く。本章はP2-5をRoadmapの各Phaseへ接続する横断的な運用ルールであり、Issueの内容・statusを複製しない。

- **Phase 0からテスト基盤を開始する**（テストランナー・最小の実行環境整備を含む）。
- **各Phaseで、そのPhaseの変更に対応するテストを追加する。** 既存コード全体への遡及的なテスト整備は、いずれのPhaseにおいても一括の完了条件にしない（無制限スコープにしない）。
- **コード存在・ビルド成功だけをPhase完了条件にしない。** 各Phaseの完了条件は、当該Phaseで変更した範囲のテスト存在＋実データ／テストアカウントでの検証（Production verified）の両方を満たすことを要する。
- 上記はPhase 0〜5共通の運用ルールとして適用する（各Phase章の完了条件に個別の一文を置く場合も、詳細はここを参照する）。

---

## Commercial / Financial Go Gate（横断Gate）

**位置づけ**: 特定のPhaseに埋め込まれた条件ではなく、**すべてのPhaseを横断する独立したGate**。Phase 0〜Phase 5の技術開発の進行はこのGateによってブロックされない。**ただし、以下のいずれかに進む前には本Gateの通過が必須**:

- 外部公開
- 実顧客利用
- 実広告費を伴う配信
- Walletへの実顧客資金の受入
- AMAS管理アカウントによる商用運用

**逆に、以下は本Gate通過前でも進めてよい**:
- Google AdsへのPAUSED入稿（Phase 1）
- テスト環境での技術検証
- 実広告費を消化しない範囲での動作確認

### 必須確認事項

- Wallet前払いモデルの法的整理
- チャージ額、税相当額、配信可能額の会計処理
- インボイス・端数処理
- 未使用残高・返金・失効の扱い
- AMASサブスクと広告費の分離
- Google Ads等のアカウント所有・管理方式（D3の未決部分の確定）
- 媒体規約
- 利用規約
- Secretローテーション（P0-6のClose）
- P0全件のClose（[amas-improvement-backlog.md](amas-improvement-backlog.md) のP0セクション参照）
- 実広告費を伴う操作の承認境界

### D6廃止対象の排除条件（R-03・追加）

**注意**: 以下は「開発用Mock自体の存在を禁止する」という意味ではない。開発・テスト目的のMock/Fixtureは、本番到達可能経路から明確に隔離されている限り存在してよい。

- **本番到達可能なUI/API/Workflowから**、乱数審査・乱数成果・乱数CVI・ハードコード実績・偽OAuth・成功偽装を排除すること
- MockやFixtureを残す場合は、本番経路から**物理的・設定的に隔離**されていること
- ユーザーがMockを実データと誤認**できない**表示・構造になっていること
- **production modeでMockへフォールバックしない**こと
- 実データ未取得の場合は、偽の数値ではなく**「未取得」「未接続」「検証環境」**と表示すること
- **P1-3およびP2-2は、上記条件を満たすまでCloseしない**（[amas-improvement-backlog.md](amas-improvement-backlog.md)参照。部分的なGoogle Ads経路の是正のみでは本条件を満たさない）
- 上記の検証証跡（実データでの確認）を本Gate通過条件とする

**現在の状態**: 未通過。P0-6含むP0全件がOpen。専門家確認（税務・法務）は未着手。D6廃止対象の排除条件も未検証。

---

## Parking Lot

Phaseに割り当てられていない、または現時点で対応不要と判断した項目。詳細は各Issueを参照。

- **P2-2**（レポート数値のハードコード・乱数混入）— 着手時期はレポート機能の本格再設計時だが、**Close条件はCommercial / Financial Go Gateの「D6廃止対象の排除条件」と一致させる**（本番到達可能なレポート表示から乱数・ハードコードが排除されるまでOpenを維持）
- **P2-7**（SubmissionSimulator経由deployの404）— Phase 1の再設計で経路自体が置き換わるため個別修正不要
- **P2-8**（KWボリュームGemini推定）— Phase 3 Assisted Optimization候補
- **P3-1**（package.json name/Reactバージョン乖離）— 軽微、任意タイミングで修正可
- **P3-4**（プラン定義の非提供モデル名記載）— Commercial / Financial Go Gate前の見直し対象として記録
- **P3-6**（docs/の当初内容に関する記録事項）— 対応不要
- CVI正式定義・上位指標化（D5の再検討条件が満たされるまで）
- 代理店（Agency）向け機能の本格拡張（D1により恒久的に補助的位置づけ）
- 共通コア抽出（D6・D7の再検討条件が満たされるまで）
- Meta以外の媒体Adapter具体設計（Phase 5着手まで）

---

## Roadmapの運用ルール

- 各Phaseの完了条件は、Backlogの該当Issueが全件Closeし、かつPhase固有のE2E検証がProduction verifiedに到達することの両方を満たして初めて成立する。ビルド成功・コード存在のみでPhase完了としない。
- Phase開始・完了の判定はユーザーの明示的な確認を経て行う（本文書の自動更新では完了扱いにしない）。
- 本文書のPhase状態・現在地は、実際の作業進捗に応じて更新する。更新はGovernance Gate（合意）を経て行い、過去の記録は書き換えず追記・訂正する。

### CLAUDE.md・Git運用タイミング（R-06）

- **Git追跡**: Gate 2 Final Integration Reviewの指摘修正（R-01〜R-07）と再検証が完了した後、7文書（6正本＋1 Evidence）を`AMAS_Brain`のGit追跡対象へ追加する。
- **commit**: Gate 2 Close後、実装（Phase 0）開始前に、7文書（6正本＋1 Evidence）を**意図的な単独commit**として保存する（コード変更・設定変更とは分離したcommitにする）。
- **push**: commit内容・対象ファイルを確認した後に行う（自動pushはしない）。
- **CLAUDE.md更新**: 7文書（6正本＋1 Evidence）の確定・Git保存後、Phase 0開始前の**独立した正本接続作業**として行う。CLAUDE.mdには各正本の詳細を複製せず、正本一覧・現在地・次のGateへの参照のみを記載する。
- **本ロードマップ作成時点（Gate 2文書化・Gate 2 Final Integration Review是正時点）ではCLAUDE.mdの変更を行わない。**
