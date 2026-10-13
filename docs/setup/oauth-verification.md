# Google OAuth 審査（一般公開）チェックリスト

テストモード（テストユーザー最大 100 人）を超えて誰でも使えるようにするには、Google のアプリ審査が必要です。
**申請は、あなたの承認をいただいてから行います。** 以下は準備状況の一覧です。

> Google の要件は変更されることがあります。申請前に Google Cloud の画面に表示される最新の要件を確認します。

## スコープの区分

- 使用するスコープ: `https://www.googleapis.com/auth/calendar.freebusy`（空き時間情報の表示のみ）
- Google の分類上「センシティブ」スコープに該当する見込みです（申請時に Google Cloud の「データアクセス」画面で最終確認）。
  - センシティブスコープの場合: Google による確認（ブランド・スコープの利用理由・デモ動画の審査）が必要。外部セキュリティ評価（CASA）は不要の見込み
  - 審査期間: 数日〜数週間程度

## 準備状況

| # | 要件 | 状態 | 備考 |
|---|---|---|---|
| 1 | アプリ名・ロゴ・サポートメール | ⏳ | ロゴ画像（120×120px）の用意が必要 |
| 2 | アプリのホームページ（公開 URL） | ⏳ | 限定公開後に URL が決まる |
| 3 | プライバシーポリシーの URL（同じドメイン） | ✅ 文面準備済み / ⏳ 運営者情報 | `/privacy`。Limited Use の遵守を英語・日本語で明記済み |
| 4 | 利用規約の URL | ✅ 文面準備済み / ⏳ 運営者情報 | `/terms` |
| 5 | 承認済みドメインの所有権確認 | ⏳ | 独自ドメインを Google Search Console で確認 |
| 6 | スコープの利用理由の説明 | ✅ 下書きあり（下記） | |
| 7 | デモ動画（YouTube 限定公開など） | ⏳ | 同意画面から機能の利用までを録画。手順は申請時にご案内 |
| 8 | 最小権限であること | ✅ | freebusy のみ、メール等も取得しない |
| 9 | データの保存・共有をしないこと | ✅ | データベースなし、第三者提供なし |

## スコープの利用理由（申請用の下書き・英語）

> KYRE Schedule helps users reply to scheduling messages. The user pastes a message containing proposed dates; the app extracts the candidate time slots on the user's device and checks whether the user is busy at those times. We request only the `calendar.freebusy` scope to read busy time ranges of the user's primary calendar for the specific days the user asks about. We do not read event titles, locations, attendees, or descriptions, and we do not store calendar data on our servers. The busy ranges are used only to show availability and suggest alternative times within the app.
