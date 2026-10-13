import { NextResponse, type NextRequest } from "next/server";
import { getServerConfig } from "@/server/env";
import { jsonError, redirectHome } from "@/server/http";
import { logEvent } from "@/server/logger";
import { buildAuthorizationUrl, createPkce } from "@/server/oauth";
import { RATE_LIMITS, clientIp, consume } from "@/server/rate-limit";
import { OAUTH_PENDING_TTL_MS, cookieNames, cookieOptions, randomToken, sealOAuthPending } from "@/server/session";

/** Google 連携の開始: state と PKCE を生成し、暗号化した一時 Cookie に保存して Google へ送る */
export async function GET(request: NextRequest) {
  const config = getServerConfig();
  if (!config) return jsonError(503, "NOT_CONFIGURED");
  if (!consume(`auth:${clientIp(request.headers)}`, RATE_LIMITS.authPerIp)) {
    return redirectHome(config, { auth_error: "rate_limited" });
  }

  const state = randomToken();
  const { codeVerifier, codeChallenge } = createPkce();
  const response = NextResponse.redirect(buildAuthorizationUrl(config, state, codeChallenge), {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(
    cookieNames(config).oauth,
    await sealOAuthPending({ state, codeVerifier }, config),
    cookieOptions(config, OAUTH_PENDING_TTL_MS / 1000),
  );
  logEvent("auth_start", { route: "auth/start" });
  return response;
}
