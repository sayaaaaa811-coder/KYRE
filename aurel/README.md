# AUREL — Premium Event & Experience Production

イベント・空間体験プロデュース事業の公式Webサイトです（ブランド名は仮称）。

- Next.js 16（App Router）/ TypeScript / Tailwind CSS v4 / Motion / Lucide / React Hook Form + Zod
- このディレクトリ（`aurel/`）は、リポジトリのルートにある KYRE Schedule とは**独立したアプリ**です。コマンドはすべて `aurel/` の中で実行します。

---

## 1. ローカルで起動する

Node.js 22 以上が必要です。

```bash
cd aurel
npm install
npm run dev
```

ブラウザで <http://localhost:3000> を開きます。

本番と同じ状態で確認する場合：

```bash
npm run build
npm run start
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番ビルドの起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック |
| `npm run check` | lint + 型チェック |

## 2. 環境変数

`.env.example` をコピーして `.env.local` を作成します（`.env.local` は Git に含まれません）。

```bash
cp .env.example .env.local
```

| 変数 | 必須 | 内容 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 本番で必須 | 公開URL（例: `https://example.com`）。sitemap・OGP・canonical に使用 |
| `RESEND_API_KEY` | フォーム送信に必須 | Resend の API キー |
| `CONTACT_TO_EMAIL` | フォーム送信に必須 | 問い合わせの受信先（カンマ区切りで複数可） |
| `CONTACT_FROM_EMAIL` | フォーム送信に必須 | 送信元。Resend で認証済みドメインのアドレス（例: `AUREL <noreply@example.com>`） |
| `CONTACT_AUTO_REPLY` | 任意 | `true` で問い合わせ者に自動返信 |

API キーはコードに書かず、必ず環境変数で設定してください。

## 3. ファイル構成

```
aurel/
├─ src/
│  ├─ config/site.ts          … ブランド名・連絡先・SNS・事業者情報（一元管理）
│  ├─ content/
│  │  ├─ services.ts          … サービス内容・料金表・FAQ・サービスの流れ
│  │  ├─ works.ts             … 実績（活動経験）
│  │  ├─ home.ts / about.ts   … 各ページの文言・制作プロセス
│  │  ├─ contact.ts           … フォームの選択肢（予算・人数など）
│  │  └─ images.ts            … サイトで使うビジュアルと出典・ライセンス
│  ├─ components/
│  │  ├─ layout/              … Header（モバイルメニュー含む）, Footer
│  │  ├─ sections/            … Hero, PageHero, ServiceCard, PricingCard, PricingSection,
│  │  │                         ExperienceCard, ProcessTimeline, CTASection, FAQ, Breadcrumb
│  │  ├─ ui/                  … SectionHeading, ButtonLink, Logo, Reveal, PhotoPlaceholder
│  │  └─ forms/ContactForm.tsx
│  ├─ lib/                    … フォームの検証ルール、メール送信、レート制限、metadata
│  └─ app/                    … 各ページ、/api/contact、sitemap、robots、OGP画像
├─ public/images/visuals/     … ビジュアル画像
└─ scripts/generate-visuals.mjs … 抽象ビジュアルの生成スクリプト
```

表示（コンポーネント）と内容（`config/` `content/`）を分けているため、将来 CMS を導入する場合は `content/` のデータを CMS から取得する形に置き換えるだけで済みます。

## 4. ブランド名を変更する

`src/config/site.ts` の `brand.name` を書き換えます。ロゴ、ページタイトル、フッター、OGP 画像、ファビコン、メールの件名にすべて反映されます。

事業者情報（代表者名・所在地・開業年月など）も同じファイルの `operator` で管理しています。**未確定の項目は `null` のまま**にしてください。`null` の項目はサイト上で非表示、または「準備中」「公開前に記載」と表示されます。架空の情報で埋めないでください。法人化前のため「株式会社」等の表記は付けません。

## 5. 料金表を編集する

`src/content/services.ts` の各プランの `price` を編集します。

```ts
price: { amount: 200_000, billing: "one-time" }            // → 20万円〜
price: { amount: 150_000, billing: "per-visit" }           // → 15万円〜／回
price: { amount: 150_000, billing: "monthly" }             // → 月額15万円〜
price: { amount: 100_000, billing: "monthly", extra: "＋成果報酬" } // → 月額10万円〜＋成果報酬
```

- 金額は**税別・円**で入力します。表示形式は自動で整形されます。
- プランの内容は `features`、前置き（「Essentialの内容に加えて」）は `inherits` で編集します。
- `cumulative: true` のサービスは、上位プランが下位プランの内容を含むものとして比較表を自動生成します。
- 料金表の下の注記（別途費用など）は `pricingNotes` で編集します。
- 料金はサービス一覧ページ・詳細ページ・比較表・SEO 説明文のすべてに使われます（SEO 説明文 `seo.description` 内の金額は手動で合わせてください）。

## 6. 実績を追加する

`src/content/works.ts` の `works` 配列に同じ形のオブジェクトを追加します。

```ts
{
  id: "project-01",
  label: "Project 01",
  kind: "project",               // ブランドとしての実績は "project"、代表者の過去の経験は "past-experience"
  title: "周年記念パーティー",
  scale: { figure: "150", unit: "名規模" },
  summary: "……",
  details: { role: "企画・当日運営", venue: null, period: "2027年春", outcome: null },
  photos: [{ src: "/images/works/project-01-1.jpg", alt: "……", credit: "Photo: ……" }],
}
```

