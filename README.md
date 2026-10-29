# KYRE Schedule

LINE などで届いた日程候補を貼り付けると、Google カレンダーの空き状況と照合して、参加できる日時・代替案・返信文を提示する無料 Web アプリ（開発中）。

- 設計書: [docs/README.md](docs/README.md)
- 別アプリ: イベントプロデュース事業の公式サイト（AUREL）は [aurel/](aurel/README.md) にあります
- 進捗報告: [Phase 1](docs/progress/phase-1.md) / [Phase 2](docs/progress/phase-2.md) / [Phase 3](docs/progress/phase-3.md) / [Phase 4](docs/progress/phase-4.md) / [Phase 5](docs/progress/phase-5.md)
- セキュリティレビュー: [docs/security-review.md](docs/security-review.md)
- 一般公開ガイド（PR マージ → Vercel → Google 連携）: [docs/setup/public-launch.md](docs/setup/public-launch.md)
- Google カレンダー連携の設定: [docs/setup/google-cloud.md](docs/setup/google-cloud.md)

## 自分のパソコンで動かす手順（初心者向け）

### 1. 準備（最初の 1 回だけ）

1. **Node.js 22 以上**をインストールします。<https://nodejs.org/ja> から「LTS」版をダウンロードしてインストールしてください。
2. ターミナル（Mac は「ターミナル」アプリ、Windows は「PowerShell」）を開き、次を入力して数字が表示されれば OK です。
   ```bash
   node -v
   ```
3. このリポジトリをダウンロードします（Git を使う場合）。
   ```bash
   git clone https://github.com/sayaaaaa811-coder/KYRE.git
   cd KYRE
   git checkout claude/kyre-schedule-dev-nfmsj6
   ```
4. 必要な部品をインストールします（数分かかります）。
   ```bash
   npm install
   ```

### 2. アプリを起動する

```bash
npm run dev
```

ブラウザで <http://localhost:3000> を開きます。終了するときはターミナルで `Ctrl + C` を押します。

- Google カレンダーと連携するには、[設定手順](docs/setup/google-cloud.md) に沿って `.env.local` を作成してください。設定がなくても、デモ用のカレンダーで試せます。

- ダミーカレンダーの状態を変えて試せます（URL の末尾に付けます）
  - `?mock=mixed`（初期値）: 毎日 12:00–13:00、偶数日は 18:30–20:00 が予定あり。7 の倍数の日は終日予定
  - `?mock=all_free`: 予定なし / `?mock=all_busy`: 毎日 9–23 時が予定あり（代替案は時間帯の設定次第で早朝・深夜に出ます）
  - `?mock=all_day`: 全日が終日予定 / `?mock=error`: 予定の取得に失敗

### 3. テストを実行する

```bash
npm run check   # 文法チェック・型チェック・単体テストをまとめて実行
npm run e2e     # 画面操作の自動テスト（初回のみ npx playwright install chromium が必要）
```

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発用サーバーを起動 |
| `npm run build` | 本番用にビルド |
| `npm test` | 単体テスト（Vitest） |
| `npm run test:coverage` | テストの網羅率を表示 |
| `npm run e2e` | E2E テスト（Playwright） |
| `npm run lint` | コードの文法チェック |
| `npm run typecheck` | 型チェック |
