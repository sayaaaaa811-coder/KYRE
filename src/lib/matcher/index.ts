import type { CalendarFetchResult, Candidate, CandidateEvaluation, Interval, Settings } from "@/lib/types";
import { MINUTE_MS, dayRange, zonedToEpoch } from "@/lib/time";
import { findAlternatives } from "./alternatives";
import { expandIntervals, isCovered, isValidInterval, mergeIntervals, overlapsAny } from "./intervals";
import { MATCH_RULES, type MatchRules } from "./rules";

export { MATCH_RULES } from "./rules";

export interface EvaluateInput {
  candidates: readonly Candidate[];
  calendar: CalendarFetchResult;
  settings: Settings;
  /** 現在時刻（エポックミリ秒）。テストで固定できるよう引数で受け取る。 */
  now: number;
  rules?: MatchRules;
}

/**
 * 候補ごとに参加可否と代替案を判定する（docs/01-prd.md 8.2）。
 * 予定を確実に取得できていない場合は決して "available" を返さない。
 */
export function evaluateCandidates(input: EvaluateInput): CandidateEvaluation[] {
  const { settings, calendar, now } = input;
  const rules = input.rules ?? MATCH_RULES;
  const duration = settings.durationMinutes * MINUTE_MS;

  const calendarUsable =
    calendar.status === "ok" && calendar.busy.every(isValidInterval) && calendar.coveredRanges.every(isValidInterval);
  const mergedBusy: Interval[] = calendarUsable
    ? mergeIntervals(expandIntervals(calendar.busy, settings.bufferMinutes))
    : [];

  return input.candidates.map((candidate): CandidateEvaluation => {
    const start = zonedToEpoch(candidate.date, candidate.startTime, settings.timeZone);
    const slot = { start, end: start + duration };
    const day = dayRange(candidate.date, settings.timeZone);
    const base = { candidateId: candidate.id, slot, alternatives: [] as Interval[] };

    if (slot.start < now) {
      return { ...base, status: "out_of_scope", reason: "past" };
    }
    if (slot.end > day.end) {
      return { ...base, status: "out_of_scope", reason: "crosses_midnight" };
    }
    if (calendar.status !== "ok" || !calendarUsable || !isCovered(day, calendar.coveredRanges)) {
      return { ...base, status: "fetch_failed" };
    }
    if (!overlapsAny(slot, mergedBusy)) {
      return { ...base, status: "available" };
    }

    const alternatives = findAlternatives({
      start,
      date: candidate.date,
      durationMinutes: settings.durationMinutes,
      activeHours: settings.activeHours,
      mergedBusy,
      timeZone: settings.timeZone,
      now,
      rules,
    });
    return {
      ...base,
      alternatives,
      status: alternatives.length > 0 ? "busy_with_alternatives" : "busy_no_alternatives",
    };
  });
}

/** 候補の暦日ごとの取得範囲（重複除去・日付順） */
export function rangesForCandidates(candidates: readonly Candidate[], timeZone: string): Interval[] {
  const dates = [...new Set(candidates.map((c) => c.date))].sort();
  return dates.map((d) => dayRange(d, timeZone));
}
