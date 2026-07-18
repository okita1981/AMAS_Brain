# AMAS Security and Wallet Design

- **種別**: 正本（Canonical Document）
- **役割**: 安全性、資金、権限、Walletの設計
- **決定日**: 2026-07-19（Gate 2）
- **関連文書**: Decision LogのD3・D4。Issue全文・statusの正本は [amas-improvement-backlog.md](amas-improvement-backlog.md)（本文書ではIssue IDのみ引用し、全文・statusを複製しない）

---

## 1. 認証

- **現状**: 全26 APIエンドポイントが無認証（Backlog: P0-3）。
- **目標**: 全APIでFirebase IDトークン検証を必須化。`userId`をリクエストボディ/クエリの自己申告で受け付けない。

## 2. 認可

- role（admin/user）ベースの権限判定をAPI層に実装する（現状はFirestoreルールのみに存在し、API層はAdmin SDK経由でバイパスされている）。
- D3の段階的権限モデル（Architecture Review §9）: Read-only→Write（PAUSED入稿まで）→Financial。Phase 1はWriteまでの範囲。

## 3. テナント分離

- Firestoreルールのowner/userUidベースの分離は概ね機能しているが、`satellite_pages`のmetrics更新に`isAuthenticated()`判定が欠落している等の穴がある（Backlog: P2-1）。再設計時にルール全体を棚卸しする。

## 4. Wallet台帳

- サーバー側で残高（balance_total）・広告費原資（balance_ad_budget）・税相当額（tax_holding）を管理する台帳へ再設計。
- **現状**: クライアント側からの直接残高書き込みが可能（Firestoreルールの型チェックのみ、Backlog: P0-1）。クライアント直接残高加算の死にコードも残存（Backlog: P2-3）。
- **目標**: 残高変動はサーバー側の検証済みトランザクションのみで発生させる。

## 5. チャージ

- Stripe Checkout（決済）＋Webhook（残高反映）は骨格として維持（Architecture Review §3.1「残す」）。
- **再設計が必要な点**:
  - チャージ上限（プラン連動・残高連動）のサーバー側実装（現状は保存のみで未参照、Backlog: P1-5）。CLAUDE.md原設計「今月チャージできる額＝プラン上限−現在の残高」を実装する。
  - Webhookの冪等性（event.id重複排除、現状なし、Backlog: P1-4）。

## 6. 税相当額・配信可能額の表示

D4（Decision Log）で確定した表示例をそのまま正本とする:
```
チャージ額：10,000円
広告配信に使える金額：9,091円
消費税相当額：909円
※消費税相当額は広告配信には使用されません。
```
内部会計処理（インボイス対応・端数処理の具体的計算方法）は8章の専門家確認事項とする。確認結果によってもこの表示のシンプルさを後退させない（D4）。

## 7. 予約（Reservation）

- 入稿〜承認〜実行の間、該当予算をWallet残高から一時的にロックする仕組み（新規設計）。Phase 1はPAUSED入稿までのため実際の予算消化は発生しないが、将来のFinancial権限実装に向けた設計余地として記載する。

## 8. 媒体消化

- 実配信後の残高減算ロジック（現状皆無、Backlog: P1-6）。D8によりPhase 1では実装対象外（PAUSED入稿までのため実広告費は消化されない）。Phase 2以降、実配信を扱う段階で設計・実装する。
- 残高0時の自動停止ロジックも同様に現状皆無（Backlog: P1-6）。ヘルプAIが実装済みであるかのように回答している点（Backlog: P3-5）はUXの信頼性に関わるため優先度を上げて是正する。

## 9. 返金・調整

- チャージ残高の返金は原則応じない（AMAS利用規約ドラフトより）。この規約自体は専門家確認事項（8章）。

## 10. 冪等性

- Stripe Webhookのevent.id重複排除（Backlog: P1-4）。
- 入稿・deploy処理の冪等性（現状は再実行で上書きのみ、破壊的ではないが冪等でもない）。
- Wallet.tsxのレガシーデータ自動リセットが実入金直後の残高を0に書き戻しうる競合バグ（Backlog: P1-7）——Wallet台帳再設計（4章）で解消する。

## 11. 監査

- Architecture Review §8参照。誰が・いつ・何を承認/実行/決済したかを記録する。

## 12. Secret管理

- 媒体資格情報（client_secret/developer_token/refresh_token）のFirestore平文保存・読み出し（Backlog: P0-5）を廃止し、然るべきSecret管理機構（環境変数・Secret Manager等）へ移行する。
- P0-6（後述13章）はコードではなく資料上の混入だが、Secret管理の運用規律として本文書のスコープに含める。

## 13. P0一覧

**Issue statusの正本はImprovement Backlogのみである。** 本章はIssue IDと設計上必要な一文要約のみを記載し、status・受入条件・Close条件・required_action等の詳細フィールドは複製しない。最新のstatus・受入条件・Close条件は必ず [amas-improvement-backlog.md](amas-improvement-backlog.md) を参照すること。

| Issue ID | 概要（設計上の要点） |
|---|---|
| P0-1 | wallets updateルールが残高の任意書き換えを許可 |
| P0-2 | transactions createで完了済み取引を自作可能 |
| P0-3 | 全26 APIが無認証 |
| P0-4 | deploy.tsが実API呼び出しなしで成功を捏造 |
| P0-5 | 媒体資格情報の平文保存 |
| P0-6 | Secret平文混入（`AMAS諸々メモ.docx`） |

### P0-6の設計上の扱い

**P0-6は現時点で開発停止条件ではない。** Phase 0・Phase 1の技術検証（テスト環境・PAUSED入稿・実広告費非消化）は継続してよい。**Commercial / Financial Go Gate（15章／Master Roadmap参照）通過前の必須Close対象**であるという設計上の位置づけのみをここに記載する。P0-6のstatus・reason・required_before・required_action等の詳細は [amas-improvement-backlog.md](amas-improvement-backlog.md) のP0-6エントリを正本として参照すること（本文書では複製しない）。

## 14. 専門家確認事項

以下は技術実装の進行をブロックしないが、Commercial / Financial Go Gate通過の必須確認事項（Master Roadmap参照）:

- Wallet前払いモデルの資金決済法・資金移動業該当性の法的整理
- チャージ額・税相当額・配信可能額の会計処理の妥当性
- インボイス・端数処理
- 未使用残高・返金・失効の扱い
- AMASサブスクと広告費の分離の会計上の妥当性
- Google Ads等のアカウント所有・管理方式（D3の未決部分）の法務確認
- 媒体規約・利用規約の確定

## 15. 外部公開前Gate

**本Gateの正本は [amas-master-roadmap.md](amas-master-roadmap.md) の「Commercial / Financial Go Gate」章。** 本文書ではP0全件のClose・Secret管理（12章）・専門家確認（14章）がGate通過の必須条件に含まれることのみ記載し、Gateの完全なチェックリスト・トリガー条件はMaster Roadmap側を正とする（重複を避けるため詳細は転記しない）。
