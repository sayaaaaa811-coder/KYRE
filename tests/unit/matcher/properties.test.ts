import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { evaluateCandidates } from "@/lib/matcher";
import { MATCH_RULES } from "@/lib/matcher/rules";
import { expandIntervals, mergeIntervals, overlapsAny } from "@/lib/matcher/intervals";
import { MINUTE_MS, dayRange, zonedToEpoch } from "@/lib/time";
import { BUFFER_OPTIONS, DURATION_OPTIONS, type Interval } from "@/lib/types";

const TZ = "Asia/Tokyo";
const DATE = "2026-10-21";
const NOW = zonedToEpoch("2026-10-13", "00:00", TZ);
const DAY = dayRange(DATE, TZ);

const busyArb = fc
  .array(fc.record({ startMin: fc.integer({ min: -120, max: 1560 }), lenMin: fc.integer({ min: 1, max: 600 }) }), {
    maxLength: 8,
  })
  .map((xs) =>
    xs.map(({ startMin, lenMin }): Interval => ({
      start: DAY.start + startMin * MINUTE_MS,
      end: DAY.start + (startMin + lenMin) * MINUTE_MS,
    })),
  );

const timeArb = fc
  .integer({ min: 0, max: 95 })
  .map((q) => `${String(Math.floor(q / 4)).padStart(2, "0")}:${String((q % 4) * 15).padStart(2, "0")}`);

describe("照合ロジックの性質（ランダム検証）", () => {
  it("参加可能・代替案の枠は、余裕時間込みの予定と決して重ならず、ルールの範囲内にある", () => {
    fc.assert(
      fc.property(
        busyArb,
        timeArb,
        fc.constantFrom(...DURATION_OPTIONS),
        fc.constantFrom(...BUFFER_OPTIONS),
        (busy, startTime, durationMinutes, bufferMinutes) => {
          const [r] = evaluateCandidates({
            candidates: [{ id: "x", date: DATE, startTime, ambiguities: [] }],
            calendar: { status: "ok", busy, coveredRanges: [DAY] },
            settings: { durationMinutes, bufferMinutes, timeZone: TZ },
            now: NOW,
          });
          const merged = mergeIntervals(expandIntervals(busy, bufferMinutes));
          const windowStart = zonedToEpoch(DATE, MATCH_RULES.proposalStart, TZ);
          const windowEnd = zonedToEpoch(DATE, MATCH_RULES.proposalEnd, TZ);
          const range = MATCH_RULES.searchRangeMinutes * MINUTE_MS;

          if (r.status === "available") expect(overlapsAny(r.slot, merged)).toBe(false);
          if (r.status.startsWith("busy")) expect(overlapsAny(r.slot, merged)).toBe(true);

          expect(r.alternatives.length).toBeLessThanOrEqual(MATCH_RULES.maxAlternatives);
          for (const alt of r.alternatives) {
            expect(overlapsAny(alt, merged)).toBe(false);
            expect(alt.start).toBeGreaterThanOrEqual(windowStart);
            expect(alt.end).toBeLessThanOrEqual(windowEnd);
            expect(Math.abs(alt.start - r.slot.start)).toBeLessThanOrEqual(range);
            expect(Math.abs((alt.start - r.slot.start) % (MATCH_RULES.stepMinutes * MINUTE_MS))).toBe(0);
            expect(alt.end - alt.start).toBe(durationMinutes * MINUTE_MS);
          }
          // 近い順に並んでいる
          const dists = r.alternatives.map((a) => Math.abs(a.start - r.slot.start));
          expect(dists).toEqual([...dists].sort((a, b) => a - b));
        },
      ),
      { numRuns: 3000 },
    );
  });

  it("取得失敗時はどんな入力でも参加可能にならない", () => {
    fc.assert(
      fc.property(timeArb, fc.constantFrom(...DURATION_OPTIONS), (startTime, durationMinutes) => {
        const [r] = evaluateCandidates({
          candidates: [{ id: "x", date: DATE, startTime, ambiguities: [] }],
          calendar: { status: "error", code: "FETCH_FAILED" },
          settings: { durationMinutes, bufferMinutes: 15, timeZone: TZ },
          now: NOW,
        });
        expect(r.status === "available" || r.alternatives.length > 0).toBe(false);
      }),
    );
  });
});
