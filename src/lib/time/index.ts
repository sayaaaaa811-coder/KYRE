import { TZDate } from "@date-fns/tz";
import type { Interval, IsoDate, TimeOfDay } from "@/lib/types";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const MINUTE_MS = 60_000;

export function parseIsoDate(date: IsoDate): { year: number; month: number; day: number } {
  const m = ISO_DATE_RE.exec(date);
  if (!m) throw new Error("Invalid date format");
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error("Invalid calendar date");
  }
  return { year, month, day };
}

export function isValidIsoDate(date: string): boolean {
  try {
    parseIsoDate(date);
    return true;
  } catch {
    return false;
  }
}

export function parseTimeOfDay(time: TimeOfDay): { hour: number; minute: number } {
  const m = TIME_RE.exec(time);
  if (!m) throw new Error("Invalid time format");
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) throw new Error("Invalid time");
  return { hour, minute };
}

export function isValidTimeOfDay(time: string): boolean {
  try {
    parseTimeOfDay(time);
    return true;
  } catch {
    return false;
  }
}

/** 指定タイムゾーンにおける暦日・時刻を絶対時刻に変換する */
export function zonedToEpoch(date: IsoDate, time: TimeOfDay, timeZone: string): number {
  const { year, month, day } = parseIsoDate(date);
  const { hour, minute } = parseTimeOfDay(time);
  return new TZDate(year, month - 1, day, hour, minute, timeZone).getTime();
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const { year, month, day } = parseIsoDate(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** その日の 0:00 から翌日 0:00 まで（指定タイムゾーン） */
export function dayRange(date: IsoDate, timeZone: string): Interval {
  return {
    start: zonedToEpoch(date, "00:00", timeZone),
    end: zonedToEpoch(addDays(date, 1), "00:00", timeZone),
  };
}

export function epochToZoned(ms: number, timeZone: string): { date: IsoDate; time: TimeOfDay } {
  const z = new TZDate(ms, timeZone);
  return {
    date: toIsoDate(z.getFullYear(), z.getMonth() + 1, z.getDate()),
    time: `${pad2(z.getHours())}:${pad2(z.getMinutes())}`,
  };
}

export function todayIn(nowMs: number, timeZone: string): IsoDate {
  return epochToZoned(nowMs, timeZone).date;
}

export function weekdayJa(date: IsoDate): string {
  const { year, month, day } = parseIsoDate(date);
  return WEEKDAYS_JA[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** 例: "10/20(火)" */
export function formatDateJa(date: IsoDate): string {
  const { month, day } = parseIsoDate(date);
  return `${month}/${day}(${weekdayJa(date)})`;
}

/** 例: "19:00" */
export function formatTime(ms: number, timeZone: string): TimeOfDay {
  return epochToZoned(ms, timeZone).time;
}

function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
