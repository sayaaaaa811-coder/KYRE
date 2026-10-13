/**
 * 正規化済みテキストを「日付・時刻などの部品（Atom）」の列に分解する。
 * 各位置で正規表現（sticky）を優先順に試す。どれにも一致しなければ 1 文字進む。
 * 正規表現は入れ子の量指定子を使わず、入力長に対して線形に動作する（ReDoS 対策）。
 */

export type Meridiem = "am" | "pm" | "noon";
export type Period = "morning" | "forenoon" | "noon" | "afternoon" | "evening" | "night";

interface Span {
  start: number;
  end: number;
}

export type DateAtom = Span & { type: "date" } & (
    | { kind: "ymd"; year: number; month: number; day: number; weekday?: number }
    | { kind: "md"; month: number; day: number; weekday?: number }
    | { kind: "day"; day: number; weekday?: number }
    | { kind: "num"; day: number }
    | { kind: "rel"; offset: number; period?: Period }
    | { kind: "weekday"; weekday: number; week?: WeekRel }
    | { kind: "weekend"; week?: WeekRel }
  );

export type WeekRel = 0 | 1 | 2;

/** 時刻（時は 0〜24 の生の値。午前/午後の補正は後段で行う） */
export interface ClockValue {
  hour: number;
  minute: number;
  meridiem?: Meridiem;
}

export type TimeAtom = Span & { type: "time"; from: ClockValue; to?: ClockValue };
export type PeriodAtom = Span & { type: "period"; period: Period };
export type DurationAtom = Span & { type: "duration"; minutes: number };

export type Atom = DateAtom | TimeAtom | PeriodAtom | DurationAtom;

const WD_CHARS = "日月火水木金土";
const WD = `[${WD_CHARS}]`;
const PFX = "午前|午後|朝|昼|夕方|夜|晩|am|pm";
const RANGE_SEP = "〜|~|-|－|–|―|ー|から";
const WD_PAREN = `\\s*\\(\\s*(?<wdp>${WD})(?:曜日?)?\\s*(?:[・,、/]\\s*祝日?)?\\s*\\)`;
const WD_OPT = `(?:${WD_PAREN}|\\s*(?<wds>${WD})曜日?)?`;

const re = (source: string) => new RegExp(source, "y");

const R = {
  ymd: re(`(?<y>\\d{4})\\s*[/\\-.年]\\s*(?<m>\\d{1,2})\\s*[/\\-.月]\\s*(?<d>\\d{1,2})(?!\\d)(?:\\s*日)?${WD_OPT}`),
  range: re(
    `(?:(?<p1>${PFX})\\s*の?\\s*)?(?<h1>\\d{1,2})(?:\\s*:\\s*(?<m1>\\d{2})|\\s*時(?!間)(?<half1>半)?)?\\s*(?:${RANGE_SEP})\\s*` +
      `(?:(?<p2>${PFX})\\s*の?\\s*)?(?<h2>\\d{1,2})(?:\\s*:\\s*(?<m2>\\d{2})|\\s*時(?!間)(?<half2>半)?)(?:\\s*(?<sfx>[ap]m))?`,
  ),
  time: re(
    `(?:(?<p>${PFX})\\s*の?\\s*)?(?<h>\\d{1,2})` +
      `(?:\\s*:\\s*(?<m>\\d{2})(?:\\s*(?<sfx1>[ap]m))?|\\s*時(?!間)\\s*(?:(?<half>半)|(?<min>\\d{1,2})\\s*分)?|\\s*(?<sfx2>[ap]m))`,
  ),
  duration: re(`(?<h>\\d{1,2})\\s*時間(?<half>半)?`),
  md: re(`(?<m>\\d{1,2})\\s*(?:/|月)\\s*(?<d>\\d{1,2})(?![\\d/])(?:\\s*日)?${WD_OPT}`),
  dayParen: re(`(?<d>\\d{1,2})${WD_PAREN}`),
  day: re(`(?<![泊])(?<d>\\d{1,2})\\s*日(?![間中目前後ぶ])${WD_OPT}`),
  num: re(`(?<d>\\d{1,2})(?![\\d人名個円回杯本件枚泊%時分:日月/.万千百歳才年kgm])`),
  rel: re(`(?<w>明々後日|しあさって|明後日|あさって|明日|あした|今日|本日|今夜|今晩|明晩)`),
  weekendRel: re(`(?<rel>今週|来週|再来週)\\s*(?:の\\s*)?(?:週末|土日|末)`),
  weekend: re(`(?:週末|土日)`),
  weekWd: re(`(?<rel>今週|来週|再来週)\\s*(?:の\\s*)?(?<wd>${WD})曜日?`),
  wd: re(`(?<wd>${WD})曜日?`),
  period: re(`(?<w>午前中|お昼|昼|ランチ|朝|午後|夕方|夜|晩|ディナー)`),
  longDigits: re(`\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d{3,}(?:[,.]\\d+)*`),
};

