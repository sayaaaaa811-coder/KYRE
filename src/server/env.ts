import "server-only";
import { z } from "zod";
import { logEvent } from "./logger";

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const base64Key = z.string().refine((v) => Buffer.from(v, "base64").length === 32, {
  message: "must be 32 bytes encoded in base64",
});

const schema = z
  .object({
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.url(),
    SESSION_SECRET: base64Key,
    SESSION_SECRET_PREVIOUS: base64Key.optional(),
    APP_ORIGIN: z.url(),
    /** E2E テスト用の偽 Google サーバー。ローカル（http://localhost）でのみ有効 */
    GOOGLE_ENDPOINT_OVERRIDE: z.url().optional(),
  })
  .refine((e) => new URL(e.APP_ORIGIN).origin === e.APP_ORIGIN.replace(/\/$/, ""), {
    message: "APP_ORIGIN must be an origin",
  })
  .refine((e) => e.GOOGLE_REDIRECT_URI.startsWith(`${e.APP_ORIGIN.replace(/\/$/, "")}/`), {
    message: "GOOGLE_REDIRECT_URI must be under APP_ORIGIN",
  })
  .refine((e) => e.APP_ORIGIN.startsWith("https://") || LOCAL_ORIGIN.test(e.APP_ORIGIN.replace(/\/$/, "")), {
    message: "APP_ORIGIN must be https (except localhost)",
  })
  .refine((e) => !e.GOOGLE_ENDPOINT_OVERRIDE || LOCAL_ORIGIN.test(e.APP_ORIGIN.replace(/\/$/, "")), {
    message: "GOOGLE_ENDPOINT_OVERRIDE is only allowed on localhost",
  });

export interface ServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  appOrigin: string;
  sessionKeys: Uint8Array[];
  secureCookies: boolean;
  endpoints: {
    authorize: string;
    token: string;
    revoke: string;
    freeBusy: string;
  };
}

const KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "SESSION_SECRET",
  "SESSION_SECRET_PREVIOUS",
  "APP_ORIGIN",
  "GOOGLE_ENDPOINT_OVERRIDE",
] as const;

let cached: { signature: string; config: ServerConfig | null } | null = null;

/**
 * 環境変数を検証して設定を返す。Google 連携の設定が無い・不正な場合は null（デモのみ利用可能）。
 * 値そのものはログに出さない。
 */
export function getServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig | null {
  const signature = JSON.stringify(KEYS.map((k) => env[k] ?? null));
  if (cached && cached.signature === signature) return cached.config;
  const config = buildConfig(env);
  cached = { signature, config };
  return config;
}

function buildConfig(env: Record<string, string | undefined>): ServerConfig | null {
  if (!env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) return null;
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    logEvent("config_invalid", { fields: parsed.error.issues.map((i) => i.path.join(".") || "root").join(",") });
    return null;
  }
  const e = parsed.data;
  const google = e.GOOGLE_ENDPOINT_OVERRIDE?.replace(/\/$/, "");
  return {
    clientId: e.GOOGLE_CLIENT_ID,
    clientSecret: e.GOOGLE_CLIENT_SECRET,
    redirectUri: e.GOOGLE_REDIRECT_URI,
    appOrigin: e.APP_ORIGIN.replace(/\/$/, ""),
    sessionKeys: [e.SESSION_SECRET, e.SESSION_SECRET_PREVIOUS]
      .filter((k): k is string => !!k)
      .map((k) => new Uint8Array(Buffer.from(k, "base64"))),
    secureCookies: e.APP_ORIGIN.startsWith("https://"),
    endpoints: {
      authorize: google ? `${google}/o/oauth2/v2/auth` : "https://accounts.google.com/o/oauth2/v2/auth",
      token: google ? `${google}/token` : "https://oauth2.googleapis.com/token",
      revoke: google ? `${google}/revoke` : "https://oauth2.googleapis.com/revoke",
      freeBusy: google ? `${google}/calendar/v3/freeBusy` : "https://www.googleapis.com/calendar/v3/freeBusy",
    },
  };
}
