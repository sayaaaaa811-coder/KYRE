import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { ServerConfig } from "./env";
import { logEvent } from "./logger";
import { randomToken } from "./session";

/** 予定の有無（busy 時刻）だけを読める最小権限のスコープ */
export const FREEBUSY_SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

const HTTP_TIMEOUT_MS = 5000;

export function createPkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomToken(32);
  return { codeVerifier, codeChallenge: pkceChallenge(codeVerifier) };
}

export function pkceChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function buildAuthorizationUrl(
  config: Pick<ServerConfig, "clientId" | "redirectUri" | "endpoints">,
  state: string,
  codeChallenge: string,
): string {
  const url = new URL(config.endpoints.authorize);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: FREEBUSY_SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** 定数時間比較（タイミング攻撃対策） */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const tokenResponse = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
  token_type: z.string(),
});

export type TokenResult =
  { ok: true; accessToken: string; expiresAt: number; scopes: string[] } | { ok: false; code: "TOKEN_EXCHANGE_FAILED" };

export async function exchangeCode(
  config: Pick<ServerConfig, "clientId" | "clientSecret" | "redirectUri" | "endpoints">,
  code: string,
  codeVerifier: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<TokenResult> {
  try {
    const res = await fetchImpl(config.endpoints.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      logEvent("token_exchange_failed", { googleStatus: res.status });
      return { ok: false, code: "TOKEN_EXCHANGE_FAILED" };
    }
    const parsed = tokenResponse.safeParse(await res.json());
    if (!parsed.success || parsed.data.token_type.toLowerCase() !== "bearer") {
      logEvent("token_exchange_failed", { reason: "invalid_response" });
      return { ok: false, code: "TOKEN_EXCHANGE_FAILED" };
    }
    return {
      ok: true,
      accessToken: parsed.data.access_token,
      // 余裕を持って 1 分早く失効扱いにする
      expiresAt: now + (parsed.data.expires_in - 60) * 1000,
      scopes: (parsed.data.scope ?? "").split(" ").filter(Boolean),
    };
  } catch {
    logEvent("token_exchange_failed", { reason: "network" });
    return { ok: false, code: "TOKEN_EXCHANGE_FAILED" };
  }
}

/** Google 側でトークンを失効させる（失敗してもセッションは削除する） */
export async function revokeToken(
  config: Pick<ServerConfig, "endpoints">,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(config.endpoints.revoke, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) logEvent("revoke_failed", { googleStatus: res.status });
    return res.ok;
  } catch {
    logEvent("revoke_failed", { reason: "network" });
    return false;
  }
}
