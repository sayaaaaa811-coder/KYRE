import type { CalendarFetchResult, Interval } from "@/lib/types";

/** カレンダーの空き状況取得元。ダミーと Google 実装を差し替えられるようにする。 */
export interface CalendarProvider {
  readonly kind: "mock" | "google";
  /** ranges の各区間について busy 区間を取得する */
  fetchBusy(ranges: readonly Interval[], options?: { signal?: AbortSignal }): Promise<CalendarFetchResult>;
}
