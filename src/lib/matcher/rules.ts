/** 照合ルール（docs/01-prd.md 8.1）。提案する時間帯はユーザー設定（Settings.activeHours）。 */
export const MATCH_RULES = {
  /** 代替枠探索範囲（元の開始時刻から前後、分） */
  searchRangeMinutes: 180,
  /** 探索刻み（分） */
  stepMinutes: 15,
  /** 代替案の最大件数 */
  maxAlternatives: 3,
} as const;

export type MatchRules = typeof MATCH_RULES;
