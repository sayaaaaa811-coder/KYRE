import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as callback } from "@/app/api/auth/google/callback/route";
import { POST as disconnect } from "@/app/api/auth/disconnect/route";
import { GET as start } from "@/app/api/auth/google/start/route";
import { POST as freebusy } from "@/app/api/freebusy/route";
import { GET as session } from "@/app/api/session/route";
import { FREEBUSY_SCOPE } from "@/server/oauth";
import { resetRateLimits } from "@/server/rate-limit";
import { sealOAuthPending, sealSession } from "@/server/session";
import { TEST_ENV, jsonResponse, testConfig } from "./helpers";

const ORIGIN = TEST_ENV.APP_ORIGIN;
const config = testConfig();
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  resetRateLimits();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of Object.keys(TEST_ENV)) delete process.env[k];
});

function req(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string; cookie?: string } = {},
) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(new URL(path, ORIGIN), { method: init.method ?? "GET", headers, body: init.body });
}

const setCookies = (res: Response) => res.headers.getSetCookie();
const cookieValue = (res: Response, name: string) =>
  setCookies(res)
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0]
    .slice(name.length + 1);

async function sessionCookie(expiresAt = Date.now() + 3600_000) {
  return `kyre_session=${await sealSession({ accessToken: "AT", expiresAt, sessionId: "sid" }, config)}`;
}

describe("GET /api/auth/google/start", () => {
  it("state・PKCE を一時 Cookie に保存して Google へリダイレクト", async () => {
    const res = await start(req("/api/auth/google/start"));
    expect(res.status).toBe(303);
    const location = new URL(res.headers.get("location")!);
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const oauthCookie = setCookies(res).find((c) => c.startsWith("kyre_oauth="))!;
    expect(oauthCookie).toMatch(/HttpOnly/i);
    expect(oauthCookie).toMatch(/SameSite=lax/i);
    expect(oauthCookie).not.toContain(location.searchParams.get("state")!);
  });

  it("設定がなければ 503", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect((await start(req("/api/auth/google/start"))).status).toBe(503);
  });
});

describe("GET /api/auth/google/callback", () => {
  async function pendingCookie(state = "STATE") {
    return `kyre_oauth=${await sealOAuthPending({ state, codeVerifier: "VERIFIER" }, config)}`;
  }

  const tokenOk = (scope = FREEBUSY_SCOPE) =>
    jsonResponse({ access_token: "AT", expires_in: 3599, scope, token_type: "Bearer" });

  it("成功: セッション Cookie を設定し、トップへ戻す（トークンは URL・本文に出ない）", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk());
    const res = await callback(
      req("/api/auth/google/callback?code=CODE&state=STATE", { cookie: await pendingCookie() }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?restore=1`);
    const sessionSet = setCookies(res).find((c) => c.startsWith("kyre_session="))!;
    expect(sessionSet).toMatch(/HttpOnly/i);
    expect(sessionSet).not.toContain("AT;");
    expect(cookieValue(res, "kyre_oauth")).toBe("");
    const body = new URLSearchParams(String(fetchMock.mock.calls[0][1].body));
    expect(body.get("code_verifier")).toBe("VERIFIER");
  });

  it("state が一致しなければ拒否（トークン交換しない）", async () => {
    const res = await callback(
      req("/api/auth/google/callback?code=CODE&state=WRONG", { cookie: await pendingCookie() }),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?auth_error=state`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("一時 Cookie がなければ拒否（CSRF・再利用対策）", async () => {
    const res = await callback(req("/api/auth/google/callback?code=CODE&state=STATE"));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?auth_error=state`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ユーザーが拒否した場合", async () => {
    const res = await callback(
      req("/api/auth/google/callback?error=access_denied&state=STATE", { cookie: await pendingCookie() }),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?auth_error=denied`);
  });

  it("カレンダー権限が外されていたらトークンを失効させて scope エラー", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk("openid")).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await callback(
      req("/api/auth/google/callback?code=CODE&state=STATE", { cookie: await pendingCookie() }),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?auth_error=scope`);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/revoke");
    expect(cookieValue(res, "kyre_session")).toBeUndefined();
  });

  it("トークン交換の失敗", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid_grant" }, 400));
    const res = await callback(
      req("/api/auth/google/callback?code=CODE&state=STATE", { cookie: await pendingCookie() }),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/?auth_error=failed`);
  });
});

