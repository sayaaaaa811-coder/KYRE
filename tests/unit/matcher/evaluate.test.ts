import { describe, expect, it } from "vitest";
import { evaluateCandidates, rangesForCandidates } from "@/lib/matcher";
import { dayRange, formatTime, zonedToEpoch } from "@/lib/time";
import type {
  ActiveHours,
  BufferMinutes,
  CalendarFetchResult,
  Candidate,
  DurationMinutes,
  Interval,
  Settings,
} from "@/lib/types";

const TZ = "Asia/Tokyo";
const DATE = "2026-10-21";
const NOW = zonedToEpoch("2026-10-13", "10:00", TZ);

const at = (time: string, date = DATE) => zonedToEpoch(date, time, TZ);
const busy = (start: string, end: string, date = DATE): Interval => ({
  start: at(start, date),
  end: at(end, date),
});
const candidate = (startTime: string, date = DATE, id = "c1"): Candidate => ({
  id,
  date,
  startTime,
  ambiguities: [],
});
const settings = (
  durationMinutes: DurationMinutes = 90,
  bufferMinutes: BufferMinutes = 15,
  activeHours: ActiveHours = { startHour: 0, endHour: 24 },
): Settings => ({
  durationMinutes,
  bufferMinutes,
  activeHours,
  timeZone: TZ,
});
const DAYTIME: ActiveHours = { startHour: 9, endHour: 23 };
const ok = (intervals: Interval[], dates: string[] = [DATE]): CalendarFetchResult => ({
  status: "ok",
  busy: intervals,
  coveredRanges: dates.map((d) => dayRange(d, TZ)),
});

function evaluateOne(
  startTime: string,
  calendar: CalendarFetchResult,
  s: Settings = settings(),
  date = DATE,
  now = NOW,
) {
  const [result] = evaluateCandidates({ candidates: [candidate(startTime, date)], calendar, settings: s, now });
  return result;
}

const times = (intervals: Interval[]) => intervals.map((i) => formatTime(i.start, TZ));

describe("evaluateCandidates — 基本判定", () => {
  it("予定がなければ参加可能", () => {
    const r = evaluateOne("19:00", ok([]));
    expect(r.status).toBe("available");
    expect(r.slot).toEqual({ start: at("19:00"), end: at("20:30") });
    expect(r.alternatives).toEqual([]);
  });

  it("完全に重なると不可で代替案を出す", () => {
    const r = evaluateOne("19:00", ok([busy("18:00", "19:30")]));
    expect(r.status).toBe("busy_with_alternatives");
    // docs/04-data-flow.md 6. の計算例
    expect(times(r.alternatives)).toEqual(["19:45", "20:00", "20:15"]);
  });
});

describe("境界（半開区間）と余裕時間", () => {
  it("前の予定が 19:00 終了・余裕 0 分なら 19:00 開始は可能", () => {
    expect(evaluateOne("19:00", ok([busy("17:00", "19:00")]), settings(90, 0)).status).toBe("available");
  });

  it("前の予定が 19:00 終了・余裕 15 分なら 19:00 開始は不可", () => {
    expect(evaluateOne("19:00", ok([busy("17:00", "19:00")]), settings(90, 15)).status).not.toBe("available");
  });

  it("後の予定が 20:30 開始・余裕 0 分なら 19:00-20:30 は可能", () => {
    expect(evaluateOne("19:00", ok([busy("20:30", "22:00")]), settings(90, 0)).status).toBe("available");
  });

  it.each([
    [0, "available"],
    [15, "available"],
    [30, "busy"],
    [60, "busy"],
  ] as const)("予定 17:00-18:45・19:00 開始・余裕 %i 分 → %s", (buffer, expected) => {
    const r = evaluateOne("19:00", ok([busy("17:00", "18:45")]), settings(90, buffer));
    if (expected === "available") expect(r.status).toBe("available");
    else expect(r.status).toMatch(/^busy/);
  });

  it.each(DURATION_CASES())("所要時間 %i 分で後続予定との重なりを判定する", (duration, expected) => {
    // 後続予定 21:00 開始、余裕 0 分
    const r = evaluateOne("19:00", ok([busy("21:00", "22:00")]), settings(duration, 0));
    expect(r.status === "available").toBe(expected);
  });
});

function DURATION_CASES(): [DurationMinutes, boolean][] {
  return [
    [30, true],
    [60, true],
    [90, true],
    [120, true],
    [180, false],
  ];
}

