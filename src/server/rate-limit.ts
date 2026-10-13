import "server-only";

/**
 * メモリ内の固定ウィンドウ方式レート制限。
 * サーバーレス環境ではインスタンスごとの計数になるため厳密ではない（docs/03-architecture.md 6.）。
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  freeBusyPerSession: { limit: 30, windowMs: 10 * 60_000 },
  freeBusyPerIp: { limit: 60, windowMs: 10 * 60_000 },
  authPerIp: { limit: 30, windowMs: 10 * 60_000 },
} satisfies Record<string, RateLimitRule>;

export function consume(key: string, rule: RateLimitRule, now = Date.now()): boolean {
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }
  bucket.count++;
  return bucket.count <= rule.limit;
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** 接続元 IP（ホスティングのプロキシが付ける X-Forwarded-For の先頭） */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
