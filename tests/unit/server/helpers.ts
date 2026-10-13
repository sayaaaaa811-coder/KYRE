import { getServerConfig } from "@/server/env";

export const TEST_ENV = {
  GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
  SESSION_SECRET: Buffer.alloc(32, 7).toString("base64"),
  APP_ORIGIN: "http://localhost:3000",
};

export function testConfig(overrides: Record<string, string | undefined> = {}) {
  const config = getServerConfig({ ...TEST_ENV, ...overrides });
  if (!config) throw new Error("invalid test config");
  return config;
}

/** fetch の呼び出しを記録し、順に応答を返す偽物 */
export function fakeFetch(...responses: (Response | Error)[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { impl, calls };
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
