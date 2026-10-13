import { formatTime, parseIsoDate, weekdayJa } from "@/lib/time";
import type { Candidate, CandidateEvaluation, Interval, IsoDate } from "@/lib/types";

/**
 * 照合結果から返信文を作る（テンプレート方式・端末内処理）。
 * メッセージ本文は使わず、日時と判定結果だけから組み立てる。
 */

export type Tone = "casual" | "polite";

export const TONE_LABELS: Record<Tone, string> = { casual: "カジュアル", polite: "丁寧" };

export interface ReplyInput {
  candidates: readonly Candidate[];
  evaluations: readonly CandidateEvaluation[];
  /** 候補 ID → 返信に含める代替案の開始時刻（エポックミリ秒） */
  selectedAlternatives: Readonly<Record<string, readonly number[]>>;
  tone: Tone;
  timeZone: string;
}

/** 返信文を作れる状態か（予定を取得できていない候補があれば作らない） */
export function canGenerateReply(evaluations: readonly CandidateEvaluation[]): boolean {
  return evaluations.length > 0 && evaluations.every((e) => e.status !== "fetch_failed");
}

/** 初期選択: 参加可能な候補が 1 つもなければ、各候補の最も近い代替案を 1 つ選ぶ */
export function defaultSelectedAlternatives(evaluations: readonly CandidateEvaluation[]): Record<string, number[]> {
  const anyAvailable = evaluations.some((e) => e.status === "available");
  const result: Record<string, number[]> = {};
  for (const e of evaluations) {
    result[e.candidateId] = !anyAvailable && e.alternatives.length > 0 ? [e.alternatives[0].start] : [];
  }
  return result;
}

/** 日付の表記。同じ月が続くときは月を省略する（10/20(火)・21(水)） */
function dateFormatter() {
  let lastMonth: number | null = null;
  return (date: IsoDate): string => {
    const { month, day } = parseIsoDate(date);
    const text = month === lastMonth ? `${day}(${weekdayJa(date)})` : `${month}/${day}(${weekdayJa(date)})`;
    lastMonth = month;
    return text;
  };
}

function timeText(ms: number, timeZone: string, tone: Tone): string {
  const hhmm = formatTime(ms, timeZone);
  if (tone === "polite") return `${hhmm}〜`;
  const [h, m] = hhmm.split(":").map(Number);
  if (m === 0) return `${h}時〜`;
  if (m === 30) return `${h}時半〜`;
  return `${h}:${String(m).padStart(2, "0")}〜`;
}

interface Item {
  date: IsoDate;
  slot: Interval;
}

/** 同じ時刻の日付をまとめる: 「10/20(火)・21(水)の19時〜」 */
function joinByTime(items: Item[], fmt: (d: IsoDate) => string, timeZone: string, tone: Tone): string {
  const groups = new Map<string, IsoDate[]>();
  for (const item of items) {
    const t = timeText(item.slot.start, timeZone, tone);
    groups.set(t, [...(groups.get(t) ?? []), item.date]);
  }
  const sep = tone === "casual" ? "の" : " ";
  return [...groups.entries()].map(([t, dates]) => `${dates.map(fmt).join("・")}${sep}${t}`).join("、");
}

export function generateReply(input: ReplyInput): string {
  const { tone, timeZone } = input;
  const byId = new Map(input.candidates.map((c) => [c.id, c]));
  const rows = input.evaluations
    .map((e) => ({ e, c: byId.get(e.candidateId) }))
    .filter((r): r is { e: CandidateEvaluation; c: Candidate } => !!r.c)
    .sort((a, b) => a.e.slot.start - b.e.slot.start);

  const available: Item[] = [];
  const withAlternatives: { item: Item; alts: number[] }[] = [];
  const unavailable: Item[] = [];
  for (const { e, c } of rows) {
    const item = { date: c.date, slot: e.slot };
    if (e.status === "available") available.push(item);
    else if (e.status === "busy_with_alternatives" || e.status === "busy_no_alternatives") {
      const offered = new Set(e.alternatives.map((a) => a.start));
      const alts = (input.selectedAlternatives[c.id] ?? []).filter((s) => offered.has(s)).sort((a, b) => a - b);
      if (alts.length > 0) withAlternatives.push({ item, alts });
      else unavailable.push(item);
    }
    // 判定対象外（過去・日付またぎ）と取得失敗は返信に含めない
  }

  const fmt = dateFormatter();
  const lines: string[] = [];
  const casual = tone === "casual";
  lines.push(casual ? "誘ってくれてありがとう！" : "ご連絡ありがとうございます。");

  if (available.length > 0) {
    const list = joinByTime(available, fmt, timeZone, tone);
    if (casual) lines.push(available.length > 1 ? `${list}ならどれでも行けるよ！` : `${list}なら行けるよ！`);
    else lines.push(available.length > 1 ? `${list}のいずれでも参加可能です。` : `${list}でしたら参加可能です。`);
  }

  for (const { item, alts } of withAlternatives) {
    const date = fmt(item.date);
    const original = timeText(item.slot.start, timeZone, tone).replace("〜", "");
    const altText = alts.map((a) => timeText(a, timeZone, tone)).join(casual ? "か" : "、または");
    lines.push(
      casual
        ? `${date}は${original}だと難しいけど、${altText}なら大丈夫！`
        : `${date}は${original}からは難しいのですが、${altText}でしたら調整可能です。`,
    );
  }

  if (unavailable.length > 0 && (available.length > 0 || withAlternatives.length > 0)) {
    const dates = [...new Set(unavailable.map((u) => u.date))].map(fmt).join("・");
    lines.push(casual ? `${dates}は予定があって難しそう…` : `${dates}は予定があり、参加が難しい状況です。`);
  }

  if (available.length === 0 && withAlternatives.length === 0) {
    lines.push(
      casual
        ? "ごめん、その日程だと都合が合わなくて…別の日でも大丈夫？"
        : "申し訳ありません、ご提示いただいた日程はいずれも都合がつかず…別の日程をご相談させていただけますでしょうか。",
    );
  } else if (available.length === 0) {
    lines.push(casual ? "どうかな？" : "ご検討いただけますと幸いです。");
  } else if (casual) {
    lines.push("楽しみにしてる！");
  }

  if (!casual) lines.push("よろしくお願いいたします。");
  return lines.join("\n");
}

/** 選択中の代替案を切り替える */
export function toggleAlternative(
  selected: Readonly<Record<string, readonly number[]>>,
  candidateId: string,
  start: number,
): Record<string, readonly number[]> {
  const current = selected[candidateId] ?? [];
  const next = current.includes(start) ? current.filter((s) => s !== start) : [...current, start];
  return { ...selected, [candidateId]: next };
}
