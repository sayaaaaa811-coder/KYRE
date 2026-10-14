# 一般公開ガイド（PR のマージ → Vercel → Google カレンダー連携）

初心者向けに、上から順番に 1 つずつ進められるように書いています。各ステージの最後に「確認」があるので、そこまでできたら次へ進んでください。

> **全体像**
>
> | ステージ | やること | 誰が | 費用 |
> |---|---|---|---|
> | 0 | 秘密情報のチェック | Claude（完了） | — |
> | 1 | `main` ブランチを作り、PR をマージ | Claude ＋ あなた | 無料 |
> | 2 | GitHub のセキュリティ設定 | あなた | 無料 |
> | 3 | 運営者情報・プラン・URL を決める | あなた（反映は Claude） | — |
> | 4 | Vercel で公開（まずデモのみ） | あなた | 無料〜（プランによる） |
> | 5 | Google Cloud を本番用に設定し、連携を有効化 | あなた | 無料 |
> | 6 | 公開後の確認 | あなた | — |
> | 7 | Google の審査（誰でも連携できるようにする） | あなた（準備は Claude） | 無料（独自ドメインは有料） |
>
> **大事なこと**: ステージ 6 までで「誰でもアプリを開いてデモを使える」状態になります。ただし **Google カレンダー連携は、Google の審査（ステージ 7）が終わるまで、あなたが登録したテストユーザー（最大 100 人）しか使えません**。これは Google のルールです。

---

## ステージ 0：秘密情報のチェック（完了）

公開前に、リポジトリの **すべての履歴** を Claude が検査しました。

| 検査内容 | 結果 |
|---|---|
| Google のクライアントシークレット（`GOCSPX-…`）・アクセストークン（`ya29.…`）・API キー | なし |
| 秘密鍵（`-----BEGIN … PRIVATE KEY`）、GitHub・AWS などのトークン | なし |
| `.env` / `.env.local` などの設定ファイル | なし（中身が空の `.env.example` のみ） |
| 一度コミットして削除したファイル（履歴に残る秘密） | なし |
| テスト用の鍵 | テスト専用の無意味な値のみ。**本番でこのような規則的な値を使うとアプリが起動時に拒否する** よう、安全装置を追加済み |

今後も、`.env.local` や Google からダウンロードした JSON ファイルを GitHub に上げないようにしてください（`.gitignore` で `.env*` は除外済み）。

---

## ステージ 1：`main` ブランチを作り、PR をマージする

### いまの状態
このリポジトリには、まだ **`main`（本番用）ブランチがありません**。開発内容はすべて作業用ブランチ `claude/kyre-schedule-dev-nfmsj6` にあります。

### 1-1. `main` ブランチと PR の作成（Claude が行います）
Claude に「main と PR を作って」と伝えてください。Claude が次を行います。
- 最初のコミット（設計書だけの状態）から `main` ブランチを作る
- 作業用ブランチ → `main` へのプルリクエスト（PR）を作る

### 1-2. PR をマージする（あなたの操作）
1. Claude から届いた PR のリンク（`https://github.com/sayaaaaa811-coder/KYRE/pull/…`）を開きます。
2. 画面下のほうにある自動テスト（CI）の欄が **緑のチェック ✓** になるまで待ちます（5〜10 分）。
   - 赤い ✗ の場合はマージせず、Claude に知らせてください。
3. 緑の「**Merge pull request**」ボタン →「**Confirm merge**」を押します。
4. 「Pull request successfully merged and closed」と表示されたら完了です。
   - 「Delete branch」ボタンは押さなくて大丈夫です。

### 1-3. `main` を標準のブランチにする
1. リポジトリ上部の「**Settings**」タブを開きます。
2. 左メニュー「**General**」→「**Default branch**」の欄で、⇄（切り替え）アイコンを押します。
3. `main` を選び「**Update**」→ 確認画面で「**I understand, update the default branch.**」を押します。

### 1-4. Dependabot の古い PR を閉じる
1. 「**Pull requests**」タブを開くと、`chore(deps): Bump …` という PR が 7 件あります（#1〜#7）。
2. それぞれ開いて、下の「**Close pull request**」を押します。
   - 理由: 作業用ブランチ向けに作られたもので、大きなバージョンアップ（動作が壊れやすい）も含まれるためです。今後は `main` 向けに、小さな更新だけが自動で提案されます。

**✅ 確認**: リポジトリのトップページを開いたとき、ブランチ表示が `main` になっていて、ファイル一覧に `src` や `docs` が表示されている。

