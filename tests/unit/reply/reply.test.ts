import { describe, expect, it } from "vitest";
import {
  canGenerateReply,
  defaultSelectedAlternatives,
  generateReply,
  toggleAlternative,
  type Tone,
} from "@/lib/reply";
import { zonedToEpoch } from "@/lib/time";
import type { Candidate, CandidateEvaluation, CandidateStatus } from "@/lib/types";

const TZ = "Asia/Tokyo";
const at = (date: string, time: string) => zonedToEpoch(date, time, TZ);

function row(
  id: string,
  date: string,
  time: string,
  status: CandidateStatus,
  alts: string[] = [],
  durationMin = 90,
): { c: Candidate; e: CandidateEvaluation } {
  const start = at(date, time);
  return {
    c: { id, date, startTime: time, ambiguities: [] },
    e: {
      candidateId: id,
      status,
      slot: { start, end: start + durationMin * 60_000 },
      alternatives: alts.map((t) => ({ start: at(date, t), end: at(date, t) + durationMin * 60_000 })),
      reason: status === "out_of_scope" ? "past" : undefined,
    },
  };
}

function reply(rows: ReturnType<typeof row>[], tone: Tone, selected?: Record<string, number[]>) {
  const evaluations = rows.map((r) => r.e);
  return generateReply({
    candidates: rows.map((r) => r.c),
    evaluations,
    selectedAlternatives: selected ?? defaultSelectedAlternatives(evaluations),
    tone,
    timeZone: TZ,
  });
}

describe("返信文（カジュアル）", () => {
  it("1 件参加可能", () => {
    expect(reply([row("a", "2026-10-20", "19:00", "available")], "casual")).toBe(
      "誘ってくれてありがとう！\n10/20(火)の19時〜なら行けるよ！\n楽しみにしてる！",
    );
  });

  it("複数参加可能・同じ時刻はまとめ、同じ月は省略", () => {
    expect(
      reply([row("a", "2026-10-20", "19:00", "available"), row("b", "2026-10-21", "19:00", "available")], "casual"),
    ).toBe("誘ってくれてありがとう！\n10/20(火)・21(水)の19時〜ならどれでも行けるよ！\n楽しみにしてる！");
  });

  it("時刻が違えば分けて書く・半や 15 分刻みの表記", () => {
    expect(
      reply([row("a", "2026-10-20", "18:30", "available"), row("b", "2026-11-02", "19:15", "available")], "casual"),
    ).toBe("誘ってくれてありがとう！\n10/20(火)の18時半〜、11/2(月)の19:15〜ならどれでも行けるよ！\n楽しみにしてる！");
  });

  it("一部参加可能: 不可の日も一言添える（代替は初期状態では含めない）", () => {
    expect(
      reply(
        [
          row("a", "2026-10-20", "19:00", "available"),
          row("b", "2026-10-21", "19:00", "busy_with_alternatives", ["20:30", "17:30"]),
        ],
        "casual",
      ),
    ).toBe(
      "誘ってくれてありがとう！\n10/20(火)の19時〜なら行けるよ！\n21(水)は予定があって難しそう…\n楽しみにしてる！",
    );
  });

  it("参加可能がなければ、最も近い代替案を初期選択して提案する", () => {
    expect(reply([row("b", "2026-10-21", "19:00", "busy_with_alternatives", ["20:30", "17:30"])], "casual")).toBe(
      "誘ってくれてありがとう！\n10/21(水)は19時だと難しいけど、20時半〜なら大丈夫！\nどうかな？",
    );
  });

  it("選んだ代替案を複数含められる（時刻順）", () => {
    const rows = [row("b", "2026-10-21", "19:00", "busy_with_alternatives", ["20:30", "17:30"])];
    const selected = { b: [at("2026-10-21", "20:30"), at("2026-10-21", "17:30")] };
    expect(reply(rows, "casual", selected)).toBe(
      "誘ってくれてありがとう！\n10/21(水)は19時だと難しいけど、17時半〜か20時半〜なら大丈夫！\nどうかな？",
    );
  });

  it("すべて不可・代替なし", () => {
    expect(reply([row("a", "2026-10-21", "19:00", "busy_no_alternatives")], "casual")).toBe(
      "誘ってくれてありがとう！\nごめん、その日程だと都合が合わなくて…別の日でも大丈夫？",
    );
  });

  it("判定対象外（過去・日付またぎ）は返信に含めない", () => {
    expect(
      reply([row("a", "2026-10-20", "19:00", "available"), row("p", "2026-10-12", "19:00", "out_of_scope")], "casual"),
    ).toBe("誘ってくれてありがとう！\n10/20(火)の19時〜なら行けるよ！\n楽しみにしてる！");
  });
});

describe("返信文（丁寧）", () => {
  it("1 件参加可能", () => {
    expect(reply([row("a", "2026-10-20", "19:00", "available")], "polite")).toBe(
      "ご連絡ありがとうございます。\n10/20(火) 19:00〜でしたら参加可能です。\nよろしくお願いいたします。",
    );
  });

  it("複数・一部不可", () => {
    expect(
      reply(
        [
          row("a", "2026-10-20", "14:00", "available"),
          row("b", "2026-10-21", "10:00", "available"),
          row("c", "2026-10-22", "16:00", "busy_no_alternatives"),
        ],
        "polite",
      ),
    ).toBe(
      "ご連絡ありがとうございます。\n10/20(火) 14:00〜、21(水) 10:00〜のいずれでも参加可能です。\n22(木)は予定があり、参加が難しい状況です。\nよろしくお願いいたします。",
    );
  });

  it("代替案の提案", () => {
    const rows = [row("b", "2026-10-21", "19:00", "busy_with_alternatives", ["20:30", "17:30"])];
    expect(reply(rows, "polite", { b: [at("2026-10-21", "20:30"), at("2026-10-21", "17:30")] })).toBe(
      "ご連絡ありがとうございます。\n10/21(水)は19:00からは難しいのですが、17:30〜、または20:30〜でしたら調整可能です。\nご検討いただけますと幸いです。\nよろしくお願いいたします。",
    );
  });

  it("すべて不可", () => {
    expect(reply([row("a", "2026-10-21", "19:00", "busy_no_alternatives")], "polite")).toBe(
      "ご連絡ありがとうございます。\n申し訳ありません、ご提示いただいた日程はいずれも都合がつかず…別の日程をご相談させていただけますでしょうか。\nよろしくお願いいたします。",
    );
  });
});

describe("補助関数", () => {
  it("取得失敗が 1 つでもあれば返信文を作らない", () => {
    expect(canGenerateReply([row("a", "2026-10-20", "19:00", "available").e])).toBe(true);
    expect(
      canGenerateReply([
        row("a", "2026-10-20", "19:00", "available").e,
        row("b", "2026-10-21", "19:00", "fetch_failed").e,
      ]),
    ).toBe(false);
    expect(canGenerateReply([])).toBe(false);
  });

  it("候補に存在しない代替案（設定変更で消えたもの）は含めない", () => {
    const rows = [row("b", "2026-10-21", "19:00", "busy_with_alternatives", ["20:30"])];
    expect(reply(rows, "casual", { b: [at("2026-10-21", "21:00")] })).toContain("ごめん、その日程だと");
  });

  it("代替案の選択を切り替える", () => {
    const s1 = toggleAlternative({}, "b", 100);
    expect(s1).toEqual({ b: [100] });
    expect(toggleAlternative(s1, "b", 100)).toEqual({ b: [] });
  });
});
