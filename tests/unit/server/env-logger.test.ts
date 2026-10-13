import { describe, expect, it } from "vitest";
import { getServerConfig } from "@/server/env";
import { sanitizeLogFields } from "@/server/logger";
import { TEST_ENV } from "./helpers";

describe("環境変数の検証", () => {
  it("Google 設定がなければ null（デモのみ）", () => {
    expect(getServerConfig({})).toBeNull();
  });

  it("正しい設定", () => {
    const c = getServerConfig({ ...TEST_ENV });
    expect(c?.endpoints.token).toBe("https://oauth2.googleapis.com/token");
    expect(c?.secureCookies).toBe(false);
  });

  it.each([
    ["鍵が 32 バイトでない", { SESSION_SECRET: Buffer.alloc(16).toString("base64") }],
    ["鍵がない", { SESSION_SECRET: undefined }],
    ["リダイレクト先が別オリジン", { GOOGLE_REDIRECT_URI: "https://evil.example/callback" }],
    [
      "本番で http",
      { APP_ORIGIN: "http://schedule.example.com", GOOGLE_REDIRECT_URI: "http://schedule.example.com/api/cb" },
    ],
    [
      "本番で偽 Google を指定",
      {
        APP_ORIGIN: "https://schedule.example.com",
        GOOGLE_REDIRECT_URI: "https://schedule.example.com/api/auth/google/callback",
        GOOGLE_ENDPOINT_OVERRIDE: "http://localhost:3199",
      },
    ],
  ])("%s → null", (_n, overrides) => {
    expect(getServerConfig({ ...TEST_ENV, ...overrides })).toBeNull();
  });

  it("ローカルでは偽 Google（E2E 用）を指定できる", () => {
    const c = getServerConfig({ ...TEST_ENV, GOOGLE_ENDPOINT_OVERRIDE: "http://localhost:3199" });
    expect(c?.endpoints.freeBusy).toBe("http://localhost:3199/calendar/v3/freeBusy");
  });
});

describe("ログの許可リスト", () => {
  it("許可されていないキー（本文・トークン等）は出力しない", () => {
    expect(
      sanitizeLogFields({
        route: "freebusy",
        status: 200,
        text: "10/20 19時どう？",
        accessToken: "ya29.xxx",
        busy: "2026-10-20",
        code: "FETCH_FAILED",
      }),
    ).toEqual({ route: "freebusy", status: 200, code: "FETCH_FAILED" });
  });

  it("許可キーでも日本語・長文などは伏せる", () => {
    expect(sanitizeLogFields({ reason: "明日の夜" })).toEqual({ reason: "[redacted]" });
    expect(sanitizeLogFields({ reason: "x".repeat(200) })).toEqual({ reason: "[redacted]" });
  });
});
