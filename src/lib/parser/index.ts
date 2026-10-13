import { DURATION_OPTIONS, type Ambiguity, type Candidate, type DurationMinutes, type IsoDate } from "@/lib/types";
import { normalize } from "./normalize";
import { dateRangeAmbiguities, label, resolveDateAtom, type ResolvedDate } from "./resolve";
import {
  scan,
  type Atom,
  type ClockValue,
  type DateAtom,
  type Meridiem,
  type Period,
  type TimeAtom,
  type WeekRel,
} from "./scanner";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CANDIDATES = 10;

export interface ParseOptions {
  /** 相対日付（明日・来週など）の基準日 */
  referenceDate: IsoDate;
  timeZone: string;
}

export interface ParseResult {
  candidates: Omit<Candidate, "id">[];
  /** 「19〜21時」「2時間」などから推定した所要時間（最も近い選択肢） */
  durationHintMinutes?: DurationMinutes;
  /** 候補が多すぎて切り捨てた場合 true */
  truncated: boolean;
}

/** 時間帯の言葉だけのときに仮置きする開始時刻 */
const PERIOD_DEFAULTS: Record<Period, { time: string; word: string }> = {
  morning: { time: "09:00", word: "朝" },
  forenoon: { time: "10:00", word: "午前中" },
  noon: { time: "12:00", word: "昼" },
  afternoon: { time: "14:00", word: "午後" },
  evening: { time: "17:00", word: "夕方" },
  night: { time: "19:00", word: "夜" },
};

const PERIOD_MERIDIEM: Record<Period, Meridiem> = {
  morning: "am",
  forenoon: "am",
  noon: "noon",
  afternoon: "pm",
  evening: "pm",
  night: "pm",
};

const NO_TIME_DEFAULT = "12:00";

/** 日付同士の間にあっても「同じ並び（リスト）」とみなす文字 */
const LIST_GAP = /^(?:[\s、,・/\-*●○◯■□◆◇★☆>|〜~]|か|と|や|でも|も|or|または|又は|もしくは|あるいは|それか)*$/;

interface Group {
  atoms: DateAtom[];
  times: TimeAtom[];
  periods: Period[];
  start: number;
}

/**
 * 日本語メッセージから日時候補を抽出する（ルールベース・決定的）。
 * 同じ入力・同じ基準日なら常に同じ結果を返す。現在時刻は参照しない。
 */
export function parseMessage(text: string, options: ParseOptions): ParseResult {
  const ref = options.referenceDate;
  const normalized = normalize(text.slice(0, MAX_MESSAGE_LENGTH));
  const atoms = scan(normalized);

  const groups = buildGroups(atoms, normalized);
  const timeAtoms = atoms.filter((a): a is TimeAtom => a.type === "time");
  const consumed = new Set(groups.flatMap((g) => g.times));

  const raw: Omit<Candidate, "id">[] = [];

  if (groups.length === 0 && timeAtoms.length > 0) {
    // 時刻はあるが日付がない（「7時どう？」）→ 基準日を仮置きして要確認
    const noDate: Ambiguity = {
      kind: "no_date",
      message: `日付が見つからないため、基準日（${label(ref, ref)}）にしています。正しい日付を選んでください。`,
    };
    for (const t of timeAtoms) {
      const { time, ambiguities } = resolveClock(t.from, undefined);
      raw.push({ date: ref, startTime: time, ambiguities: [noDate, ...ambiguities] });
    }
  }

  for (const group of groups) {
    const dates = resolveGroupDates(group.atoms, ref);
    if (dates.length === 0) continue;
    const times = resolveGroupTimes(group, timeAtoms, consumed);
    for (const d of dates) {
      for (const t of times) {
        raw.push({
          date: d.date,
          startTime: t.time,
          ambiguities: [...d.ambiguities, ...dateRangeAmbiguities(d.date, ref), ...t.ambiguities],
        });
      }
    }
  }

  const candidates = dedupe(raw).sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );

  return {
    candidates: candidates.slice(0, MAX_CANDIDATES),
    durationHintMinutes: durationHint(atoms),
    truncated: candidates.length > MAX_CANDIDATES,
  };
}

/** 日付の部品を「並び」ごとにまとめ、後続の時刻・時間帯を割り当てる */
function buildGroups(atoms: Atom[], text: string): Group[] {
  // 1. 間に区切り文字しかない日付同士を同じ並びにまとめる
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastDateEnd = -1;
  for (const atom of atoms) {
    if (atom.type !== "date") continue;
    if (current && LIST_GAP.test(text.slice(lastDateEnd, atom.start))) {
      current.atoms.push(atom);
    } else {
      current = { atoms: [atom], times: [], periods: [], start: atom.start };
      groups.push(current);
    }
    lastDateEnd = atom.end;
  }

  // 2. 裸の数字（「21」）は、明示的な日付と同じ並びにあるときだけ日付とみなす
  const valid = groups.filter((g) => g.atoms.some((a) => a.kind !== "num"));

  // 3. 時刻・時間帯は、それより前にある直近の並びに割り当てる
  for (const g of valid) {
    for (const a of g.atoms) if (a.kind === "rel" && a.period) g.periods.push(a.period);
  }
  for (const atom of atoms) {
    if (atom.type !== "time" && atom.type !== "period") continue;
    const owner = valid.filter((g) => g.start < atom.start).at(-1);
    if (!owner) continue;
    if (atom.type === "time") owner.times.push(atom);
    else owner.periods.push(atom.period);
  }
  return valid;
}

