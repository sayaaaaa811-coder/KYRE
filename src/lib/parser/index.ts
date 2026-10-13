import type { Candidate, IsoDate } from "@/lib/types";

export interface ParseOptions {
  /** 相対日付（明日・来週など）の基準日 */
  referenceDate: IsoDate;
  timeZone: string;
}

export interface ParseResult {
  candidates: Omit<Candidate, "id">[];
}

/**
 * 日本語メッセージから日時候補を抽出する。
 * Phase 1 では未実装（常に 0 件）。Phase 2 でルールベースの解析を実装する。
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseMessage(_text: string, _options: ParseOptions): ParseResult {
  return { candidates: [] };
}

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CANDIDATES = 10;
