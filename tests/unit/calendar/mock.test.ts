import { describe, expect, it } from "vitest";
import { createMockCalendar } from "@/lib/calendar/mock";
import { dayRange, formatTime } from "@/lib/time";

const TZ = "Asia/Tokyo";

describe("ダミーカレンダー", () => {
  it("mixed: 偶数日は昼と夜、奇数日は昼のみ", async () => {
    const cal = createMockCalendar({ scenario: "mixed", timeZone: TZ });
    const res = await cal.fetchBusy([dayRange("2026-10-19", TZ), dayRange("2026-10-20", TZ)]);
    if (res.status !== "ok") throw new Error("expected ok");
    expect(res.busy.map((b) => `${formatTime(b.start, TZ)}-${formatTime(b.end, TZ)}`)).toEqual([
      "12:00-13:00",
      "12:00-13:00",
      "18:30-20:00",
    ]);
    expect(res.coveredRanges).toHaveLength(2);
  });

  it("mixed: 7 の倍数の日は終日予定", async () => {
    const cal = createMockCalendar({ scenario: "mixed", timeZone: TZ });
    const range = dayRange("2026-10-14", TZ);
    const res = await cal.fetchBusy([range]);
    expect(res).toMatchObject({ status: "ok", busy: [range] });
  });

  it("error: 取得失敗を返す", async () => {
    const cal = createMockCalendar({ scenario: "error", timeZone: TZ });
    expect(await cal.fetchBusy([dayRange("2026-10-20", TZ)])).toEqual({ status: "error", code: "FETCH_FAILED" });
  });
});