- 未確定の項目は `null` にすると「詳細は準備中です」と表示されます。
- `photos` が空の場合は「写真準備中」のプレースホルダーが表示されます。
- **実績写真には、実際の開催写真で掲載許諾を得たものだけ**を使ってください。ストック写真を実績として掲載しないでください。
- 架空のクライアント名・受賞歴・口コミは掲載しないでください。

## 7. 画像を差し替える

現在のビジュアルは、本プロジェクト用に生成した**オリジナルの抽象画像**（光・建築・テーブルを想起させるもの）です。第三者の素材を含まないため、ライセンス上の制約はありません。
（制作環境から写真素材サイトに接続できなかったため、ライセンスを確認できない写真の使用は避けました。）

写真に差し替える手順：

1. ライセンスを確認した写真を `public/images/` 以下に置く（横幅 2000〜2400px 程度の JPEG 推奨。Next.js が AVIF/WebP に自動変換・リサイズします）
2. `src/content/images.ts` の該当項目の `src`・`alt`・`credit`（出典・ライセンス）を書き換える

| キー | 使用箇所 | 推奨イメージ |
|---|---|---|
| `hero` | トップのヒーロー | ラグジュアリーな企業レセプション／ホテルのバンケット |
| `intro` | トップの Introduction | 美しい建築空間 |
| `corporate` | Corporate Events | レセプション・パーティー |
| `brand` | Brand Experiences | ギャラリー・ショールーム・ブランドローンチ |
| `venue` | Venue Partnerships・CTA 背景 | 高級レストラン・バー・ラウンジ |
| `table` | About | テーブルコーディネート |

Unsplash や Pexels 等を使う場合も、各サイトのライセンス条件（人物・ロゴ・建物の権利を含む）を確認し、`credit` に出典を記録してください。

抽象ビジュアルを作り直す場合（Playwright が必要）：`node scripts/generate-visuals.mjs`

## 8. お問い合わせフォームの設定（Resend）

フォームは `/api/contact` に送信され、サーバー側で [Resend](https://resend.com) を使ってメールを送ります。

**送信先が未設定の間は、送信成功を装いません。** フォーム上部に「送信先を準備中」と表示し、送信しても「お問い合わせは届いていません」と案内します（API は 503 を返します）。

本番で送信できるようにする手順：

1. Resend のアカウントを作成
2. **Domains** で送信に使うドメインを追加し、表示される DNS レコード（SPF・DKIM）をドメインの DNS に設定して認証を完了する
3. **API Keys** で API キーを作成（権限は Sending access で十分）
4. 環境変数 `RESEND_API_KEY`・`CONTACT_TO_EMAIL`・`CONTACT_FROM_EMAIL` を設定（`CONTACT_FROM_EMAIL` は手順 2 で認証したドメインのアドレス）
5. 再ビルド・再デプロイ（フォーム上部の「準備中」表示はビルド時に判定されます）
6. 実際にフォームから送信し、受信を確認する

スパム対策として、次を実装しています。

- 人間には見えない入力欄（ハニーポット）
- フォーム表示から 3 秒未満の送信を拒否
- 同一 IP からの連続送信を制限（10 分間に 5 回まで。サーバーレス環境ではインスタンス単位の補助的な対策）
- 他サイトからの送信（Origin 不一致）を拒否
- サーバー側での入力検証・文字数制限、テキストメールのみで送信（HTML 注入の防止）

スパムが増えた場合は Cloudflare Turnstile 等の CAPTCHA の追加を検討してください。

## 9. Vercel へのデプロイ

1. Vercel で **Add New → Project** からこのリポジトリをインポート
2. **Root Directory** に `aurel` を指定（重要：ルートは別アプリです）
3. Framework Preset は Next.js（自動検出）
4. **Environment Variables** に「2. 環境変数」の値を設定（`NEXT_PUBLIC_SITE_URL` は公開ドメイン）
5. Deploy
6. 独自ドメインを使う場合は **Settings → Domains** で追加し、`NEXT_PUBLIC_SITE_URL` を合わせて再デプロイ

その他の環境（Node.js サーバー）では `npm run build && npm run start` で動作します。

## 10. 公開前チェックリスト

- [ ] ブランド名の確定（`config/site.ts` の `brand.name`）
- [ ] 事業者情報（代表者名・所在地・連絡先メール）の設定 — 特にプライバシーポリシーの「お問い合わせ窓口」に必要
- [ ] プライバシーポリシーの制定日（`privacy.enactedOn`）と内容の確認
- [ ] 料金の確定（現在は暫定価格。サイト上では「税別の目安」と表示）
- [ ] 代表者プロフィール（`content/about.ts`）と写真
- [ ] 実績の詳細・写真（掲載許諾を得たもの）
- [ ] ビジュアルの差し替え（任意。出典・ライセンスの記録）
- [ ] Resend の設定と送信テスト
- [ ] `NEXT_PUBLIC_SITE_URL` の設定（sitemap.xml・OGP に反映）
- [ ] SNS アカウントの URL（`config/site.ts` の `social`）

## 11. 表記上の注意

- 実績として掲載している 100名規模・400名規模のイベントは、代表者がブランド立ち上げ以前に携わった活動経験です。サイト上でもその旨を明記しています。ブランドの受注実績として表現しないでください。
- KYRE HOLDINGS との資本関係・グループ所属は確定していないため、サイトには掲載していません。
- Venue Partnerships では、施設の売上増加や稼働率向上を保証する表現を使わないでください。