describe("代替探索の優先順と範囲", () => {
  it("同距離なら後ろの時間を先に出す", () => {
    // 19:00-19:30 のみ塞ぐ（余裕 0、所要 30 分）→ +30 (19:30) と -30 (18:30) が同距離
    const r = evaluateOne("19:00", ok([busy("19:00", "19:30")]), settings(30, 0));
    expect(times(r.alternatives)).toEqual(["19:30", "18:30", "19:45"]);
  });

  it("最大 3 件で打ち切る", () => {
    const r = evaluateOne("15:00", ok([busy("15:00", "15:15")]), settings(30, 0));
    expect(r.alternatives).toHaveLength(3);
  });

  it("±180 分ちょうどは対象、それより外は対象外", () => {
    // 11:00 開始の候補。11:00-13:59 と 08:00-11:00 を塞ぎ、14:00（+180）だけを空ける
    const r = evaluateOne("11:00", ok([busy("08:00", "14:00"), busy("14:30", "23:00")]), settings(30, 0));
    expect(times(r.alternatives)).toEqual(["14:00"]);
    // 14:15（+195）が空いていても提案しない
    const r2 = evaluateOne("11:00", ok([busy("08:00", "14:15"), busy("14:45", "23:00")]), settings(30, 0));
    expect(r2.status).toBe("busy_no_alternatives");
  });

  it("時間帯 9〜23 時: 09:00 より前に始まる枠は提案しない", () => {
    const r = evaluateOne("10:00", ok([busy("09:00", "12:00")]), settings(60, 0, DAYTIME));
    // 08:00, 08:45 等は対象外。12:00 以降の +120, +135, +150
    expect(times(r.alternatives)).toEqual(["12:00", "12:15", "12:30"]);
  });

  it("時間帯 9〜23 時: 09:00 開始ちょうどは提案できる", () => {
    const r = evaluateOne("10:00", ok([busy("10:00", "12:00")]), settings(60, 0, DAYTIME));
    expect(times(r.alternatives)).toContain("09:00");
  });

  it("時間帯 9〜23 時: 23:00 を超えて終わる枠は提案しない（23:00 ちょうどは可）", () => {
    const r = evaluateOne("21:00", ok([busy("20:00", "21:30")]), settings(90, 0, DAYTIME));
    expect(times(r.alternatives)).toEqual(["21:30", "18:30", "18:15"]);
  });

  it("初期値（24 時間）なら早朝・深夜の枠も提案する（ただし日付はまたがない）", () => {
    const early = evaluateOne("08:00", ok([busy("08:00", "09:00")]), settings(60, 0));
    expect(times(early.alternatives)).toEqual(["09:00", "07:00", "09:15"]);
    const late = evaluateOne("22:00", ok([busy("21:00", "22:30")]), settings(90, 0));
    expect(times(late.alternatives)).toEqual(["22:30", "19:30", "19:15"]);
  });

  it("ユーザーが選んだ時間帯（18〜22 時）の外は提案しない", () => {
    const evening = { startHour: 18, endHour: 22 };
    const r = evaluateOne("19:00", ok([busy("19:00", "20:00")]), settings(60, 0, evening));
    expect(times(r.alternatives)).toEqual(["20:00", "18:00", "20:15"]);
    const narrow = evaluateOne("19:00", ok([busy("18:00", "21:00")]), settings(60, 0, evening));
    expect(times(narrow.alternatives)).toEqual(["21:00"]);
  });

  it("時間帯の外にある元の候補自体は判定する", () => {
    expect(evaluateOne("07:00", ok([]), settings(60, 0, DAYTIME)).status).toBe("available");
  });

  it("不正な時間帯（開始 ≥ 終了）では代替を出さない", () => {
    const r = evaluateOne("19:00", ok([busy("19:00", "20:00")]), settings(60, 0, { startHour: 20, endHour: 20 }));
    expect(r.status).toBe("busy_no_alternatives");
  });

  it("前後 3 時間に空きがなければ代替なし", () => {
    const r = evaluateOne("19:00", ok([busy("15:00", "23:00")]), settings(90, 15));
    expect(r.status).toBe("busy_no_alternatives");
    expect(r.alternatives).toEqual([]);
  });

  it("現在時刻より前の代替枠は提案しない", () => {
    const now = at("17:10");
    const r = evaluateOne("18:00", ok([busy("18:00", "19:00")]), settings(60, 0), DATE, now);
    expect(times(r.alternatives)).toEqual(["19:00", "19:15", "19:30"]);
  });
});

