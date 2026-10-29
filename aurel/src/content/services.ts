/**
 * サービス・料金表の一元管理ファイル。
 *
 * 料金を変更する場合は各プランの `price.amount`（円・税別）を書き換えてください。
 * 表示（「20万円〜」「月額15万円〜」など）は自動で整形されます。
 * 将来 CMS を導入する場合は、このファイルと同じ型のデータを CMS から返すように置き換えます。
 */
import type { images } from "./images";

export type Billing = "one-time" | "per-visit" | "monthly";

export type Price = {
  /** 金額（円・税別）。「〜」の下限として表示されます */
  amount: number;
  billing: Billing;
  /** 金額の後ろに付ける補足（例: "＋成果報酬"） */
  extra?: string;
};

export type Plan = {
  id: string;
  name: string;
  price: Price;
  /** 対象・用途を表す短い説明 */
  summary: string;
  /** 「〇〇の内容に加えて：」のような前置き */
  inherits?: string;
  features: string[];
};

export type ScopeGroup = {
  title: string;
  items: string[];
};

export type FlowStep = {
  title: string;
  description: string;
};

export type Faq = {
  question: string;
  answer: string;
};

export type Service = {
  slug: "corporate-events" | "brand-experiences" | "venue-partnerships";
  number: string;
  title: string;
  /** 日本語のサービス名 */
  label: string;
  subtitle: string;
  description: string[];
  /** 一覧カード用の短い説明 */
  excerpt: string;
  image: keyof typeof images;
  concept: { heading: string; body: string[] };
  scope: ScopeGroup[];
  plans: Plan[];
  /** 上位プランが下位プランの内容をすべて含む場合 true（比較表を表示） */
  cumulative: boolean;
  pricingNotes: string[];
  flow: FlowStep[];
  faqs: Faq[];
  seo: { title: string; description: string };
};

const commonPricingNote = "表示料金はすべて税別の目安です。内容・規模・開催条件を伺ったうえで、個別にお見積りします。";

