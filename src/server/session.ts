import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import { randomBytes } from "node:crypto";
import type { ServerConfig } from "./env";

/**
 * 暗号化 Cookie によるサーバー側セッション（docs/03-architecture.md 3.）。
 * 中身は AES-256-GCM で暗号化され、サーバーの鍵がなければ読めない・改ざんできない。
 */

export interface SessionData {
  /** Google のアクセストークン（ブラウザには出さない） */
  accessToken: string;
  /** 失効時刻（エポックミリ秒） */
  expiresAt: number;
  sessionId: string;
}

export interface OAuthPending {
  state: string;
  codeVerifier: string;
}

const ISSUER = "kyre-schedule";

export function cookieNames(config: Pick<ServerConfig, "secureCookies">) {
  // __Host- 接頭辞は HTTPS でのみ使える（Secure・Path=/・Domain なしをブラウザが強制）
  const prefix = config.secureCookies ? "__Host-" : "";
  return { session: `${prefix}kyre_session`, oauth: `${prefix}kyre_oauth` };
}

export function cookieOptions(config: Pick<ServerConfig, "secureCookies">, maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  };
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

async function seal(payload: Record<string, unknown>, purpose: string, expiresAt: number, key: Uint8Array) {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer(ISSUER)
    .setAudience(purpose)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .encrypt(key);
}

async function unseal(
  token: string,
  purpose: string,
  keys: Uint8Array[],
  now: number,
): Promise<Record<string, unknown> | null> {
  for (const key of keys) {
    try {
      const { payload } = await jwtDecrypt(token, key, {
        issuer: ISSUER,
        audience: purpose,
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
        currentDate: new Date(now),
      });
      return payload;
    } catch {
      // 次の鍵（ローテーション前の旧鍵）で試す
    }
  }
  return null;
}

export async function sealSession(data: SessionData, config: Pick<ServerConfig, "sessionKeys">): Promise<string> {
  return seal({ at: data.accessToken, sid: data.sessionId }, "session", data.expiresAt, config.sessionKeys[0]);
}

export async function unsealSession(
  token: string | undefined,
  config: Pick<ServerConfig, "sessionKeys">,
  now = Date.now(),
): Promise<SessionData | null> {
  if (!token) return null;
  const p = await unseal(token, "session", config.sessionKeys, now);
  if (!p || typeof p.at !== "string" || typeof p.sid !== "string" || typeof p.exp !== "number") return null;
  const expiresAt = p.exp * 1000;
  if (expiresAt <= now) return null;
  return { accessToken: p.at, sessionId: p.sid, expiresAt };
}

export const OAUTH_PENDING_TTL_MS = 10 * 60 * 1000;

export async function sealOAuthPending(
  data: OAuthPending,
  config: Pick<ServerConfig, "sessionKeys">,
  now = Date.now(),
): Promise<string> {
  return seal({ st: data.state, cv: data.codeVerifier }, "oauth", now + OAUTH_PENDING_TTL_MS, config.sessionKeys[0]);
}

export async function unsealOAuthPending(
  token: string | undefined,
  config: Pick<ServerConfig, "sessionKeys">,
  now = Date.now(),
): Promise<OAuthPending | null> {
  if (!token) return null;
  const p = await unseal(token, "oauth", config.sessionKeys, now);
  if (!p || typeof p.st !== "string" || typeof p.cv !== "string") return null;
  return { state: p.st, codeVerifier: p.cv };
}
