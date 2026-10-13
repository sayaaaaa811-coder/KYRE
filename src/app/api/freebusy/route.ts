import type { NextRequest } from "next/server";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getServerConfig } from "@/server/env";
import { MAX_BODY_BYTES, parseFreeBusyRequest } from "@/server/freebusy-request";
import { fetchFreeBusy } from "@/server/google-freebusy";
import { isTrustedRequest, json, jsonError, readBodyLimited } from "@/server/http";
import { logEvent } from "@/server/logger";
import { RATE_LIMITS, clientIp, consume } from "@/server/rate-limit";
import { cookieNames, cookieOptions, unsealSession } from "@/server/session";

const STATUS_FOR = { UNAUTHENTICATED: 401, PERMISSION_DENIED: 403, RATE_LIMITED: 429, FETCH_FAILED: 502, NETWORK: 502 };

/**
 * 空き状況の取得。ブラウザから受け取るのは時間範囲のみ（メッセージ本文は受け取らない）。
 * 返すのは busy の時刻のみ（予定の件名などは Google からも返らない）。
 */
export async function POST(request: NextRequest) {
  const started = Date.now();
  const config = getServerConfig();
  if (!config) return jsonError(503, "NOT_CONFIGURED");
  if (!isTrustedRequest(request, config) || !request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError(403, "FORBIDDEN");
  }
  if (!consume(`fb:ip:${clientIp(request.headers)}`, RATE_LIMITS.freeBusyPerIp)) return jsonError(429, "RATE_LIMITED");

  const names = cookieNames(config);
  const raw = request.cookies.get(names.session)?.value;
  const session = await unsealSession(raw, config);
  if (!session) {
    const res = jsonError(401, "UNAUTHENTICATED");
    if (raw) res.cookies.set(names.session, "", cookieOptions(config, 0));
    return res;
  }
  if (!consume(`fb:sid:${session.sessionId}`, RATE_LIMITS.freeBusyPerSession)) return jsonError(429, "RATE_LIMITED");

  const text = await readBodyLimited(request, MAX_BODY_BYTES);
  if (text === null) return jsonError(413, "TOO_LARGE");
  const ranges = parseFreeBusyRequest(text);
  if (!ranges) return jsonError(400, "BAD_REQUEST");

  const result = await fetchFreeBusy(config, session.accessToken, ranges, DEFAULT_SETTINGS.timeZone);
  logEvent("freebusy", {
    route: "freebusy",
    status: result.status === "ok" ? 200 : STATUS_FOR[result.code],
    code: result.status === "error" ? result.code : undefined,
    rangeCount: ranges.length,
    durationMs: Date.now() - started,
  });

  if (result.status === "error") {
    const res = jsonError(STATUS_FOR[result.code], result.code);
    if (result.code === "UNAUTHENTICATED") res.cookies.set(names.session, "", cookieOptions(config, 0));
    return res;
  }
  return json(result);
}
