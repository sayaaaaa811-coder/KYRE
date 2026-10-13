import { describe, expect, it } from "vitest";
import { parseFreeBusyRequest } from "@/server/freebusy-request";
import { fetchFreeBusy, groupRanges, mapGoogleError } from "@/server/google-freebusy";
import { fakeFetch, jsonResponse, testConfig } from "./helpers";

const config = testConfig();
const DAY = 24 * 3600_000;
const R1 = { start: Date.parse("2026-10-19T15:00:00Z"), end: Date.parse("2026-10-20T15:00:00Z") };
const R2 = { start: R1.start + DAY, end: R1.end + DAY };
const FAR = { start: R1.start + 60 * DAY, end: R1.end + 60 * DAY };

describe("groupRanges", () => {
  it("31 日以内はまとめ、離れた範囲は分ける", () => {
    expect(groupRanges([FAR, R2, R1])).toEqual([[R1, R2], [FAR]]);
  });
});

describe("fetchFreeBusy", () => {
  it("成功: busy をエポックミリ秒にし、取得範囲を返す", async () => {
    const f = fakeFetch(
      jsonResponse({
        calendars: { primary: { busy: [{ start: "2026-10-20T09:30:00Z", end: "2026-10-20T11:00:00Z" }] } },
      }),
    );
    const r = await fetchFreeBusy(config, "AT", [R1, R2], "Asia/Tokyo", f.impl);
    expect(r).toEqual({
      status: "ok",
      busy: [{ start: Date.parse("2026-10-20T09:30:00Z"), end: Date.parse("2026-10-20T11:00:00Z") }],
      coveredRanges: [R1, R2],
    });
    expect(f.calls).toHaveLength(1);
    const req = JSON.parse(String(f.calls[0].init?.body));
    expect(req).toEqual({
      timeMin: new Date(R1.start).toISOString(),
      timeMax: new Date(R2.end).toISOString(),
      timeZone: "Asia/Tokyo",
      items: [{ id: "primary" }],
    });
    expect((f.calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer AT");
  });

  it("予定なし（busy が空配列）は ok", async () => {
    const f = fakeFetch(jsonResponse({ calendars: { primary: { busy: [] } } }));
    expect((await fetchFreeBusy(config, "AT", [R1], "Asia/Tokyo", f.impl)).status).toBe("ok");
  });

  it.each([
    ["カレンダーのエラー", jsonResponse({ calendars: { primary: { errors: [{ reason: "notFound" }] } } })],
    ["busy がない", jsonResponse({ calendars: { primary: {} } })],
    ["calendars がない", jsonResponse({})],
    [
      "不正な区間",
      jsonResponse({
        calendars: { primary: { busy: [{ start: "2026-10-20T11:00:00Z", end: "2026-10-20T09:00:00Z" }] } },
      }),
    ],
    ["日時形式不正", jsonResponse({ calendars: { primary: { busy: [{ start: "tomorrow", end: "later" }] } } })],
    ["JSON でない", new Response("<html>", { status: 200 })],
    ["サーバーエラー", jsonResponse({}, 500)],
    ["通信失敗", new Error("timeout")],
  ])("%s → FETCH_FAILED（空きと判定させない）", async (_n, response) => {
    const f = fakeFetch(response);
    expect(await fetchFreeBusy(config, "AT", [R1], "Asia/Tokyo", f.impl)).toEqual({
      status: "error",
      code: "FETCH_FAILED",
    });
  });

  it("複数グループの一部が失敗したら全体を失敗にする", async () => {
    const f = fakeFetch(jsonResponse({ calendars: { primary: { busy: [] } } }), jsonResponse({}, 500));
    expect((await fetchFreeBusy(config, "AT", [R1, FAR], "Asia/Tokyo", f.impl)).status).toBe("error");
  });

  it("Google のエラーを分類する", () => {
    expect(mapGoogleError(401, undefined)).toBe("UNAUTHENTICATED");
    expect(mapGoogleError(403, "insufficientPermissions")).toBe("PERMISSION_DENIED");
    expect(mapGoogleError(403, "rateLimitExceeded")).toBe("RATE_LIMITED");
    expect(mapGoogleError(429, undefined)).toBe("RATE_LIMITED");
    expect(mapGoogleError(500, undefined)).toBe("FETCH_FAILED");
  });
});

describe("parseFreeBusyRequest（入力検証）", () => {
  const now = R1.start;
  const ok = (ranges: unknown) => parseFreeBusyRequest(JSON.stringify({ ranges }), now);

  it("正しい入力", () => {
    expect(ok([R1, R2])).toEqual([R1, R2]);
  });

  it.each([
    ["空", []],
    ["11 件以上", Array.from({ length: 11 }, () => R1)],
    ["終了が開始以前", [{ start: R1.end, end: R1.start }]],
    ["1 日を超える", [{ start: R1.start, end: R1.start + 27 * 3600_000 }]],
    ["遠い過去", [{ start: now - 3 * DAY, end: now - 2.5 * DAY }]],
    ["遠い未来", [{ start: now + 401 * DAY, end: now + 401 * DAY + 3600_000 }]],
    ["小数", [{ start: 1.5, end: 2.5 }]],
    ["余計な項目", [{ ...R1, text: "LINE本文" }]],
  ])("%s は拒否", (_n, ranges) => {
    expect(ok(ranges)).toBeNull();
  });

  it("JSON でない・大きすぎる本文は拒否", () => {
    expect(parseFreeBusyRequest("{", now)).toBeNull();
    expect(parseFreeBusyRequest(" ".repeat(5000), now)).toBeNull();
  });
});
