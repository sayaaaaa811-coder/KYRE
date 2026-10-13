import "server-only";
import { z } from "zod";
import type { Interval } from "@/lib/types";

export const MAX_BODY_BYTES = 4096;
const DAY_MS = 24 * 3600_000;

const bodySchema = z.object({
  ranges: z
    .array(z.object({ start: z.number().int(), end: z.number().int() }).strict())
    .min(1)
    .max(10),
});

/**
 * /api/freebusy のリクエスト本文を検証する。
 * 各範囲は 1 日分以内（夏時間の国も考慮し 26 時間まで）、過去 2 日〜400 日先まで。
 */
export function parseFreeBusyRequest(text: string, now = Date.now()): Interval[] | null {
  if (text.length > MAX_BODY_BYTES) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const body = bodySchema.safeParse(raw);
  if (!body.success) return null;
  const ok = body.data.ranges.every(
    (r) =>
      r.end > r.start && r.end - r.start <= 26 * 3600_000 && r.start >= now - 2 * DAY_MS && r.end <= now + 400 * DAY_MS,
  );
  return ok ? body.data.ranges : null;
}