---

## ステージ 2：GitHub のセキュリティ設定（5 分・無料）

1. 「**Settings**」→ 左メニュー「**Advanced Security**」（または「**Code security**」）を開きます。
2. 次の項目の「**Enable**」を押します（すでに有効なら不要）。
   - **Dependabot alerts**（使っている部品に脆弱性が見つかったら通知）
   - **Secret Protection** / **Secret scanning**（秘密情報がアップロードされたら検知）
   - **Push protection**（秘密情報を含むアップロードをブロック）

**✅ 確認**: 上の 3 つが「Enabled」または「Disable」ボタン（＝有効化済み）の表示になっている。

---

## ステージ 3：決めること（Claude に伝えてください）

| # | 決めること | 説明 |
|---|---|---|
| A | **運営者名** | プライバシーポリシー・利用規約に表示（個人名・屋号・会社名） |
| B | **お問い合わせ用メールアドレス** | 同上。個人のアドレスを出したくない場合は専用のアドレスを作るのがおすすめ |
| C | **Vercel のプラン** | Hobby（無料）は **非商用（個人的な利用）に限る** という規約です。KYRE を事業として運営するなら Pro（有料）を検討してください。料金は Vercel 公式サイトで最新情報を確認してください |
| D | **公開 URL** | まずは無料の `https://（名前）.vercel.app` で始めるのがおすすめ。名前（例: `kyre-schedule`）を決めてください。独自ドメイン（例: `schedule.kyre.jp`、年 1,000 円〜数千円程度）は後から追加できます |

A・B を伝えていただければ、Claude がプライバシーポリシー・利用規約に反映して `main` に取り込める形にします。**A・B が入るまでは一般公開しないでください**（ポリシーに「運営者名を記入」と表示されたままになるため）。

---

## ステージ 4：Vercel で公開する（まずデモのみ）

最初は Google 連携なし（デモ用カレンダーのみ）で公開し、URL を確定させます。

### 4-1. Vercel に登録
1. <https://vercel.com/signup> を開きます。
2. プラン選択で C で決めたもの（Hobby なら「**Hobby**」）を選び、名前を入力します。
3. 「**Continue with GitHub**」を押し、GitHub アカウントでログインを許可します。

### 4-2. リポジトリを取り込む
1. Vercel のダッシュボードで「**Add New…**」→「**Project**」を押します。
2. 「Import Git Repository」に `KYRE` が表示されない場合は「**Adjust GitHub App Permissions**」（または Install）を押し、`sayaaaaa811-coder/KYRE` へのアクセスを許可します（「Only select repositories」で KYRE だけを選ぶのが安全です）。
3. `KYRE` の横の「**Import**」を押します。

### 4-3. 設定（「Deploy」はまだ押さない）
1. **Project Name**: D で決めた名前（例: `kyre-schedule`）。これが URL `https://kyre-schedule.vercel.app` になります（使われている名前の場合は別の名前に）。
2. **Framework Preset**: 「Next.js」になっていることを確認。
3. **Root Directory**・**Build and Output Settings**: 変更しない。
4. 「**Environment Variables**」を開き、次の 2 つを入力して「Add」を押します。

| Key（名前） | Value（値） |
|---|---|
| `APP_ORIGIN` | `https://kyre-schedule.vercel.app`（← 自分のプロジェクト名に置き換え。最後に `/` を付けない） |
| `SESSION_SECRET` | 下の方法で作った値（ローカルの `.env.local` とは **別の新しい値**） |

`SESSION_SECRET` の作り方（自分のパソコンのターミナルで実行）:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
表示された文字列をコピーして貼り付けます。この値はどこにも保存・共有しないでください（Vercel の中にだけあれば大丈夫です）。

5. 「**Deploy**」を押します。2〜3 分で完了します。

### 4-4. 本番ブランチの確認
1. プロジェクト画面の「**Settings**」→「**Environments**」→「**Production**」（または「**Git**」）を開きます。
2. 「Branch Tracking」（本番ブランチ）が `main` になっていることを確認します。

**✅ 確認**:
- 表示された URL（例: `https://kyre-schedule.vercel.app`）を開くとアプリが表示される
- メッセージを貼り付けて「空き状況を確認する」→「デモ用のカレンダーで試す」で結果と返信文まで進める（この時点では連携シートに「Google カレンダー連携は準備中」と表示されるのが正常です）

---

## ステージ 5：Google カレンダー連携を有効にする

