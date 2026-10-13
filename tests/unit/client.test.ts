import { describe, expect, it } from "vitest";
import { createGoogleCalendar } from "@/lib/calendar/google";
import { parsePending } from "@/lib/session-client";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("Google カレンダー（ブラウザ側）", () => {
  const range = { start: 1000, end: 2000 };

  it("正常な応答を受け取る・独自ヘッダーを付ける", async () => {
    let headers: HeadersInit | undefined;
    const cal = createGoogleCalendar(async (_u, init) => {
      headers = init?.headers;
      return json({ status: "ok", busy: [{ start: 1100, end: 1200 }], coveredRanges: [range] });
    });
    expect(await cal.fetchBusy([range])).toEqual({
      status: "ok",
      busy: [{ start: 1100, end: 1200 }],
      coveredRanges: [range],
    });
    expect(headers).toMatchObject({ "X-KYRE-Request": "1" });
  });

  it.each([
    ["形式不正の ok 応答", json({ status: "ok", busy: "x", coveredRanges: [] }), "FETCH_FAILED"],
    ["401", json({ status: "error", code: "UNAUTHENTICATED" }, 401), "UNAUTHENTICATED"],
    ["未知のコード", json({ status: "error", code: "WHAT" }, 500), "FETCH_FAILED"],
    ["HTML", new Response("<html>", { status: 502 }), "FETCH_FAILED"],
  ])("%s → %s", async (_n, response, code) => {
    const cal = createGoogleCalendar(async () => response as Response);
    expect(await cal.fetchBusy([range])).toEqual({ status: "error", code });
  });

  it("通信失敗 → NETWORK", async () => {
    const cal = createGoogleCalendar(async () => {
      throw new TypeError("offline");
    });
    expect(await cal.fetchBusy([range])).toEqual({ status: "error", code: "NETWORK" });
  });
});

describe("OAuth 往復時の一時保存の検証", () => {
  const now = 1_000_000_000;
  const valid = {
    savedAt: now - 1000,
    referenceDate: "2026-10-13",
    candidates: [{ id: "c1", date: "2026-10-20", startTime: "19:00" }],
    settings: { durationMinutes: 120, bufferMinutes: 30, activeHours: { startHour: 18, endHour: 24 } },
  };

  it("正しいデータを復元する（要確認は確定済みとして復元）", () => {
    expect(parsePending(valid, now)).toEqual({
      referenceDate: "2026-10-13",
      candidates: [{ id: "c1", date: "2026-10-20", startTime: "19:00", ambiguities: [] }],
      settings: {
        durationMinutes: 120,
        bufferMinutes: 30,
        activeHours: { startHour: 18, endHour: 24 },
        timeZone: "Asia/Tokyo",
      },
    });
  });

  it.each([
    ["30 分以上前", { ...valid, savedAt: now - 31 * 60_000 }],
    ["不正な日付", { ...valid, candidates: [{ id: "c1", date: "2026-02-30", startTime: "19:00" }] }],
    ["不正な ID", { ...valid, candidates: [{ id: "<img>", date: "2026-10-20", startTime: "19:00" }] }],
    ["候補が多すぎる", { ...valid, candidates: Array.from({ length: 11 }, () => valid.candidates[0]) }],
    ["null", null],
  ])("%s は捨てる", (_n, value) => {
    expect(parsePending(value, now)).toBeNull();
  });

  it("不正な設定値は初期値に戻す", () => {
    const r = parsePending(
      { ...valid, settings: { durationMinutes: 999, bufferMinutes: -1, activeHours: { startHour: 5, endHour: 2 } } },
      now,
    );
    expect(r?.settings).toMatchObject({
      durationMinutes: 90,
      bufferMinutes: 15,
      activeHours: { startHour: 0, endHour: 24 },
    });
  });
});