describe("busy 区間の統合", () => {
  it("余裕時間で接続された予定の隙間は使わない", () => {
    // 18:00-19:00 と 19:30-20:00。余裕 15 分 → 17:45-19:15 と 19:15-20:15 が接して統合される
    const r = evaluateOne("19:00", ok([busy("18:00", "19:00"), busy("19:30", "20:00")]), settings(30, 15));
    expect(r.status).toBe("busy_with_alternatives");
    expect(times(r.alternatives)[0]).toBe("20:15");
  });

  it("包含される予定も正しく扱う", () => {
    const r = evaluateOne("19:00", ok([busy("17:00", "22:00"), busy("18:00", "19:00")]), settings(30, 0));
    expect(times(r.alternatives)).toEqual(["16:30", "16:15", "22:00"]);
  });
});

describe("終日予定", () => {
  it("予定ありの終日予定がある日は全候補不可・代替なし", () => {
    const allDay = { start: at("00:00"), end: at("00:00", "2026-10-22") };
    for (const t of ["09:00", "12:00", "19:00", "21:30"]) {
      expect(evaluateOne(t, ok([allDay])).status).toBe("busy_no_alternatives");
    }
  });

  it("複数日にわたる終日予定もブロックする", () => {
    const multi = { start: at("00:00", "2026-10-20"), end: at("00:00", "2026-10-23") };
    const r = evaluateCandidates({
      candidates: [candidate("19:00", "2026-10-21", "a"), candidate("19:00", "2026-10-23", "b")],
      calendar: ok([multi], ["2026-10-21", "2026-10-23"]),
      settings: settings(),
      now: NOW,
    });
    expect(r.map((x) => x.status)).toEqual(["busy_no_alternatives", "available"]);
  });

  it("UTC 基準で返された終日予定（JST 9:00 区切り）も絶対時刻で正しく扱う", () => {
    // カレンダーのタイムゾーンが UTC の場合、JST では 9:00〜翌 9:00 になる
    const utcAllDay = { start: Date.parse("2026-10-21T00:00:00Z"), end: Date.parse("2026-10-22T00:00:00Z") };
    expect(evaluateOne("08:00", ok([utcAllDay]), settings(30, 0)).status).toBe("available");
    const r = evaluateOne("09:00", ok([utcAllDay]), settings(30, 0));
    expect(r.status).toBe("busy_with_alternatives");
    expect(times(r.alternatives)).toEqual(["08:30", "08:15", "08:00"]);
  });
});

describe("取得失敗時は決して参加可能にしない", () => {
  it("API エラー", () => {
    const r = evaluateOne("19:00", { status: "error", code: "FETCH_FAILED" });
    expect(r.status).toBe("fetch_failed");
  });

  it("取得範囲に含まれない日", () => {
    const r = evaluateOne("19:00", ok([], ["2026-10-20"]));
    expect(r.status).toBe("fetch_failed");
  });

  it("日の一部しか取得できていない", () => {
    const partial: CalendarFetchResult = {
      status: "ok",
      busy: [],
      coveredRanges: [{ start: at("12:00"), end: at("00:00", "2026-10-22") }],
    };
    expect(evaluateOne("19:00", partial).status).toBe("fetch_failed");
  });

  it("不正な busy 区間を含む", () => {
    const bad: CalendarFetchResult = { ...ok([{ start: at("20:00"), end: at("19:00") }]) };
    expect(evaluateOne("09:00", bad).status).toBe("fetch_failed");
    const nan: CalendarFetchResult = { ...ok([{ start: Number.NaN, end: at("19:00") }]) };
    expect(evaluateOne("09:00", nan).status).toBe("fetch_failed");
  });
});

describe("判定対象外", () => {
  it("過去の日時", () => {
    const r = evaluateOne("09:00", ok([], ["2026-10-13"]), settings(), "2026-10-13");
    expect(r).toMatchObject({ status: "out_of_scope", reason: "past" });
  });

  it("日付をまたぐ候補", () => {
    const r = evaluateOne("22:00", ok([]), settings(180, 0));
    expect(r).toMatchObject({ status: "out_of_scope", reason: "crosses_midnight" });
  });

  it("24:00 ちょうどに終わる候補は対象", () => {
    expect(evaluateOne("22:30", ok([]), settings(90, 0)).status).toBe("available");
  });

  it("取得失敗より日付またぎ・過去の判定を優先する", () => {
    const r = evaluateOne("23:00", { status: "error", code: "NETWORK" }, settings(90, 0));
    expect(r.reason).toBe("crosses_midnight");
  });
});

describe("rangesForCandidates", () => {
  it("暦日ごとに重複なく日付順で返す", () => {
    const ranges = rangesForCandidates(
      [
        candidate("19:00", "2026-10-22", "a"),
        candidate("12:00", "2026-10-20", "b"),
        candidate("20:00", "2026-10-22", "c"),
      ],
      TZ,
    );
    expect(ranges).toEqual([dayRange("2026-10-20", TZ), dayRange("2026-10-22", TZ)]);
  });
});