> まだ docs/setup/google-cloud.md（ローカル用の設定）をやっていない場合は、まずその **手順 1〜6**（プロジェクト作成、Calendar API の有効化、同意画面、スコープ、テストユーザー）を行ってください。手順 7 以降は下で本番用に行います。

### 5-1. 本番用のクライアントを作る
1. <https://console.cloud.google.com/> を開き、上部で `KYRE Schedule` プロジェクトが選ばれていることを確認します。
2. 「≡」→「API とサービス」→「OAuth 同意画面」（Google Auth Platform）→ 左メニュー「**クライアント**」→「**クライアントを作成**」。
3. 次のように入力します。
   - **アプリケーションの種類**: ウェブ アプリケーション
   - **名前**: `KYRE Schedule (production)`
   - **承認済みのリダイレクト URI**:「URI を追加」→ `https://kyre-schedule.vercel.app/api/auth/google/callback`（← 自分の URL に置き換え。一字一句正確に）
4. 「作成」を押し、表示された **クライアント ID** と **クライアント シークレット** を控えます（「JSON をダウンロード」があれば安全な場所に保存。**GitHub やチャットには貼らない**）。

### 5-2. ブランディング（同意画面に表示される情報）
左メニュー「**ブランディング**」で次を入力して保存します。
- **アプリのホームページ**: `https://kyre-schedule.vercel.app`
- **プライバシー ポリシーのリンク**: `https://kyre-schedule.vercel.app/privacy`
- **利用規約のリンク**: `https://kyre-schedule.vercel.app/terms`
- **承認済みドメイン**: `kyre-schedule.vercel.app`
  - エラーで登録できない場合は、エラー文を Claude に送ってください（独自ドメインへの切り替えを含めて相談します）。

### 5-3. 利用者（テストユーザー）の登録
左メニュー「**対象**」で、公開ステータスは「**テスト中**」のまま、連携を使ってもらう人の Gmail アドレスを「テストユーザー」に追加します（最大 100 人）。
- 「アプリを公開」は、ステージ 7 の審査準備ができるまで押さないでください。

### 5-4. Vercel に Google の設定を追加
1. Vercel のプロジェクト →「**Settings**」→「**Environment Variables**」。
2. 次の 3 つを追加します（Environment は「Production」にチェック）。

| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | 5-1 のクライアント ID |
| `GOOGLE_CLIENT_SECRET` | 5-1 のクライアント シークレット |
| `GOOGLE_REDIRECT_URI` | `https://kyre-schedule.vercel.app/api/auth/google/callback` |

- `GOOGLE_ENDPOINT_OVERRIDE` は **絶対に追加しないでください**（テスト専用。本番で設定してもアプリが拒否します）。

3. 環境変数は再デプロイで反映されます。「**Deployments**」タブ → 一番上のデプロイの「…」→「**Redeploy**」→「Redeploy」。

**✅ 確認**:
- テストユーザーとして登録した Google アカウントで、連携 → 結果表示まで進める
- 「このアプリは Google で確認されていません」と表示されるのは、審査前のため正常（「詳細」→「KYRE Schedule（安全ではないページ）に移動」）
- 自分の予定がある日時が「予定があります」、ない日時が「参加できます」になる

---

## ステージ 6：公開後の確認

1. docs/setup/device-test.md の項目を、iPhone・Android の実機で確認します。
2. 「設定」→「連携を解除する」が動くことを確認します。
3. Vercel の「**Logs**」で、`config_invalid` という表示がないことを確認します（あれば環境変数の入力ミス。後ろに項目名が出ます）。

---

## ステージ 7：Google の審査（誰でも連携できるようにする）

テストユーザー以外の人にも Google 連携を使ってもらうには、Google のアプリ審査が必要です。準備物と流れは docs/setup/oauth-verification.md にまとめています。主な準備物:

- ロゴ画像（120×120px）
- 運営者情報が入ったプライバシーポリシー・利用規約（ステージ 3）
- ドメインの所有確認（Google Search Console）— 独自ドメインがあると確実です
- デモ動画（同意画面から機能を使うまでを録画）

準備ができたら Claude に声をかけてください。申請内容の作成をお手伝いします（申請ボタンを押すのはあなたです）。

---

## 困ったときは

- エラー画面や表示された文字を、**秘密情報（シークレット・SESSION_SECRET）が写っていないことを確認してから** スクリーンショットで送ってください。
- 公開をいったん止めたいとき: Vercel のプロジェクト →「Settings」→ 一番下の「Pause」または「Delete Project」。