function resolveGroupDates(atoms: DateAtom[], ref: IsoDate): ResolvedDate[] {
  const result: ResolvedDate[] = [];
  let prev: IsoDate | undefined;
  let week: WeekRel | undefined;
  for (const atom of atoms) {
    const resolved = resolveDateAtom(atom, ref, { prev, week });
    result.push(...resolved);
    if (resolved.length > 0) prev = resolved[resolved.length - 1].date;
    if (atom.kind === "weekday" && atom.week !== undefined) week = atom.week;
  }
  return result;
}

interface ResolvedTime {
  time: string;
  ambiguities: Ambiguity[];
}

function resolveGroupTimes(group: Group, allTimes: TimeAtom[], consumed: Set<TimeAtom>): ResolvedTime[] {
  const hint = group.periods.length > 0 ? PERIOD_MERIDIEM[group.periods[0]] : undefined;

  if (group.times.length > 0) {
    return group.times.map((t) => resolveClock(t.from, hint));
  }

  if (group.periods.length > 0) {
    return [...new Set(group.periods)].map((p) => ({
      time: PERIOD_DEFAULTS[p].time,
      ambiguities: [
        {
          kind: "period",
          message: `「${PERIOD_DEFAULTS[p].word}」を${PERIOD_DEFAULTS[p].time}開始と仮定しました。開始時刻を確認してください。`,
        },
      ],
    }));
  }

  // 時刻がない並び: 直前の時刻（なければ直後）を引き継ぐ
  const before = allTimes.filter((t) => t.end <= group.start).at(-1);
  const after = allTimes.find((t) => t.start > group.start);
  const inherited = before ?? after;
  if (inherited) {
    const r = resolveClock(inherited.from, undefined);
    if (before && !consumed.has(before)) return [r];
    return [
      {
        time: r.time,
        ambiguities: [
          ...r.ambiguities,
          {
            kind: "inherited_time",
            message: `時刻が書かれていないため、他の候補と同じ${r.time}にしています。合っていますか？`,
          },
        ],
      },
    ];
  }

  return [
    {
      time: NO_TIME_DEFAULT,
      ambiguities: [{ kind: "no_time", message: "時刻が書かれていません。開始時刻を入力してください。" }],
    },
  ];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmt(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** 午前/午後を補正して "HH:mm" にする。1〜8 時で午前/午後の手がかりがなければ午後と仮定して要確認 */
export function resolveClock(c: ClockValue, hint: Meridiem | undefined): ResolvedTime {
  const meridiem = c.meridiem ?? hint;
  let hour = c.hour;
  const ambiguities: Ambiguity[] = [];
  if (hour === 24) hour = 0;
  if (meridiem === "pm" && hour < 12) hour += 12;
  else if (meridiem === "am" && hour === 12) hour = 0;
  else if (meridiem === "noon" && hour >= 1 && hour <= 5) hour += 12;
  else if (!meridiem && hour >= 1 && hour <= 8) {
    const am = fmt(hour, c.minute);
    hour += 12;
    const pm = fmt(hour, c.minute);
    ambiguities.push({
      kind: "ampm",
      message: `「${c.hour}時」は午前・午後どちらですか？`,
      options: [
        { label: `午前 ${am}`, startTime: am },
        { label: `午後 ${pm}`, startTime: pm },
      ],
    });
  }
  return { time: fmt(hour, c.minute), ambiguities };
}

function dedupe(items: Omit<Candidate, "id">[]): Omit<Candidate, "id">[] {
  const byKey = new Map<string, Omit<Candidate, "id">>();
  for (const item of items) {
    const key = `${item.date} ${item.startTime}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...item, ambiguities: uniqueByKind(item.ambiguities) });
    } else {
      existing.ambiguities = uniqueByKind([...existing.ambiguities, ...item.ambiguities]);
    }
  }
  return [...byKey.values()];
}

function uniqueByKind(ambiguities: Ambiguity[]): Ambiguity[] {
  const seen = new Set<string>();
  return ambiguities.filter((a) => (seen.has(a.kind) ? false : (seen.add(a.kind), true)));
}

function durationHint(atoms: Atom[]): DurationMinutes | undefined {
  let minutes: number | undefined;
  for (const a of atoms) {
    if (a.type === "duration") {
      minutes = a.minutes;
      break;
    }
    if (a.type === "time" && a.to) {
      const from = toMinutes(resolveClock(a.from, undefined).time);
      let to = toMinutes(resolveClock(a.to, a.from.meridiem).time);
      if (to <= from && to + 12 * 60 > from) to += 12 * 60;
      if (to > from) {
        minutes = to - from;
        break;
      }
    }
  }
  if (minutes === undefined || minutes <= 0) return undefined;
  return DURATION_OPTIONS.reduce((best, o) =>
    Math.abs(o - minutes!) < Math.abs(best - minutes!) ||
    (Math.abs(o - minutes!) === Math.abs(best - minutes!) && o > best)
      ? o
      : best,
  );
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
