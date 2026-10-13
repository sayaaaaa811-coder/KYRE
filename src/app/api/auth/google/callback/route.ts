import type { NextRequest } from "next/server";
import { getServerConfig } from "@/server/env";
import { jsonError, redirectHome } from "@/server/http";
import { logEvent } from "@/server/logger";
import { FREEBUSY_SCOPE, exchangeCode, revokeToken, safeEqual } from "@/server/oauth";
import { RATE_LIMITS, clientIp, consume } from "@/server/rate-limit";
import { cookieNames, cookieOptions, randomToken, sealSession, unsealOAuthPending } from "@/server/session";

/** Google からの戻り: state を検証し、認可コードをサーバー側でトークンに交換する */
export async function GET(request: NextRequest) {
  const config = getServerConfig();
  if (!config) return jsonError(503, "NOT_CONFIGURED");
  const names = cookieNames(config);

  const fail = (reason: string) => {
    logEvent("auth_failed", { route: "auth/callback", reason });
    const res = redirectHome(config, { auth_error: reason });
    res.cookies.set(names.oauth, "", cookieOptions(config, 0));
    return res;
  };

  if (!consume(`auth:${clientIp(request.headers)}`, RATE_LIMITS.authPerIp)) return fail("rate_limited");

  const params = request.nextUrl.searchParams;
  const pending = await unsealOAuthPending(request.cookies.get(names.oauth)?.value, config);
  const state = params.get("state");
  // state は 1 回限り: 一時 Cookie はどの結果でも削除する
  if (!pending || !state || !safeEqual(state, pending.state)) return fail("state");

  const error = params.get("error");
  if (error) return fail(error === "access_denied" ? "denied" : "failed");

  const code = params.get("code");
  if (!code) return fail("failed");

  const token = await exchangeCode(config, code, pending.codeVerifier);
  if (!token.ok) return fail("failed");

  if (!token.scopes.includes(FREEBUSY_SCOPE)) {
    // カレンダーの権限のチェックが外された（部分的な同意）
    await revokeToken(config, token.accessToken);
    return fail("scope");
  }

  const res = redirectHome(config, { restore: "1" });
  res.cookies.set(names.oauth, "", cookieOptions(config, 0));
  res.cookies.set(
    names.session,
    await sealSession(
      { accessToken: token.accessToken, expiresAt: token.expiresAt, sessionId: randomToken(16) },
      config,
    ),
    cookieOptions(config, (token.expiresAt - Date.now()) / 1000),
  );
  logEvent("auth_success", { route: "auth/callback" });
  return res;
}
