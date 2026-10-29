/** About ページの文言 */
export const aboutContent = {
  eyebrow: "About",
  title: "We Create Meaningful Experiences.",
  lead: "人と人が交わる場所に、新しい価値を。",
  body: [
    "私たちは、企業の想いや目的を理解し、それを人々の記憶に残る体験へと変えていきます。",
    "空間、音楽、演出、ホスピタリティ。",
    "それぞれの要素を丁寧に組み合わせ、企業と人、人と人の間に新しい価値を生み出します。",
  ],
  values: [
    {
      title: "Purpose",
      label: "目的から考える",
      description: "開催すること自体を目的にせず、イベントの先にある価値から逆算して設計します。",
    },
    {
      title: "Atmosphere",
      label: "世界観をつくる",
      description: "空間、音楽、照明、装飾。細部の選択を一つの体験として整え、場の空気をつくります。",
    },
    {
      title: "Hospitality",
      label: "人を迎える",
      description: "ゲストの到着から帰路まで、迎えられる側の視点で時間の流れを考えます。",
    },
  ],
} as const;

/**
 * 代表者プロフィール（編集用）。
 * 確定するまで null / 空配列のままにしてください。null の間は「準備中」として表示されます。
 */
export const representativeProfile = {
  name: null as string | null,
  /** ローマ字表記など */
  nameEn: null as string | null,
  title: "Founder / Producer",
  /** プロフィール写真（掲載許諾を得た本人の写真） */
  photo: null as { src: string; alt: string } | null,
  /** 経歴・人物紹介の段落 */
  bio: [] as string[],
};