const REL_OFFSETS: Record<string, { offset: number; period?: Period }> = {
  今日: { offset: 0 },
  本日: { offset: 0 },
  今夜: { offset: 0, period: "night" },
  今晩: { offset: 0, period: "night" },
  明日: { offset: 1 },
  あした: { offset: 1 },
  明晩: { offset: 1, period: "night" },
  明後日: { offset: 2 },
  あさって: { offset: 2 },
  明々後日: { offset: 3 },
  しあさって: { offset: 3 },
};

const PERIOD_WORDS: Record<string, Period> = {
  朝: "morning",
  午前中: "forenoon",
  昼: "noon",
  お昼: "noon",
  ランチ: "noon",
  午後: "afternoon",
  夕方: "evening",
  夜: "night",
  晩: "night",
  ディナー: "night",
};

const WEEK_REL: Record<string, WeekRel> = { 今週: 0, 来週: 1, 再来週: 2 };

function weekdayIndex(ch: string | undefined): number | undefined {
  if (!ch) return undefined;
  const i = WD_CHARS.indexOf(ch);
  return i >= 0 ? i : undefined;
}

function meridiemOf(prefix: string | undefined, suffix: string | undefined): Meridiem | undefined {
  const p = prefix ?? suffix;
  if (!p) return undefined;
  if (p === "午前" || p === "朝" || p === "am") return "am";
  if (p === "昼") return "noon";
  return "pm";
}

function clock(
  hour: string,
  minute: string | undefined,
  half: string | undefined,
  prefix?: string,
  suffix?: string,
): ClockValue | null {
  const h = Number(hour);
  const m = half ? 30 : minute ? Number(minute) : 0;
  if (h > 24 || m > 59) return null;
  return { hour: h, minute: m, meridiem: meridiemOf(prefix, suffix) };
}

type Matcher = (text: string, at: number) => { atom: Atom | null; end: number } | null;

function run(regex: RegExp, text: string, at: number) {
  regex.lastIndex = at;
  const m = regex.exec(text);
  return m && m[0].length > 0 ? m : null;
}

