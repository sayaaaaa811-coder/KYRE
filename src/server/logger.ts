import "server-only";

/**
 * 許可リスト方式のロガー。
 * メッセージ本文・予定・トークン等が誤って記録されないよう、ここに列挙したキーだけを出力する。
 * 値は数値・真偽値か、英数字と一部記号だけの短い文字列に限る。
 */
const ALLOWED_KEYS = new Set([
  "route",
  "status",
  "code",
  "durationMs",
  "rangeCount",
  "groupCount",
  "googleStatus",
  "googleReason",
  "fields",
  "reason",
]);

const SAFE_STRING = /^[A-Za-z0-9_.,:\-/]{0,80}$/;

export type LogFields = Record<string, string | number | boolean | undefined>;

export function sanitizeLogFields(fields: LogFields): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_KEYS.has(key) || value === undefined) continue;
    if (typeof value === "string") out[key] = SAFE_STRING.test(value) ? value : "[redacted]";
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function logEvent(event: string, fields: LogFields = {}): void {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ t: new Date().toISOString(), event, ...sanitizeLogFields(fields) });
  process.stdout.write(`${line}\n`);
}
