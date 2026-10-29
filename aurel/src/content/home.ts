/** トップページの文言 */
export const homeContent = {
  hero: {
    eyebrow: "Event & Experience Production",
    title: "Beyond the Ordinary.",
    lead: "その一日を、記憶に残る体験へ。",
    body: ["企業イベントからブランド体験、空間活用まで。", "人が集う時間に、目的と世界観を。", "企画から運営まで、一つひとつの体験を丁寧に設計します。"],
    cta: { label: "お問い合わせ・お見積り", href: "/contact" },
  },
  introduction: {
    eyebrow: "Introduction",
    title: "We Create Meaningful Experiences.",
    lead: "人と人が交わる場所に、新しい価値を。",
    body: [
      "イベントは、単なる集まりではありません。",
      "組織の結束を深める機会であり、ブランドの価値を伝える場であり、新しい関係が生まれる瞬間でもあります。",
      "私たちは、開催すること自体を目的とせず、その先にある価値を大切にします。",
    ],
  },
  services: {
    eyebrow: "Services",
    title: "What We Do",
    lead: "目的に合わせて選べる、3つのサービス。",
  },
  experience: {
    eyebrow: "Experience",
    title: "Background",
    lead: "代表者がこれまでに手がけてきたイベント。",
  },
  process: {
    eyebrow: "Process",
    title: "How We Work",
    lead: "ご相談から振り返りまで、一貫して伴走します。",
  },
  cta: {
    title: "Let's Create Something Memorable.",
    lead: "そのイベントに、特別な価値を。",
    body: "ご検討段階のご相談やお見積りのご依頼も承ります。内容が固まっていなくても、お気軽にお問い合わせください。",
    label: "無料相談・お見積りはこちら",
    href: "/contact",
  },
} as const;

/** 共通の制作プロセス */
export const process = [
  {
    number: "01",
    title: "Consultation",
    label: "ご相談",
    description: "開催の目的や背景、参加される方、時期とご予算感を伺います。検討段階のご相談も歓迎しています。",
  },
  {
    number: "02",
    title: "Proposal",
    label: "ご提案",
    description: "目的に沿ったコンセプトと全体像、プランとお見積りをご提案します。",
  },
  {
    number: "03",
    title: "Planning",
    label: "企画・準備",
    description: "会場、プログラム、演出、運営体制を具体化し、協力会社との調整を進めます。",
  },
  {
    number: "04",
    title: "Production",
    label: "制作・当日運営",
    description: "設営から本番の進行まで現場を統括し、当日の判断を引き受けます。",
  },
  {
    number: "05",
    title: "Review",
    label: "振り返り",
    description: "開催後に振り返りを行い、成果と次回に活かせる気づきを共有します。",
  },
] as const;