const MATCHERS: Matcher[] = [
  (text, at) => {
    const m = run(R.ymd, text, at);
    if (!m?.groups) return null;
    const g = m.groups;
    return {
      end: at + m[0].length,
      atom: {
        type: "date",
        kind: "ymd",
        year: Number(g.y),
        month: Number(g.m),
        day: Number(g.d),
        weekday: weekdayIndex(g.wdp ?? g.wds),
        start: at,
        end: at + m[0].length,
      },
    };
  },
  (text, at) => {
    // 3 桁以上の数字・桁区切りの数字（電話番号・金額など）は丸ごと読み飛ばす
    const m = run(R.longDigits, text, at);
    return m ? { atom: null, end: at + m[0].length } : null;
  },
  (text, at) => {
    const m = run(R.duration, text, at);
    if (!m?.groups) return null;
    const minutes = Number(m.groups.h) * 60 + (m.groups.half ? 30 : 0);
    return { end: at + m[0].length, atom: { type: "duration", minutes, start: at, end: at + m[0].length } };
  },
  (text, at) => {
    const m = run(R.range, text, at);
    if (!m?.groups) return null;
    const g = m.groups;
    // 「7〜夜9時」のように後ろだけに午前/午後がある場合、開始 ≤ 終了なら開始にも適用する
    const inheritPrefix = !g.p1 && g.p2 && Number(g.h1) <= Number(g.h2) ? g.p2 : g.p1;
    const from = clock(g.h1, g.m1, g.half1, inheritPrefix, g.sfx);
    const to = clock(g.h2, g.m2, g.half2, g.p2 ?? g.p1, g.sfx);
    if (!from || !to) return null;
    return { end: at + m[0].length, atom: { type: "time", from, to, start: at, end: at + m[0].length } };
  },
  (text, at) => {
    const m = run(R.time, text, at);
    if (!m?.groups) return null;
    const g = m.groups;
    const from = clock(g.h, g.m ?? g.min, g.half, g.p, g.sfx1 ?? g.sfx2);
    if (!from) return null;
    return { end: at + m[0].length, atom: { type: "time", from, start: at, end: at + m[0].length } };
  },
  (text, at) => {
    const m = run(R.md, text, at);
    if (!m?.groups) return null;
    const g = m.groups;
    return {
      end: at + m[0].length,
      atom: {
        type: "date",
        kind: "md",
        month: Number(g.m),
        day: Number(g.d),
        weekday: weekdayIndex(g.wdp ?? g.wds),
        start: at,
        end: at + m[0].length,
      },
    };
  },
  (text, at) => {
    const m = run(R.dayParen, text, at) ?? run(R.day, text, at);
    if (!m?.groups) return null;
    const g = m.groups;
    return {
      end: at + m[0].length,
      atom: {
        type: "date",
        kind: "day",
        day: Number(g.d),
        weekday: weekdayIndex(g.wdp ?? g.wds),
        start: at,
        end: at + m[0].length,
      },
    };
  },
  (text, at) => {
    const m = run(R.num, text, at);
    if (!m?.groups) return null;
    return {
      end: at + m[0].length,
      atom: { type: "date", kind: "num", day: Number(m.groups.d), start: at, end: at + m[0].length },
    };
  },
  (text, at) => {
    const m = run(R.rel, text, at);
    if (!m?.groups) return null;
    const rel = REL_OFFSETS[m.groups.w];
    return { end: at + m[0].length, atom: { type: "date", kind: "rel", ...rel, start: at, end: at + m[0].length } };
  },
  (text, at) => {
    const m = run(R.weekendRel, text, at);
    if (!m?.groups) return null;
    return {
      end: at + m[0].length,
      atom: { type: "date", kind: "weekend", week: WEEK_REL[m.groups.rel], start: at, end: at + m[0].length },
    };
  },
  (text, at) => {
    const m = run(R.weekWd, text, at);
    if (!m?.groups) return null;
    return {
      end: at + m[0].length,
      atom: {
        type: "date",
        kind: "weekday",
        weekday: weekdayIndex(m.groups.wd)!,
        week: WEEK_REL[m.groups.rel],
        start: at,
        end: at + m[0].length,
      },
    };
  },
  (text, at) => {
    const m = run(R.weekend, text, at);
    if (!m) return null;
    return { end: at + m[0].length, atom: { type: "date", kind: "weekend", start: at, end: at + m[0].length } };
  },
  (text, at) => {
    const m = run(R.wd, text, at);
    if (!m?.groups) return null;
    // 「月曜」「金曜日」のように「曜」が付くものだけを曜日とみなす（「金」単独は対象外）
    if (!m[0].includes("曜")) return null;
    return {
      end: at + m[0].length,
      atom: { type: "date", kind: "weekday", weekday: weekdayIndex(m.groups.wd)!, start: at, end: at + m[0].length },
    };
  },
  (text, at) => {
    const m = run(R.period, text, at);
    if (!m?.groups) return null;
    return {
      end: at + m[0].length,
      atom: { type: "period", period: PERIOD_WORDS[m.groups.w], start: at, end: at + m[0].length },
    };
  },
];

const ASCII_WORD = /[A-Za-z0-9]/;

export function scan(text: string): Atom[] {
  const atoms: Atom[] = [];
  let i = 0;
  while (i < text.length) {
    // 英単語・数字の途中（例: "abc12", "v2"）からは解析を始めない
    if (i > 0 && ASCII_WORD.test(text[i - 1]) && ASCII_WORD.test(text[i])) {
      i++;
      continue;
    }
    let matched = false;
    for (const matcher of MATCHERS) {
      const r = matcher(text, i);
      if (r) {
        if (r.atom) atoms.push(r.atom);
        i = r.end;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }
  return atoms;
}
