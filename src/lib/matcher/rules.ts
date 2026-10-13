/** 照合ルール（docs/01-prd.md 8.1） */
export const MATCH_RULES = {
  /** 代替枠探索範囲（元の開始時刻から前後、分） */
  searchRangeMinutes: 180,
  /** 探索刻み（分） */
  stepMinutes: 15,
  /** 代替案の最大件数 */
  maxAlternatives: 3,
  /** 提案可能時間の開始（枠の開始がこれ以降） */
  proposalStart: "09:00",
  /** 提案可能時間の終了（枠の終了がこれ以前） */
  proposalEnd: "23:00",
} as const;

export type MatchRules = typeof MATCH_RULES;
