import { describe, expect, it } from "vitest";
import {
  FREEBUSY_SCOPE,
  buildAuthorizationUrl,
  createPkce,
  exchangeCode,
  pkceChallenge,
  revokeToken,
  safeEqual,
} from "@/server/oauth";
import { fakeFetch, jsonResponse, testConfig } from "./helpers";

const config = testConfig();

describe("PKCE / state", () => {
  it("challenge = BASE64URL(SHA-256(verifier))（WebCrypto で独立に計算して照合）", async () => {
    const verifier = "test-verifier-0123456789-abcdefghijklmnopqrstuv";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const expected = Buffer.from(digest).toString("base64url");
    expect(pkceChallenge(verifier)).toBe(expected);
    expect(expected).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("毎回異なる十分長い verifier を生成する", () => {
    const a = createPkce();
    const b = createPkce();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(a.codeChallenge).toBe(pkceChallenge(a.codeVerifier));
  });

  it("safeEqual", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("認可 URL は最小スコープ・S256・online・state を含み、シークレットを含まない", () => {
    const url = new URL(buildAuthorizationUrl(config, "STATE", "CHALLENGE"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "test-client",
      redirect_uri: "http://localhost:3000/api/auth/google/callback",
      response_type: "code",
      scope: FREEBUSY_SCOPE,
      state: "STATE",
      code_challenge: "CHALLENGE",
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account",
    });
    expect(url.toString()).not.toContain("test-secret");
  });
});

describe("トークン交換", () => {
  const NOW = 1_000_000;

  it("成功: 有効期限を 1 分早めに設定し、スコープを返す", async () => {
    const f = fakeFetch(
      jsonResponse({ access_token: "AT", expires_in: 3599, scope: FREEBUSY_SCOPE, token_type: "Bearer" }),
    );
    const r = await exchangeCode(config, "CODE", "VERIFIER", f.impl, NOW);
    expect(r).toEqual({ ok: true, accessToken: "AT", expiresAt: NOW + 3539_000, scopes: [FREEBUSY_SCOPE] });
    const body = new URLSearchParams(String(f.calls[0].init?.body));
    expect(body.get("code_verifier")).toBe("VERIFIER");
    expect(body.get("client_secret")).toBe("test-secret");
    expect(f.calls[0].url).toBe("https://oauth2.googleapis.com/token");
  });

  it.each([
    ["HTTP エラー", jsonResponse({ error: "invalid_grant" }, 400)],
    ["形式不正", jsonResponse({ foo: 1 })],
    ["Bearer 以外", jsonResponse({ access_token: "AT", expires_in: 3599, token_type: "mac" })],
    ["通信失敗", new Error("network")],
  ])("%s は失敗として扱う", async (_name, response) => {
    const f = fakeFetch(response);
    expect(await exchangeCode(config, "CODE", "V", f.impl)).toEqual({ ok: false, code: "TOKEN_EXCHANGE_FAILED" });
  });

  it("revoke", async () => {
    const f = fakeFetch(new Response(null, { status: 200 }), new Response(null, { status: 400 }), new Error("x"));
    expect(await revokeToken(config, "AT", f.impl)).toBe(true);
    expect(await revokeToken(config, "AT", f.impl)).toBe(false);
    expect(await revokeToken(config, "AT", f.impl)).toBe(false);
    expect(new URLSearchParams(String(f.calls[0].init?.body)).get("token")).toBe("AT");
  });
});
