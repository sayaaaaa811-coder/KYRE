import type { CalendarFetchResult, Interval } from "@/lib/types";
import { addDays, epochToZoned, parseIsoDate, zonedToEpoch } from "@/lib/time";
import type { CalendarProvider } from "./types";

/**
 * ダミーカレンダーのシナリオ（デモ・開発・E2E 用）。
 * - mixed:    毎日 12:00-13:00、偶数日は 18:30-20:00 が予定あり。7 の倍数の日は終日予定。
 * - all_free: 予定なし
 * - all_busy: 毎日 09:00-23:00 が予定あり
 * - all_day:  取得範囲のすべての日が終日予定
 * - error:    取得失敗
 */
export const MOCK_SCENARIOS = ["mixed", "all_free", "all_busy", "all_day", "error"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function isMockScenario(value: unknown): value is MockScenario {
  return typeof value === "string" && (MOCK_SCENARIOS as readonly string[]).includes(value);
}

export function mockBusyForDate(date: string, scenario: MockScenario, timeZone: string): Interval[] {
  const at = (time: string) => zonedToEpoch(date, time, timeZone);
  const allDay = { start: at("00:00"), end: zonedToEpoch(addDays(date, 1), "00:00", timeZone) };
  const { day } = parseIsoDate(date);
  switch (scenario) {
    case "all_free":
    case "error":
      return [];
    case "all_busy":
      return [{ start: at("09:00"), end: at("23:00") }];
    case "all_day":
      return [allDay];
    case "mixed": {
      if (day % 7 === 0) return [allDay];
      const busy = [{ start: at("12:00"), end: at("13:00") }];
      if (day % 2 === 0) busy.push({ start: at("18:30"), end: at("20:00") });
      return busy;
    }
  }
}

export function createMockCalendar(options: {
  scenario: MockScenario;
  timeZone: string;
  delayMs?: number;
}): CalendarProvider {
  const { scenario, timeZone, delayMs = 0 } = options;
  return {
    kind: "mock",
    async fetchBusy(ranges): Promise<CalendarFetchResult> {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      if (scenario === "error") return { status: "error", code: "FETCH_FAILED" };

      const busy: Interval[] = [];
      for (const range of ranges) {
        let date = epochToZoned(range.start, timeZone).date;
        while (zonedToEpoch(date, "00:00", timeZone) < range.end) {
          busy.push(...mockBusyForDate(date, scenario, timeZone));
          date = addDays(date, 1);
        }
      }
      return { status: "ok", busy, coveredRanges: ranges.map((r) => ({ ...r })) };
    },
  };
}
