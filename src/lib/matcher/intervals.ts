import type { Interval } from "@/lib/types";
import { MINUTE_MS } from "@/lib/time";

/** 各 busy 区間を前後に bufferMinutes 分広げる */
export function expandIntervals(intervals: readonly Interval[], bufferMinutes: number): Interval[] {
  const pad = bufferMinutes * MINUTE_MS;
  return intervals.map((i) => ({ start: i.start - pad, end: i.end + pad }));
}

/** 重なる・接する区間を統合し、開始時刻順に並べる */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const cur of sorted) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/** 半開区間 [start, end) 同士の重なり判定（接するだけなら重ならない） */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function overlapsAny(slot: Interval, intervals: readonly Interval[]): boolean {
  return intervals.some((b) => overlaps(slot, b));
}

/** range が covered のいずれか 1 区間に完全に含まれるか */
export function isCovered(range: Interval, covered: readonly Interval[]): boolean {
  return covered.some((c) => c.start <= range.start && range.end <= c.end);
}

export function isValidInterval(i: Interval): boolean {
  return Number.isFinite(i.start) && Number.isFinite(i.end) && i.start < i.end;
}
