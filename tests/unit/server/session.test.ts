import { describe, expect, it } from "vitest";
import {
  cookieNames,
  cookieOptions,
  sealOAuthPending,
  sealSession,
  unsealOAuthPending,
  unsealSession,
} from "@/server/session";
import { TEST_ENV, testConfig } from "./helpers";

const config = testConfig();
const NOW = Date.parse("2026-10-13T01:00:00Z");
const data = { accessToken: "ya29.secret-token", expiresAt: NOW + 3600_000, sessionId: "sid123" };

describe("暗号化セッション", () => {
  it("暗号化して復号できる（中身は平文で見えない）", async () => {
    const sealed = await sealSession(data, config);
    expect(sealed).not.toContain("ya29");
    expect(Buffer.from(sealed.split(".")[3] ?? "", "base64url").toString()).not.toContain("ya29");
    expect(await unsealSession(sealed, config, NOW)).toEqual({
      ...data,
      expiresAt: Math.floor(data.expiresAt / 1000) * 1000,
    });
  });

  it("改ざんされた Cookie は拒否する", async () => {
    const sealed = await sealSession(data, config);
    const parts = sealed.split(".");
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith("A") ? "BB" : "AA");
    expect(await unsealSession(parts.join("."), config, NOW)).toBeNull();
  });

  it("期限切れは拒否する", async () => {
    const sealed = await sealSession({ ...data, expiresAt: NOW + 1000 }, config);
    expect(await unsealSession(sealed, config, NOW + 5000)).toBeNull();
  });

  it("別の鍵では復号できない", async () => {
    const sealed = await sealSession(data, config);
    const other = testConfig({ SESSION_SECRET: Buffer.alloc(32, 9).toString("base64") });
    expect(await unsealSession(sealed, other, NOW)).toBeNull();
  });

  it("鍵のローテーション: 旧鍵で作ったセッションも SESSION_SECRET_PREVIOUS で読める", async () => {
    const sealed = await sealSession(data, config);
    const rotated = testConfig({
      SESSION_SECRET: Buffer.alloc(32, 9).toString("base64"),
      SESSION_SECRET_PREVIOUS: TEST_ENV.SESSION_SECRET,
    });
    expect((await unsealSession(sealed, rotated, NOW))?.accessToken).toBe(data.accessToken);
  });

  it("OAuth 一時データをセッションとして使い回せない（用途の取り違え防止）", async () => {
    const pending = await sealOAuthPending({ state: "s", codeVerifier: "v" }, config);
    expect(await unsealSession(pending, config)).toBeNull();
    expect(await unsealOAuthPending(pending, config)).toEqual({ state: "s", codeVerifier: "v" });
    expect(await unsealOAuthPending(await sealSession(data, config), config)).toBeNull();
  });

  it("空・不正な値は null", async () => {
    expect(await unsealSession(undefined, config)).toBeNull();
    expect(await unsealSession("garbage", config)).toBeNull();
  });

  it("Cookie 属性: HttpOnly・SameSite=Lax、HTTPS では Secure と __Host- 接頭辞", () => {
    expect(cookieOptions(config, 60)).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: false });
    expect(cookieNames(config).session).toBe("kyre_session");
    const https = testConfig({
      APP_ORIGIN: "https://schedule.example.com",
      GOOGLE_REDIRECT_URI: "https://schedule.example.com/api/auth/google/callback",
    });
    expect(cookieOptions(https, 60).secure).toBe(true);
    expect(cookieNames(https)).toEqual({ session: "__Host-kyre_session", oauth: "__Host-kyre_oauth" });
  });
});
