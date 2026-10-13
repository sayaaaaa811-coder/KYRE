import { isValidIsoDate, isValidTimeOfDay } from "@/lib/time";
import {
  BUFFER_OPTIONS,
  DEFAULT_SETTINGS,
  DURATION_OPTIONS,
  isValidActiveHours,
  type Candidate,
  type IsoDate,
  type Settings,
} from "@/lib/types";

export interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
}

export async function fetchConnectionStatus(): Promise<ConnectionStatus> {
  try {
    const res = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
    const body = (await res.json()) as Partial<ConnectionStatus>;
    return { configured: body.configured === true, connected: body.connected === true };
  } catch {
    return { configured: false, connected: false };
  }
}

export async function disconnectGoogle(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/disconnect", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-KYRE-Request": "1" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Google 連携でページを離れる間だけ、候補と設定を sessionStorage に一時保存する。
 * メッセージ本文は保存しない。戻ってきたら読み込んで即削除する（30 分で無効）。
 */
const PENDING_KEY = "kyre:pending";
const PENDING_TTL_MS = 30 * 60 * 1000;

export interface PendingState {
  referenceDate: IsoDate;
  candidates: Candidate[];
  settings: Settings;
}

export function savePending(state: PendingState, now = Date.now()): void {
  try {
    const candidates = state.candidates.map(({ id, date, startTime }) => ({ id, date, startTime }));
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ savedAt: now, referenceDate: state.referenceDate, candidates, settings: state.settings }),
    );
  } catch {
    // 保存できない環境（プライベートモード等）では復元をあきらめる
  }
}

export function takePending(now = Date.now()): PendingState | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return parsePending(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

/** 保存データを検証して復元する（不正な値は捨てる） */
export function parsePending(value: unknown, now: number): PendingState | null {
  const v = value as Record<string, unknown>;
  if (typeof v?.savedAt !== "number" || now - v.savedAt > PENDING_TTL_MS || now < v.savedAt) return null;
  if (typeof v.referenceDate !== "string" || !isValidIsoDate(v.referenceDate)) return null;
  if (!Array.isArray(v.candidates) || v.candidates.length > 10) return null;
  const candidates: Candidate[] = [];
  for (const c of v.candidates as Record<string, unknown>[]) {
    if (typeof c?.id !== "string" || !/^c\d{1,6}$/.test(c.id)) return null;
    if (typeof c.date !== "string" || !isValidIsoDate(c.date)) return null;
    if (typeof c.startTime !== "string" || !isValidTimeOfDay(c.startTime)) return null;
    candidates.push({ id: c.id, date: c.date, startTime: c.startTime, ambiguities: [] });
  }
  const s = (v.settings ?? {}) as Partial<Settings>;
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    durationMinutes: DURATION_OPTIONS.find((d) => d === s.durationMinutes) ?? DEFAULT_SETTINGS.durationMinutes,
    bufferMinutes: BUFFER_OPTIONS.find((b) => b === s.bufferMinutes) ?? DEFAULT_SETTINGS.bufferMinutes,
    activeHours:
      s.activeHours && isValidActiveHours(s.activeHours)
        ? { startHour: s.activeHours.startHour, endHour: s.activeHours.endHour }
        : DEFAULT_SETTINGS.activeHours,
  };
  return { referenceDate: v.referenceDate, candidates, settings };
}