describe("POST /api/freebusy", () => {
  const now = Date.now();
  const range = { start: now + 3600_000, end: now + 20 * 3600_000 };
  const trusted = { origin: ORIGIN, "x-kyre-request": "1", "content-type": "application/json" };

  it("成功: busy の時刻だけを返す", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        calendars: {
          primary: {
            busy: [{ start: new Date(range.start).toISOString(), end: new Date(range.start + 3600_000).toISOString() }],
          },
        },
      }),
    );
    const res = await freebusy(
      req("/api/freebusy", {
        method: "POST",
        headers: trusted,
        cookie: await sessionCookie(),
        body: JSON.stringify({ ranges: [range] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      busy: [{ start: range.start, end: range.start + 3600_000 }],
      coveredRanges: [range],
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    ["Origin なし", { "x-kyre-request": "1", "content-type": "application/json" }],
    ["別サイトの Origin", { ...trusted, origin: "https://evil.example" }],
    ["独自ヘッダーなし", { origin: ORIGIN, "content-type": "application/json" }],
    ["JSON 以外", { ...trusted, "content-type": "text/plain" }],
  ])("%s → 403（CSRF 対策）", async (_n, headers) => {
    const res = await freebusy(
      req("/api/freebusy", {
        method: "POST",
        headers,
        cookie: await sessionCookie(),
        body: JSON.stringify({ ranges: [range] }),
      }),
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("未連携 → 401", async () => {
    const res = await freebusy(
      req("/api/freebusy", { method: "POST", headers: trusted, body: JSON.stringify({ ranges: [range] }) }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ status: "error", code: "UNAUTHENTICATED" });
  });

  it("期限切れのセッション → 401 と Cookie 削除", async () => {
    const res = await freebusy(
      req("/api/freebusy", {
        method: "POST",
        headers: trusted,
        cookie: await sessionCookie(Date.now() - 1000),
        body: JSON.stringify({ ranges: [range] }),
      }),
    );
    expect(res.status).toBe(401);
    expect(cookieValue(res, "kyre_session")).toBe("");
  });

  it("不正な本文 → 400", async () => {
    const res = await freebusy(
      req("/api/freebusy", { method: "POST", headers: trusted, cookie: await sessionCookie(), body: "{}" }),
    );
    expect(res.status).toBe(400);
  });

  it("Google が 401 → 401 と Cookie 削除", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));
    const res = await freebusy(
      req("/api/freebusy", {
        method: "POST",
        headers: trusted,
        cookie: await sessionCookie(),
        body: JSON.stringify({ ranges: [range] }),
      }),
    );
    expect(res.status).toBe(401);
    expect(cookieValue(res, "kyre_session")).toBe("");
  });

  it("Google 障害 → 502（空きとは返さない）", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503));
    const res = await freebusy(
      req("/api/freebusy", {
        method: "POST",
        headers: trusted,
        cookie: await sessionCookie(),
        body: JSON.stringify({ ranges: [range] }),
      }),
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ status: "error", code: "FETCH_FAILED" });
  });

  it("レート制限 → 429", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ calendars: { primary: { busy: [] } } }));
    const cookie = await sessionCookie();
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await freebusy(
        req("/api/freebusy", { method: "POST", headers: trusted, cookie, body: JSON.stringify({ ranges: [range] }) }),
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

describe("/api/session と /api/auth/disconnect", () => {
  it("連携状態だけを返す（トークンは返さない）", async () => {
    const res = await session(req("/api/session", { cookie: await sessionCookie() }));
    const body = await res.json();
    expect(body).toMatchObject({ configured: true, connected: true });
    expect(JSON.stringify(body)).not.toContain("AT");
  });

  it("未設定なら configured: false", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(await (await session(req("/api/session"))).json()).toEqual({ configured: false, connected: false });
  });

  it("連携解除: Google でトークンを失効させ、Cookie を削除", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await disconnect(
      req("/api/auth/disconnect", {
        method: "POST",
        headers: { origin: ORIGIN, "x-kyre-request": "1" },
        cookie: await sessionCookie(),
      }),
    );
    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://oauth2.googleapis.com/revoke");
    expect(new URLSearchParams(String(fetchMock.mock.calls[0][1].body)).get("token")).toBe("AT");
    expect(cookieValue(res, "kyre_session")).toBe("");
  });

  it("連携解除も CSRF 対策（Origin 不一致は 403）", async () => {
    const res = await disconnect(
      req("/api/auth/disconnect", {
        method: "POST",
        headers: { origin: "https://evil.example", "x-kyre-request": "1" },
        cookie: await sessionCookie(),
      }),
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
