import { describe, expect, it } from "vitest";
import {
  addDays,
  dayRange,
  epochToZoned,
  formatDateJa,
  isValidIsoDate,
  isValidTimeOfDay,
  todayIn,
  zonedToEpoch,
} from "@/lib/time";

const TZ = "Asia/Tokyo";

describe("time", () => {
  it("Asia/Tokyo の暦日時刻を絶対時刻に変換する（UTC+9）", () => {
    expect(zonedToEpoch("2026-10-20", "19:00", TZ)).toBe(Date.parse("2026-10-20T10:00:00Z"));
  });

  it("絶対時刻から Asia/Tokyo の暦日に戻す（UTC では前日でも JST の日付）", () => {
    expect(epochToZoned(Date.parse("2026-10-19T15:30:00Z"), TZ)).toEqual({ date: "2026-10-20", time: "00:30" });
    expect(todayIn(Date.parse("2026-12-31T15:00:00Z"), TZ)).toBe("2027-01-01");
  });

  it("日付の加算（月末・年末・うるう年）", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("1 日の範囲は 24 時間", () => {
    const r = dayRange("2026-10-20", TZ);
    expect(r.end - r.start).toBe(24 * 3600_000);
  });

  it("日本語の日付表記", () => {
    expect(formatDateJa("2026-10-20")).toBe("10/20(火)");
    expect(formatDateJa("2026-10-25")).toBe("10/25(日)");
  });

  it("入力の検証", () => {
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
    expect(isValidTimeOfDay("24:00")).toBe(false);
    expect(isValidTimeOfDay("23:59")).toBe(true);
    expect(isValidTimeOfDay("7:00")).toBe(false);
  });
});
