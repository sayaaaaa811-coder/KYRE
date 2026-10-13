import { addDays, dayOfWeek, diffDays, formatDateJa, makeIsoDate, parseIsoDate } from "@/lib/time";
import type { Ambiguity, IsoDate } from "@/lib/types";
import type { DateAtom, WeekRel } from "./scanner";

const WD_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/** md（年なし月日）の年を決める猶予。基準日よりこれ以上前なら翌年とみなす */
const PAST_TOLERANCE_DAYS = 60;
/** これより先の日付は要確認 */
export const FAR_FUTURE_DAYS = 90;

export interface ResolvedDate {
  date: IsoDate;
  ambiguities: Ambiguity[];
}

/** リスト内で直前の日付（「10/20か21」の 21 に月を引き継ぐため） */
interface ListContext {
  prev?: IsoDate;
  /** 「来週の火曜か水曜」の水曜に「来週」を引き継ぐ */
  week?: WeekRel;
}

export function label(date: IsoDate, referenceDate: IsoDate): string {
  const { year } = parseIsoDate(date);
  const ref = parseIsoDate(referenceDate);
  return year === ref.year ? formatDateJa(date) : `${year}/${formatDateJa(date)}`;
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/** 月曜始まりの週の月曜日 */
function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

/** 日曜始まりの週の日曜日 */
function sundayOf(date: IsoDate): IsoDate {
  return addDays(date, -dayOfWeek(date));
}

function weekdayInWeek(weekStartMonday: IsoDate, weekday: number): IsoDate {
  return addDays(weekStartMonday, (weekday + 6) % 7);
}

/** date 以降で最初の weekday */
function upcoming(date: IsoDate, weekday: number): IsoDate {
  return addDays(date, (weekday - dayOfWeek(date) + 7) % 7);
}

function weekdayMismatch(date: IsoDate, stated: number | undefined, ref: IsoDate): Ambiguity[] {
  if (stated === undefined || dayOfWeek(date) === stated) return [];
  // 日付どおり／書かれた曜日に合わせた最も近い日（±3 日）の 2 択
  const shift = ((stated - dayOfWeek(date) + 10) % 7) - 3;
  const byWeekday = addDays(date, shift);
  return [
    {
      kind: "weekday_mismatch",
      message: `${label(date, ref)}は${WD_NAMES[dayOfWeek(date)]}曜日です（メッセージでは${WD_NAMES[stated]}曜日）。どちらですか？`,
      options: [
        { label: label(date, ref), date },
        { label: label(byWeekday, ref), date: byWeekday },
      ],
    },
  ];
}

function relativeWeek(weekday: number, week: WeekRel, ref: IsoDate): ResolvedDate {
  const date = weekdayInWeek(addDays(mondayOf(ref), week * 7), weekday);
  if (week === 0) return { date, ambiguities: [] };
  const sundayBased = addDays(sundayOf(ref), week * 7 + weekday);
  const word = week === 1 ? "来週" : "再来週";
  const options =
    sundayBased !== date
      ? [
          { label: `${label(date, ref)}（月曜始まり）`, date },
          { label: `${label(sundayBased, ref)}（日曜始まり）`, date: sundayBased },
        ]
      : undefined;
  return {
    date,
    ambiguities: [
      { kind: "relative_week", message: `「${word}」を${label(date, ref)}と解釈しました。合っていますか？`, options },
    ],
  };
}

function weekendDates(week: WeekRel | undefined, ref: IsoDate): ResolvedDate[] {
  let saturday: IsoDate;
  if (week === undefined) {
    saturday = upcoming(ref, 6);
    // 日曜日に「週末」と言われた場合は今日（日曜）を含める
    if (dayOfWeek(ref) === 0) saturday = addDays(ref, -1);
  } else {
    saturday = weekdayInWeek(addDays(mondayOf(ref), week * 7), 6);
  }
  const amb: Ambiguity[] =
    week && week > 0
      ? [
          {
            kind: "relative_week",
            message: `「${week === 1 ? "来週末" : "再来週末"}」を${label(saturday, ref)}・${label(addDays(saturday, 1), ref)}と解釈しました。合っていますか？`,
          },
        ]
      : [];
  return [saturday, addDays(saturday, 1)].map((date) => ({ date, ambiguities: amb }));
}

/** 日だけ（「20日」「20(火)」）の月を決める */
function dayOnly(day: number, weekday: number | undefined, ref: IsoDate): ResolvedDate | null {
  const r = parseIsoDate(ref);
  const months = [{ year: r.year, month: r.month }];
  months.push(nextMonth(months[0].year, months[0].month));
  months.push(nextMonth(months[1].year, months[1].month));
  const options = months
    .map(({ year, month }) => makeIsoDate(year, month, day))
    .filter((d): d is IsoDate => d !== null && d >= ref);

  if (weekday !== undefined) {
    const match = options.find((d) => dayOfWeek(d) === weekday);
    if (match) return { date: match, ambiguities: [] };
  }
  const date = options[0];
  if (!date) return null;
  const inThisMonth = parseIsoDate(date).month === r.month;
  const amb: Ambiguity[] = inThisMonth
    ? []
    : [{ kind: "month_inferred", message: `「${day}日」を${label(date, ref)}と解釈しました。合っていますか？` }];
  return { date, ambiguities: [...amb, ...weekdayMismatch(date, weekday, ref)] };
}

export function resolveDateAtom(atom: DateAtom, ref: IsoDate, ctx: ListContext): ResolvedDate[] {
  switch (atom.kind) {
    case "ymd": {
      const date = makeIsoDate(atom.year, atom.month, atom.day);
      return date ? [{ date, ambiguities: weekdayMismatch(date, atom.weekday, ref) }] : [];
    }
    case "md": {
      const r = parseIsoDate(ref);
      let date = makeIsoDate(r.year, atom.month, atom.day);
      if (date && diffDays(date, ref) > PAST_TOLERANCE_DAYS) date = makeIsoDate(r.year + 1, atom.month, atom.day);
      return date ? [{ date, ambiguities: weekdayMismatch(date, atom.weekday, ref) }] : [];
    }
    case "day":
    case "num": {
      const weekday = atom.kind === "day" ? atom.weekday : undefined;
      if (ctx.prev) {
        // リストの続き: 直前の日付の月を引き継ぐ（日が小さければ翌月）
        const p = parseIsoDate(ctx.prev);
        const ym = atom.day < p.day ? nextMonth(p.year, p.month) : { year: p.year, month: p.month };
        const date = makeIsoDate(ym.year, ym.month, atom.day);
        return date ? [{ date, ambiguities: weekdayMismatch(date, weekday, ref) }] : [];
      }
      const resolved = dayOnly(atom.day, weekday, ref);
      return resolved ? [resolved] : [];
    }
    case "rel":
      return [{ date: addDays(ref, atom.offset), ambiguities: [] }];
    case "weekday": {
      const week = atom.week ?? ctx.week;
      if (week !== undefined) return [relativeWeek(atom.weekday, week, ref)];
      const date = upcoming(ref, atom.weekday);
      if (date !== ref) return [{ date, ambiguities: [] }];
      const nextWeek = addDays(ref, 7);
      return [
        {
          date,
          ambiguities: [
            {
              kind: "same_weekday",
              message: `「${WD_NAMES[atom.weekday]}曜」を今日（${label(ref, ref)}）と解釈しました。合っていますか？`,
              options: [
                { label: `今日 ${label(ref, ref)}`, date: ref },
                { label: `来週 ${label(nextWeek, ref)}`, date: nextWeek },
              ],
            },
          ],
        },
      ];
    }
    case "weekend":
      return weekendDates(atom.week, ref);
  }
}

/** 基準日に対して過去・遠い未来の日付に注意を付ける */
export function dateRangeAmbiguities(date: IsoDate, ref: IsoDate): Ambiguity[] {
  const d = diffDays(ref, date);
  if (d < 0) return [{ kind: "past", message: `${label(date, ref)}は過去の日付です。` }];
  if (d > FAR_FUTURE_DAYS) {
    return [{ kind: "far_future", message: `${label(date, ref)}は3か月以上先です。日付を確認してください。` }];
  }
  return [];
}
