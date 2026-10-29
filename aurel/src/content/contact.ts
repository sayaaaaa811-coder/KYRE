import { services } from "./services";

/** お問い合わせフォームの選択肢 */
export const serviceOptions = [
  ...services.map((s) => ({ value: s.slug, label: `${s.title}（${s.label}）` })),
  { value: "undecided", label: "未定・まだ決まっていない" },
] as const;

export const budgetOptions = [
  { value: "undecided", label: "未定" },
  { value: "under-500k", label: "50万円未満" },
  { value: "500k-1m", label: "50万〜100万円" },
  { value: "1m-3m", label: "100万〜300万円" },
  { value: "over-3m", label: "300万円以上" },
] as const;

export const attendeeOptions = [
  { value: "undecided", label: "未定" },
  { value: "under-30", label: "30名未満" },
  { value: "30-100", label: "30〜100名" },
  { value: "100-200", label: "100〜200名" },
  { value: "200-500", label: "200〜500名" },
  { value: "over-500", label: "500名以上" },
  { value: "not-applicable", label: "該当しない（施設のご相談など）" },
] as const;
