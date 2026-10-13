import { describe, expect, it } from "vitest";
import { MAX_CANDIDATES, MAX_MESSAGE_LENGTH, parseMessage } from "@/lib/parser";
import { normalize } from "@/lib/parser/normalize";
import { CORPUS, REF } from "./corpus";

const TZ = "Asia/Tokyo";

function summarize(text: string, ref = REF) {
  const r = parseMessage(text, { referenceDate: ref, timeZone: TZ });
  return {
    candidates: r.candidates.map((c) => {
      const kinds = c.ambiguities.map((a) => a.kind).sort();
      return kinds.length > 0 ? `${c.date} ${c.startTime} !${kinds.join(",")}` : `${c.date} ${c.startTime}`;
    }),
    duration: r.durationHintMinutes,
  };
}

describe("日時抽出コーパス", () => {
  it(`コーパスは ${CORPUS.length} 件`, () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(130);
  });

  it.each(CORPUS.map((c) => [c.text.replace(/\n/g, "⏎"), c] as const))("%s", (_name, c) => {
    const r = summarize(c.text, c.ref);
    expect(r.candidates).toEqual(c.expected);
    if (c.duration !== undefined) expect(r.duration).toBe(c.duration);
  });
});

describe("parseMessage の性質", () => {
  it("決定的: 同じ入力・基準日なら毎回同じ結果", () => {
    const text = CORPUS.map((c) => c.text).join("\n");
    const first = JSON.stringify(parseMessage(text, { referenceDate: REF, timeZone: TZ }));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(parseMessage(text, { referenceDate: REF, timeZone: TZ }))).toBe(first);
    }
  });

  it("基準日を変えると相対日付の解釈が変わる", () => {
    expect(summarize("明日の19時", "2026-12-31").candidates).toEqual(["2027-01-01 19:00"]);
  });

  it(`候補は最大 ${MAX_CANDIDATES} 件で、超えた場合は truncated`, () => {
    const text = Array.from({ length: 15 }, (_, i) => `10/${i + 14} 19時`).join("\n");
    const r = parseMessage(text, { referenceDate: REF, timeZone: TZ });
    expect(r.candidates).toHaveLength(MAX_CANDIDATES);
    expect(r.truncated).toBe(true);
  });

  it("同じ日時は 1 件にまとめる", () => {
    expect(summarize("10/20 19時、もう一度言うと10/20 19時").candidates).toEqual(["2026-10-20 19:00"]);
  });

  it("候補は日時順に並ぶ", () => {
    expect(summarize("10/22 19時\n10/20 19時").candidates).toEqual(["2026-10-20 19:00", "2026-10-22 19:00"]);
  });

  it("午前・午後の要確認には選択肢が付く", () => {
    const [c] = parseMessage("20日 7時", { referenceDate: REF, timeZone: TZ }).candidates;
    expect(c.ambiguities[0].options).toEqual([
      { label: "午前 07:00", startTime: "07:00" },
      { label: "午後 19:00", startTime: "19:00" },
    ]);
  });

  it("曜日の矛盾には日付どおり／曜日どおりの選択肢が付く", () => {
    const [c] = parseMessage("10/20(水) 19時", { referenceDate: REF, timeZone: TZ }).candidates;
    expect(c.ambiguities[0].options).toEqual([
      { label: "10/20(火)", date: "2026-10-20" },
      { label: "10/21(水)", date: "2026-10-21" },
    ]);
  });

  it("日曜基準の「来週」は月曜始まり・日曜始まりの選択肢を出す", () => {
    const [c] = parseMessage("来週の火曜19時", { referenceDate: "2026-10-18", timeZone: TZ }).candidates;
    expect(c.ambiguities[0].options?.map((o) => o.date)).toEqual(["2026-10-20", "2026-10-27"]);
  });

  it(`${MAX_MESSAGE_LENGTH} 文字を超える部分は解析しない`, () => {
    const text = "あ".repeat(MAX_MESSAGE_LENGTH) + "10/20 19時";
    expect(parseMessage(text, { referenceDate: REF, timeZone: TZ }).candidates).toEqual([]);
  });
});

describe("性能（ReDoS 対策）", () => {
  const cases: Record<string, string> = {
    数字の連続: "1".repeat(2000),
    区切りの連続: "1/".repeat(1000),
    時刻の連続: "19時".repeat(660),
    空白と記号: "10 / ".repeat(400),
    範囲記号の連続: "1〜".repeat(1000),
    コーパス連結: CORPUS.map((c) => c.text)
      .join("\n")
      .slice(0, 2000),
    全角数字: "１２：".repeat(660),
  };
  it.each(Object.entries(cases))("%s を 50ms 以内で処理", (_name, text) => {
    parseMessage(text, { referenceDate: REF, timeZone: TZ }); // ウォームアップ
    const start = performance.now();
    parseMessage(text, { referenceDate: REF, timeZone: TZ });
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe("normalize", () => {
  it("全角を半角に、丸数字を記号に、URL を空白に", () => {
    expect(normalize("①１０／２０（火）")).toBe("・10/20(火)");
    expect(normalize("see https://a.example/1/2 ok")).toBe("see   ok");
    expect(normalize("7PM")).toBe("7pm");
  });
});
