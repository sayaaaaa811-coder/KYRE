import type { CalendarErrorCode, CalendarFetchResult, Interval } from "@/lib/types";
import type { CalendarProvider } from "./types";

const ERROR_CODES: readonly CalendarErrorCode[] = [
  "FETCH_FAILED",
  "UNAUTHENTICATED",
  "PERMISSION_DENIED",
  "RATE_LIMITED",
  "NETWORK",
];

function isIntervalArray(value: unknown): value is Interval[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        Number.isFinite((v as Interval).start) &&
        Number.isFinite((v as Interval).end) &&
        (v as Interval).start < (v as Interval).end,
    )
  );
}

/** ブラウザ → KYRE サーバー（/api/freebusy）経由で Google カレンダーの空き状況を取得する */
export function createGoogleCalendar(fetchImpl: typeof fetch = (...a) => fetch(...a)): CalendarProvider {
  return {
    kind: "google",
    async fetchBusy(ranges, options): Promise<CalendarFetchResult> {
      let res: Response;
      try {
        res = await fetchImpl("/api/freebusy", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-KYRE-Request": "1" },
          body: JSON.stringify({ ranges: ranges.map((r) => ({ start: r.start, end: r.end })) }),
          signal: options?.signal,
        });
      } catch {
        return { status: "error", code: "NETWORK" };
      }
      const body: unknown = await res.json().catch(() => null);
      const b = (body ?? {}) as Record<string, unknown>;
      if (res.ok && b.status === "ok" && isIntervalArray(b.busy) && isIntervalArray(b.coveredRanges)) {
        return { status: "ok", busy: b.busy, coveredRanges: b.coveredRanges };
      }
      const code = ERROR_CODES.find((c) => c === b.code);
      if (code) return { status: "error", code };
      if (res.status === 401) return { status: "error", code: "UNAUTHENTICATED" };
      return { status: "error", code: "FETCH_FAILED" };
    },
  };
}
