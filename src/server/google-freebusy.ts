import "server-only";
import { z } from "zod";
import type { CalendarErrorCode, Interval } from "@/lib/types";
import type { ServerConfig } from "./env";
import { logEvent } from "./logger";

const HTTP_TIMEOUT_MS = 5000;
/** 1 回の FreeBusy 問い合わせでまとめる最大期間 */
const MAX_GROUP_SPAN_MS = 31 * 24 * 3600_000;

export type FreeBusyResult =
  { status: "ok"; busy: Interval[]; coveredRanges: Interval[] } | { status: "error"; code: CalendarErrorCode };

const isoInstant = z.iso.datetime({ offset: true });

const calendarEntry = z.object({
  busy: z.array(z.object({ start: isoInstant, end: isoInstant })).optional(),
  errors: z.array(z.unknown()).optional(),
});

const freeBusyResponse = z.object({ calendars: z.record(z.string(), calendarEntry) });

const googleError = z.object({
  error: z.object({ errors: z.array(z.object({ reason: z.string().optional() })).optional() }).optional(),
});

/** 近い範囲を 31 日以内の塊にまとめて問い合わせ回数を減らす */
export function groupRanges(ranges: readonly Interval[]): Interval[][] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const groups: Interval[][] = [];
  for (const r of sorted) {
    const g = groups.at(-1);
    if (g && r.end - g[0].start <= MAX_GROUP_SPAN_MS) g.push(r);
    else groups.push([r]);
  }
  return groups;
}

/**
 * primary カレンダーの busy 区間を取得する。
 * 1 つでも失敗・不正な応答があれば全体をエラーにする（「空き」と誤表示しないため）。
 */
export async function fetchFreeBusy(
  config: Pick<ServerConfig, "endpoints">,
  accessToken: string,
  ranges: readonly Interval[],
  timeZone: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FreeBusyResult> {
  const groups = groupRanges(ranges);
  const results = await Promise.all(groups.map((g) => fetchGroup(config, accessToken, g, timeZone, fetchImpl)));
  const busy: Interval[] = [];
  for (const r of results) {
    if (r.status === "error") return r;
    busy.push(...r.busy);
  }
  logEvent("freebusy_ok", { rangeCount: ranges.length, groupCount: groups.length });
  return { status: "ok", busy, coveredRanges: ranges.map((r) => ({ ...r })) };
}

async function fetchGroup(
  config: Pick<ServerConfig, "endpoints">,
  accessToken: string,
  group: Interval[],
  timeZone: string,
  fetchImpl: typeof fetch,
): Promise<{ status: "ok"; busy: Interval[] } | { status: "error"; code: CalendarErrorCode }> {
  const timeMin = new Date(group[0].start).toISOString();
  const timeMax = new Date(Math.max(...group.map((r) => r.end))).toISOString();
  let res: Response;
  try {
    res = await fetchImpl(config.endpoints.freeBusy, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin, timeMax, timeZone, items: [{ id: "primary" }] }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    logEvent("freebusy_failed", { reason: "network_or_timeout" });
    return { status: "error", code: "FETCH_FAILED" };
  }

  if (!res.ok) {
    const reason = googleError.safeParse(await res.json().catch(() => null)).data?.error?.errors?.[0]?.reason;
    logEvent("freebusy_failed", { googleStatus: res.status, googleReason: reason });
    return { status: "error", code: mapGoogleError(res.status, reason) };
  }

  const parsed = freeBusyResponse.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    logEvent("freebusy_failed", { reason: "invalid_response" });
    return { status: "error", code: "FETCH_FAILED" };
  }
  const calendars = Object.values(parsed.data.calendars);
  const entry = parsed.data.calendars.primary ?? (calendars.length === 1 ? calendars[0] : undefined);
  if (!entry || (entry.errors && entry.errors.length > 0) || !entry.busy) {
    logEvent("freebusy_failed", { reason: "calendar_error" });
    return { status: "error", code: "FETCH_FAILED" };
  }

  const busy = entry.busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
  if (busy.some((b) => !Number.isFinite(b.start) || !Number.isFinite(b.end) || b.start >= b.end)) {
    logEvent("freebusy_failed", { reason: "invalid_interval" });
    return { status: "error", code: "FETCH_FAILED" };
  }
  return { status: "ok", busy };
}

export function mapGoogleError(status: number, reason: string | undefined): CalendarErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 429 || reason === "rateLimitExceeded" || reason === "userRateLimitExceeded") return "RATE_LIMITED";
  if (status === 403) return "PERMISSION_DENIED";
  return "FETCH_FAILED";
}
