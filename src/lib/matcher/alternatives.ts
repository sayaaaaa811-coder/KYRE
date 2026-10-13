import type { Interval, IsoDate } from "@/lib/types";
import { MINUTE_MS, zonedToEpoch } from "@/lib/time";
import { overlapsAny } from "./intervals";
import { MATCH_RULES, type MatchRules } from "./rules";

/**
 * 探索オフセット（分）を優先順に返す。
 * 近い順、同距離なら後ろ（+）を先: +15, -15, +30, -30, ...
 */
export function searchOffsets(rangeMinutes: number, stepMinutes: number): number[] {
  const offsets: number[] = [];
  for (let d = stepMinutes; d <= rangeMinutes; d += stepMinutes) {
    offsets.push(d, -d);
  }
  return offsets;
}

export interface AlternativeSearchInput {
  /** 元の候補の開始時刻（エポックミリ秒） */
  start: number;
  /** 候補の暦日（提案可能時間の基準） */
  date: IsoDate;
  durationMinutes: number;
  /** 余裕時間で拡張・統合済みの busy 区間 */
  mergedBusy: readonly Interval[];
  timeZone: string;
  /** これより前に始まる枠は提案しない */
  now: number;
  rules?: MatchRules;
}

export function findAlternatives(input: AlternativeSearchInput): Interval[] {
  const rules = input.rules ?? MATCH_RULES;
  const duration = input.durationMinutes * MINUTE_MS;
  const windowStart = zonedToEpoch(input.date, rules.proposalStart, input.timeZone);
  const windowEnd = zonedToEpoch(input.date, rules.proposalEnd, input.timeZone);

  const result: Interval[] = [];
  for (const offset of searchOffsets(rules.searchRangeMinutes, rules.stepMinutes)) {
    const start = input.start + offset * MINUTE_MS;
    const slot = { start, end: start + duration };
    if (slot.start < windowStart || slot.end > windowEnd) continue;
    if (slot.start < input.now) continue;
    if (overlapsAny(slot, input.mergedBusy)) continue;
    result.push(slot);
    if (result.length >= rules.maxAlternatives) break;
  }
  return result;
}
