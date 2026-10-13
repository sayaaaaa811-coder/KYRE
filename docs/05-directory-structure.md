# 05. ディレクトリ構成

```
KYRE/
├── docs/                         # 設計書（本ドキュメント群）
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 共通レイアウト・フォント・メタ情報
│   │   ├── page.tsx              # メイン（4 ステップのウィザード）
│   │   ├── privacy/page.tsx      # プライバシーポリシー
│   │   ├── terms/page.tsx        # 利用規約
│   │   ├── settings/page.tsx     # 連携状態・連携解除
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── google/start/route.ts     # OAuth 開始
│   │       │   ├── google/callback/route.ts  # OAuth コールバック
│   │       │   └── disconnect/route.ts       # 連携解除
│   │       ├── session/route.ts              # 連携状態
│   │       └── freebusy/route.ts             # FreeBusy プロキシ
│   ├── components/
│   │   ├── steps/                # MessageInputStep / CandidateReviewStep / ResultStep / ReplyStep
│   │   ├── candidate/            # CandidateCard, CandidateEditor, AmbiguityResolver
│   │   ├── result/               # ResultCard, AlternativeChips
│   │   └── ui/                   # Button, SegmentedControl, Sheet, Toast, StepIndicator
│   ├── lib/                      # ★ UI に依存しない純粋ロジック（テストの中心）
│   │   ├── time/                 # タイムゾーン・日付ユーティリティ（Asia/Tokyo）
│   │   ├── parser/               # 日本語日時抽出（Phase 2）
│   │   │   ├── normalize.ts      # 全角→半角、記号統一
│   │   │   ├── tokens/           # date.ts, weekday.ts, relative.ts, time.ts, period.ts
│   │   │   ├── combine.ts        # 日付と時刻の組み合わせ・列挙展開
│   │   │   ├── ambiguity.ts      # 曖昧性判定
│   │   │   └── index.ts          # parse(text, { referenceDate, timeZone })
│   │   ├── matcher/              # 照合・代替探索（Phase 1）
│   │   │   ├── intervals.ts      # 拡張・統合・重なり判定
│   │   │   ├── alternatives.ts   # 代替枠探索
│   │   │   └── index.ts          # evaluate(candidates, busy, settings)
│   │   ├── reply/                # 返信文生成（Phase 4）
│   │   ├── calendar/             # CalendarProvider インターフェース
│   │   │   ├── types.ts
│   │   │   ├── mock.ts           # ダミーカレンダー（Phase 1・デモ・E2E）
│   │   │   └── client.ts         # ブラウザ → /api/freebusy 呼び出し
│   │   └── types.ts              # Candidate, BusyInterval, EvaluationResult など
│   ├── server/                   # ★ サーバー専用（`server-only` で誤インポートを防止）
│   │   ├── env.ts                # 環境変数の検証
│   │   ├── session.ts            # 暗号化 Cookie セッション
│   │   ├── oauth.ts              # state / PKCE / トークン交換 / revoke
│   │   ├── google-freebusy.ts    # Google FreeBusy 呼び出しとレスポンス検証
│   │   ├── rate-limit.ts         # レート制限
│   │   ├── csrf.ts               # Origin / ヘッダー検証
│   │   └── logger.ts             # 許可リスト方式ロガー
│   ├── hooks/                    # useWizardState, useClipboard など
│   └── styles/globals.css
├── middleware.ts                 # セキュリティヘッダー（CSP など）
├── tests/
│   ├── unit/                     # Vitest（lib/, server/）
│   │   ├── parser/               # 表形式のテストケース（fixtures/*.json）
│   │   ├── matcher/
│   │   ├── reply/
│   │   └── server/
│   ├── fixtures/                 # 匿名化したサンプルメッセージ（実在の会話は使わない）
│   └── e2e/                      # Playwright
├── public/                       # アイコン、自己ホストフォント
├── .env.example                  # 環境変数の名前のみ
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

## 設計上のポイント

- **`lib/` は純粋関数のみ**（現在時刻も引数で受け取る）。同じ入力なら必ず同じ出力になり、テストしやすい。
- **`server/` はサーバー専用**。`import "server-only"` を付け、ブラウザ用コードから読み込むとビルドエラーにする（秘密情報の漏洩防止）。
- **`CalendarProvider` インターフェース**で「ダミー」と「Google」を差し替え可能にする。Phase 1 はダミーで画面とロジックを完成させ、Phase 3 で Google 実装に差し替える。
