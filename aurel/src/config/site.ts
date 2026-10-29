/**
 * サイト全体で使う基本情報（ブランド名・連絡先・事業者情報など）の一元管理ファイル。
 *
 * - ブランド名を変更する場合は `brand.name` を書き換えるだけで、ロゴ・タイトル・フッター・OGP・メール件名に反映されます。
 * - 未確定の情報は `null` のままにしてください。`null` の項目はサイト上で非表示、
 *   またはプライバシーポリシー等で「公開前に記載」のプレースホルダーとして表示されます。
 *   架空の値で埋めないでください。
 */
export const siteConfig = {
  brand: {
    /** ブランド名（ロゴ・title・フッター等に使用） */
    name: "AUREL",
    /** ブランドカテゴリー */
    category: "Premium Event & Experience Production",
    /** 日本語の短い説明（meta description の既定値） */
    description:
      "企業イベントの企画・運営、ブランド体験のプロデュース、施設のイベント活用支援。社員懇親会や周年記念、商品発表会まで、目的と世界観から設計するイベント・空間体験プロデュース。",
  },

  /** 公開URL。環境変数 NEXT_PUBLIC_SITE_URL で上書きします */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  locale: "ja_JP",

  /** 連絡先。未確定の項目は null（サイト上では非表示） */
  contact: {
    /** 公開用メールアドレス（例: "hello@example.com"） */
    email: null as string | null,
    /** 公開用電話番号 */
    phone: null as string | null,
  },

  /** SNS。URL を設定したものだけがフッターに表示されます */
  social: [
    { label: "Instagram", href: null },
    { label: "LinkedIn", href: null },
  ] as { label: string; href: string | null }[],

  /**
   * 事業者情報。法人化前のため「株式会社」等の表記は付けないでください。
   * 確定するまで null のままにしてください。
   */
  operator: {
    /** 事業形態（事実として確定している内容のみ） */
    businessType: "個人事業",
    /** 屋号（ブランド名と異なる場合のみ） */
    tradeName: null as string | null,
    /** 代表者名 */
    representative: null as string | null,
    /** 所在地（公開する範囲で） */
    address: null as string | null,
    /** 開業年月（例: "2026年4月"） */
    established: null as string | null,
  },

  /** プライバシーポリシーの制定日・改定日（確定したら設定） */
  privacy: {
    enactedOn: null as string | null,
    updatedOn: null as string | null,
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** ヘッダー・フッターのナビゲーション */
export const mainNav = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Works", href: "/works" },
] as const;

export const contactNav = { label: "Contact", href: "/contact" } as const;