export const services: Service[] = [
  {
    slug: "corporate-events",
    number: "01",
    title: "Corporate Events",
    label: "社内イベント企画・運営",
    subtitle: "企業の大切な節目を、記憶に残る体験へ。",
    description: [
      "社員懇親会、周年記念、表彰式、キックオフ、忘年会など、企業の目的に合わせたイベントを企画・運営します。",
      "会場選定からプログラム設計、演出、当日の進行管理まで対応し、担当者の負担を軽減します。",
    ],
    excerpt:
      "社員懇親会、周年記念、表彰式、キックオフ。組織の節目にふさわしい時間を、会場選定から当日の進行まで一貫して設計します。",
    image: "corporate",
    concept: {
      heading: "目的から逆算する、社内イベント。",
      body: [
        "社内イベントは、集まること自体が目的ではありません。感謝を伝える、方向性を共有する、部署を越えたつながりをつくる。その目的が明確になるほど、会場や演出、プログラムの選び方は変わります。",
        "私たちはまず、イベントを通じて社員の皆さまにどのような気持ちで帰ってほしいのかを伺います。そのうえで、会場の空気感、進行のテンポ、演出の温度まで一貫した体験として設計し、準備から当日までの運営を担います。",
        "総務・人事のご担当者さまが本来の業務と並行して進めることの多い社内イベント。調整や段取りを私たちが引き受けることで、ご担当者さまは「どんな会にしたいか」に集中していただけます。",
      ],
    },
    scope: [
      {
        title: "対応可能なイベント",
        items: [
          "社員懇親会・社内パーティー",
          "周年記念イベント・記念式典",
          "表彰式・アワードセレモニー",
          "キックオフ・決起会",
          "忘年会・新年会",
          "役員・幹部向けの会食・レセプション",
        ],
      },
      {
        title: "対応業務",
        items: [
          "目的・参加者のヒアリング",
          "会場候補の選定・提案",
          "プログラム・タイムテーブル設計",
          "演出・装飾・映像のプランニング",
          "協力会社との制作調整",
          "当日のディレクション・進行管理",
        ],
      },
    ],
    plans: [
      {
        id: "essential",
        name: "Essential",
        price: { amount: 200_000, billing: "one-time" },
        summary: "基本の企画と当日の進行を、安心して任せたい場合に。",
        features: ["ヒアリング", "会場候補の提案", "基本プログラム企画", "進行表作成", "当日ディレクション"],
      },
      {
        id: "signature",
        name: "Signature",
        price: { amount: 350_000, billing: "one-time" },
        summary: "コンセプトと演出から、会の印象を形づくりたい場合に。",
        inherits: "Essentialの内容に加えて",
        features: ["イベントコンセプト設計", "演出プランニング", "協力会社との制作調整", "詳細運営計画"],
      },
      {
        id: "premium",
        name: "Premium",
        price: { amount: 600_000, billing: "one-time" },
        summary: "映像・装飾を含む、総合的な演出と運営体制が必要な場合に。",
        inherits: "Signatureの内容に加えて",
        features: [
          "総合演出ディレクション",
          "映像・装飾等の制作統括",
          "複数スタッフの運営管理",
          "より複雑な進行・制作への対応",
        ],
      },
    ],
    cumulative: true,
    pricingNotes: [
      commonPricingNote,
      "会場費、飲食費、機材費、装飾費、出演者費などは別途となります。",
    ],
    flow: [
      { title: "ご相談・ヒアリング", description: "開催目的、参加人数、時期、ご予算感、社内のご事情を伺います。" },
      { title: "ご提案・お見積り", description: "会場候補とプログラムの方向性、プラン・お見積りをご提案します。" },
      { title: "企画・準備", description: "進行表や運営計画を作成し、会場・協力会社との調整を進めます。" },
      { title: "当日運営", description: "当日のディレクションを担当し、進行と現場の判断を引き受けます。" },
      { title: "振り返り", description: "開催後に振り返りを行い、次回に活かせる気づきを共有します。" },
    ],
    faqs: [
      {
        question: "社内パーティーの企画は、どのくらい前から相談できますか？",
        answer:
          "準備に必要な期間は、規模や会場の空き状況、演出の内容によって異なります。開催時期や内容が決まっていない段階でもご相談いただけますので、まずは検討中の内容をお聞かせください。",
      },
      {
        question: "会場がすでに決まっていても依頼できますか？",
        answer: "はい、可能です。決定済みの会場を前提に、プログラムや演出、当日の運営をご提案します。",
      },
      {
        question: "料金表以外にかかる費用はありますか？",
        answer:
          "表示料金は企画・運営に関する費用です。会場費、飲食費、機材費、装飾費、出演者費などは内容に応じて別途お見積りします。お見積りの段階で内訳をご確認いただけます。",
      },
      {
        question: "周年記念イベントのような式典にも対応していますか？",
        answer:
          "周年記念イベントや表彰式など、式典要素のあるイベントもご相談いただけます。式次第の構成から、来賓・社員それぞれの体験まで含めて設計します。",
      },
    ],
    seo: {
      title: "Corporate Events｜企業イベント・社内パーティーの企画・運営",
      description:
        "社員懇親会、周年記念イベント、表彰式、キックオフ、忘年会などの企業イベントを企画・運営。会場選定からプログラム設計、演出、当日の進行管理まで対応します。料金プランは20万円〜（税別）。",
    },
  },
  {
    slug: "brand-experiences",
    number: "02",
    title: "Brand Experiences",
    label: "ブランドイベント・体験プロデュース",
    subtitle: "ブランドの世界観を、体験という価値へ。",
    description: [
      "商品発表会、ブランドローンチ、VIPレセプション、ポップアップイベントなど、ブランドの価値を空間全体で表現します。",
      "会場、音楽、照明、装飾、ゲスト体験を組み合わせ、ブランドと人との接点を創出します。",
    ],
    excerpt:
      "商品発表会、ブランドローンチ、VIPレセプション。会場・音楽・照明・装飾を組み合わせ、ブランドの世界観を体験として届けます。",
    image: "brand",
    concept: {
      heading: "伝えるのではなく、感じてもらうために。",
      body: [
        "ブランドの価値は、言葉や資料だけでは伝えきれないことがあります。足を踏み入れた瞬間の光、流れている音楽、手に取る素材の質感、迎え入れられたときの印象。その一つひとつが、ブランドへの記憶をつくります。",
        "私たちは、ブランドが大切にしている価値観と、届けたい相手を丁寧に伺うところから始めます。そのうえで、空間・演出・ホスピタリティを一つの体験として設計し、ゲストの導線や時間の流れまで含めてプロデュースします。",
        "商品発表会やブランドイベントの制作において、単に華やかな場をつくるのではなく、ブランドらしさが自然と伝わる場を目指します。",
      ],
    },
    scope: [
      {
        title: "対応可能なイベント",
        items: [
          "商品発表会・新作発表会",
          "ブランドローンチイベント",
          "VIPレセプション・顧客招待会",
          "ポップアップイベント・期間限定ストア",
          "プレス・関係者向け内覧会",
          "体験型のブランドイベント",
        ],
      },
      {
        title: "対応業務",
        items: [
          "ブランド体験のコンセプト設計",
          "会場選定・空間計画",
          "音楽・照明・装飾の演出設計",
          "ゲスト体験・導線の設計",
          "外部クリエイター・協力会社の制作統括",
          "当日の運営統括",
        ],
      },
    ],
    plans: [
      {
        id: "brand-reception",
        name: "Brand Reception",
        price: { amount: 400_000, billing: "one-time" },
        summary: "顧客招待会やレセプションを、ブランドらしく整えたい場合に。",
        features: ["コンセプト提案", "会場選定", "ゲスト体験設計", "基本演出", "当日ディレクション"],
      },
      {
        id: "brand-launch",
        name: "Brand Launch",
        price: { amount: 700_000, billing: "one-time" },
        summary: "新ブランド・新商品の発表を、印象的な体験として届けたい場合に。",
        features: ["ブランド体験コンセプト", "ローンチイベント企画", "空間・演出設計", "制作進行管理", "当日運営統括"],
      },
      {
        id: "immersive-experience",
        name: "Immersive Experience",
        price: { amount: 1_200_000, billing: "one-time" },
        summary: "複数のコンテンツで構成する、体験型のイベントを実現したい場合に。",
        features: [
          "体験型イベント企画",
          "空間演出ディレクション",
          "外部クリエイターの制作統括",
          "複数コンテンツの進行管理",
          "全体プロジェクト管理",
        ],
      },
    ],
    cumulative: false,
    pricingNotes: [commonPricingNote, "施工費、会場費、出演者費、装飾費、機材費などは別途となります。"],
    flow: [
      { title: "ご相談・ヒアリング", description: "ブランドの背景、イベントの目的、届けたい相手、時期とご予算感を伺います。" },
      { title: "コンセプト提案", description: "体験のコンセプトと空間・演出の方向性、お見積りをご提案します。" },
      { title: "設計・制作", description: "空間・演出・ゲスト導線を具体化し、協力会社やクリエイターとの制作を進行します。" },
      { title: "当日運営", description: "設営から本番、撤収まで、現場の運営を統括します。" },
      { title: "振り返り", description: "ゲストの反応や運営面の気づきを整理し、次の施策に向けて共有します。" },
    ],
    faqs: [
      {
        question: "ブランドのコンセプトがまだ固まっていなくても相談できますか？",
        answer:
          "はい、ご相談いただけます。ブランドの背景や大切にしていることを伺いながら、イベントとして表現すべき体験の方向性を一緒に整理します。",
      },
      {
        question: "会場探しからお願いできますか？",
        answer:
          "可能です。ブランドの世界観や想定人数、ゲストの属性、ご予算を踏まえて会場候補をご提案します。会場との条件調整もサポートします。",
      },
      {
        question: "デザイナーや映像制作会社など、外部のクリエイターと一緒に進められますか？",
        answer:
          "はい。ブランド側でお付き合いのあるクリエイターとの協業も、私たちから協力会社をご提案する形も、いずれもご相談いただけます。",
      },
      {
        question: "料金表以外にかかる費用はありますか？",
        answer:
          "表示料金はプロデュース・ディレクションに関する費用です。施工費、会場費、出演者費、装飾費、機材費などは内容に応じて別途お見積りします。",
      },
    ],
    seo: {
      title: "Brand Experiences｜ブランドイベント・商品発表会の企画制作",
      description:
        "商品発表会、ブランドローンチ、VIPレセプション、ポップアップイベントなどのブランドイベントを企画・制作。会場、音楽、照明、装飾、ゲスト体験を組み合わせ、ブランドの世界観を体験として届けます。",
    },
  },
  {
    slug: "venue-partnerships",
    number: "03",
    title: "Venue Partnerships",
    label: "施設向けイベント企画・活用支援",
    subtitle: "空間の可能性を、新たなビジネスへ。",
    description: [
      "ホテル、レストラン、ラウンジ、イベントスペースなどを対象に、イベント活用と法人利用の拡大を支援します。",
      "施設の特性に合わせた貸切プランの開発、イベント企画、営業支援を通じて、新たな利用機会を創出します。",
    ],
    excerpt:
      "ホテル、レストラン、ラウンジ、イベントスペースへ。施設の魅力を活かした貸切プランやイベント企画で、新たな利用機会をつくります。",
    image: "venue",
    concept: {
      heading: "その空間に、まだ見ぬ使われ方を。",
      body: [
        "上質な空間を持ちながら、平日の夜や特定の時間帯、法人向けの利用など、まだ活かしきれていない可能性を抱えている施設は少なくありません。",
        "私たちは、イベントを企画・運営する立場から、施設の特性や既存のサービスを見つめ直し、法人のお客さまが利用したくなる貸切プランやイベント商品を一緒に考えます。",
        "施設の運営方針やブランドを尊重しながら、企画から営業支援、振り返りまでを継続的に伴走します。",
      ],
    },
    scope: [
      {
        title: "対象となる施設",
        items: ["ホテル・バンケット", "レストラン", "ラウンジ・バー", "イベントスペース・ギャラリー"],
      },
      {
        title: "対応業務",
        items: [
          "施設・既存サービスのヒアリング",
          "貸切プラン・イベント商品の設計",
          "法人利用に向けた提案資料の作成支援",
          "施設主催イベントの企画",
          "定期的なミーティングと改善提案",
          "施策の振り返りと成果分析",
        ],
      },
    ],
    plans: [
      {
        id: "venue-audit",
        name: "Venue Audit",
        price: { amount: 150_000, billing: "per-visit" },
        summary: "まずは施設のイベント活用の方向性を整理したい場合に。",
        features: ["施設ヒアリング", "既存サービスの確認", "イベント活用の方向性提案", "貸切プランの改善提案"],
      },
      {
        id: "venue-partner",
        name: "Venue Partner",
        price: { amount: 150_000, billing: "monthly" },
        summary: "イベント商品の設計と企画を、継続的に進めたい場合に。",
        features: ["イベント商品設計", "法人利用の提案支援", "イベント企画", "定期ミーティング", "改善提案"],
      },
      {
        id: "revenue-partnership",
        name: "Revenue Partnership",
        price: { amount: 100_000, billing: "monthly", extra: "＋成果報酬" },
        summary: "企画から営業支援まで、施設と共同で施策に取り組みたい場合に。",
        features: [
          "継続的な企画・営業支援",
          "イベント利用促進",
          "施設との共同施策",
          "成果分析",
          "契約条件に基づく成果報酬",
        ],
      },
    ],
    cumulative: false,
    pricingNotes: [
      commonPricingNote,
      "成果報酬の計算方法、対象売上、契約期間は、施設ごとに個別に設定します。",
      "本サービスは施設の売上増加や稼働率の向上を保証するものではありません。",
    ],
    flow: [
      { title: "ご相談・ヒアリング", description: "施設の特徴、現在の利用状況、課題と目指す方向性を伺います。" },
      { title: "現状の確認", description: "既存の貸切プランやサービス、空間の使われ方を確認します。" },
      { title: "ご提案・ご契約", description: "取り組みの方向性と支援内容、契約条件をご提案します。" },
      { title: "企画・実行", description: "イベント商品や企画を具体化し、法人向けの提案や実施を支援します。" },
      { title: "振り返り・改善", description: "定期的に施策を振り返り、次の打ち手を一緒に検討します。" },
    ],
    faqs: [
      {
        question: "どのような施設が対象ですか？",
        answer:
          "ホテル、レストラン、ラウンジ・バー、イベントスペースなど、貸切やイベントでの利用が考えられる施設を想定しています。対象になるかどうか分からない場合も、お気軽にご相談ください。",
      },
      {
        question: "単発の相談だけでも依頼できますか？",
        answer:
          "はい。Venue Audit では、1回単位で施設のヒアリングとイベント活用の方向性をご提案します。継続的な支援が必要かどうかは、その後にご判断いただけます。",
      },
      {
        question: "成果報酬はどのように決まりますか？",
        answer:
          "成果報酬の計算方法、対象となる売上、契約期間は、施設の状況と取り組み内容を伺ったうえで個別に設定し、契約前に書面でご確認いただきます。",
      },
      {
        question: "売上や稼働率の向上は保証されますか？",
        answer:
          "施設の売上や稼働率は、立地や市場環境などさまざまな要因に左右されるため、成果を保証することはできません。施策の検討・実行・振り返りを通じて、可能性を高めるための支援を行います。",
      },
    ],
    seo: {
      title: "Venue Partnerships｜ホテル・レストランのイベント活用・貸切プラン支援",
      description:
        "ホテル、レストラン、ラウンジ、イベントスペース向けに、貸切プランの開発、イベント企画、法人利用の提案支援を行います。施設の特性を活かした新たな利用機会づくりを支援します。",
    },
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

const MAN = 10_000;

/** 金額を「20万円〜」「月額15万円〜」「15万円〜／回」の形式に整形する */
export function formatPrice(price: Price): string {
  const value =
    price.amount % MAN === 0 ? `${(price.amount / MAN).toLocaleString("ja-JP")}万円` : `${price.amount.toLocaleString("ja-JP")}円`;
  const body = `${value}〜`;
  const base = price.billing === "monthly" ? `月額${body}` : price.billing === "per-visit" ? `${body}／回` : body;
  return price.extra ? `${base}${price.extra}` : base;
}

/** 表示を「数値」と「単位」に分ける（料金カードの大きな数字用） */
export function splitPrice(price: Price): { prefix: string; figure: string; unit: string; suffix: string } {
  const isMan = price.amount % MAN === 0;
  return {
    prefix: price.billing === "monthly" ? "月額" : "",
    figure: (isMan ? price.amount / MAN : price.amount).toLocaleString("ja-JP"),
    unit: isMan ? "万円〜" : "円〜",
    suffix: [price.billing === "per-visit" ? "／回" : "", price.extra ?? ""].join(""),
  };
}
