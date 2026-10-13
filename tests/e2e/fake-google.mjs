/**
 * E2E テスト用の偽 Google サーバー（OAuth 同意画面・トークン・失効・FreeBusy）。
 * 本物と同じ手順（state・PKCE・client_secret・redirect_uri の検証）を再現する。
 * 起動: node tests/e2e/fake-google.mjs  （ポート 3199）
 */
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_GOOGLE_PORT ?? 3199);
const CLIENT_ID = "e2e-client";
const CLIENT_SECRET = "e2e-secret";
const SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

/** code → { challenge, redirectUri, scope, mode } */
const codes = new Map();
/** access token → { mode, revoked } */
const tokens = new Map();

const rand = () => randomBytes(16).toString("hex");

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

/** JST の偶数日 18:30〜20:00 を予定ありにする */
function busyBetween(timeMin, timeMax) {
  const busy = [];
  for (let t = Date.parse(timeMin) - 24 * 3600_000; t < Date.parse(timeMax); t += 24 * 3600_000) {
    const jst = new Date(t + 9 * 3600_000);
    const y = jst.getUTCFullYear();
    const m = jst.getUTCMonth();
    const d = jst.getUTCDate();
    if (d % 2 !== 0) continue;
    const start = Date.UTC(y, m, d, 18, 30) - 9 * 3600_000;
    const end = Date.UTC(y, m, d, 20, 0) - 9 * 3600_000;
    if (end > Date.parse(timeMin) && start < Date.parse(timeMax)) {
      busy.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString() });
    }
  }
  return busy;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // 同意画面: テストはリンクをクリックして結果を選ぶ
  if (req.method === "GET" && url.pathname === "/o/oauth2/v2/auth") {
    const p = url.searchParams;
    if (
      p.get("client_id") !== CLIENT_ID ||
      p.get("response_type") !== "code" ||
      p.get("code_challenge_method") !== "S256" ||
      !p.get("code_challenge") ||
      !p.get("state") ||
      p.get("scope") !== SCOPE
    ) {
      return send(res, 400, "invalid authorization request", "text/plain");
    }
    const redirect = (params) => {
      const u = new URL(p.get("redirect_uri"));
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
      return u.toString();
    };
    const issue = (mode, scope) => {
      const code = rand();
      codes.set(code, { challenge: p.get("code_challenge"), redirectUri: p.get("redirect_uri"), scope, mode });
      return redirect({ code, state: p.get("state"), scope });
    };
    const links = [
      ["許可する", issue("normal", SCOPE)],
      ["許可する（予定取得が失敗するアカウント）", issue("broken", SCOPE)],
      ["カレンダーのチェックを外して許可", issue("normal", "openid")],
      ["キャンセル", redirect({ error: "access_denied", state: p.get("state") })],
      ["state を改ざん", redirect({ code: issue("normal", SCOPE).match(/code=([^&]+)/)[1], state: "tampered" })],
    ];
    return send(
      res,
      200,
      `<!doctype html><meta charset="utf-8"><title>Fake Google</title><h1>Fake Google 同意画面</h1>${links
        .map(([label, href]) => `<p><a href="${href.replace(/&/g, "&amp;")}">${label}</a></p>`)
        .join("")}`,
      "text/html; charset=utf-8",
    );
  }

  if (req.method === "POST" && url.pathname === "/token") {
    const p = new URLSearchParams(await readBody(req));
    const entry = codes.get(p.get("code"));
    codes.delete(p.get("code"));
    const challenge = createHash("sha256")
      .update(p.get("code_verifier") ?? "")
      .digest("base64url");
    if (
      !entry ||
      p.get("client_id") !== CLIENT_ID ||
      p.get("client_secret") !== CLIENT_SECRET ||
      p.get("grant_type") !== "authorization_code" ||
      p.get("redirect_uri") !== entry.redirectUri ||
      challenge !== entry.challenge
    ) {
      return send(res, 400, { error: "invalid_grant" });
    }
    const accessToken = `fake-at-${rand()}`;
    tokens.set(accessToken, { mode: entry.mode, revoked: false });
    return send(res, 200, { access_token: accessToken, expires_in: 3599, scope: entry.scope, token_type: "Bearer" });
  }

  if (req.method === "POST" && url.pathname === "/revoke") {
    const p = new URLSearchParams(await readBody(req));
    const t = tokens.get(p.get("token"));
    if (t) t.revoked = true;
    return send(res, t ? 200 : 400, {});
  }

  if (req.method === "POST" && url.pathname === "/calendar/v3/freeBusy") {
    const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    const t = tokens.get(token);
    if (!t || t.revoked) return send(res, 401, { error: { errors: [{ reason: "authError" }] } });
    if (t.mode === "broken") return send(res, 500, { error: { errors: [{ reason: "backendError" }] } });
    const body = JSON.parse(await readBody(req));
    return send(res, 200, { calendars: { primary: { busy: busyBetween(body.timeMin, body.timeMax) } } });
  }

  if (req.method === "GET" && url.pathname === "/__health") return send(res, 200, { ok: true });
  if (req.method === "GET" && url.pathname === "/__revoked") {
    return send(res, 200, { count: [...tokens.values()].filter((t) => t.revoked).length });
  }
  send(res, 404, { error: "not_found" });
});

server.listen(PORT, () => process.stdout.write(`fake google listening on ${PORT}\n`));
