/**
 * 運営者情報（プライバシーポリシー・利用規約に表示）。
 * 公開前に実際の情報へ置き換えること（docs/progress/phase-5.md 参照）。
 */
export const OPERATOR = {
  name: "【運営者名を記入】",
  contactEmail: "【お問い合わせ用メールアドレスを記入】",
  /** ポリシーの制定日・改定日 */
  effectiveDate: "2026年10月13日",
} as const;

export const OPERATOR_INFO_FILLED = !OPERATOR.name.startsWith("【") && !OPERATOR.contactEmail.startsWith("【");
