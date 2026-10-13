/** "YYYY-MM-DD"（タイムゾーンを持たない暦日） */
export type IsoDate = string;
/** "HH:mm"（24時間表記） */
export type TimeOfDay = string;

/** 絶対時刻（UNIX エポックミリ秒）の半開区間 [start, end) */
export interface Interval {
  start: number;
  end: number;
}

export const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
export const BUFFER_OPTIONS = [0, 15, 30, 60] as const;

export type DurationMinutes = (typeof DURATION_OPTIONS)[number];
export type BufferMinutes = (typeof BUFFER_OPTIONS)[number];

/**
 * 代替案を提案する時間帯（時、0〜24）。startHour < endHour。
 * 枠の開始が startHour 以降、終了が endHour 以前のものだけを提案する。
 * 初期値は 0〜24（24 時間いつでも）。
 */
export interface ActiveHours {
  startHour: number;
  endHour: number;
}

export const ALL_DAY_HOURS: ActiveHours = { startHour: 0, endHour: 24 };

export interface Settings {
  durationMinutes: DurationMinutes;
  bufferMinutes: BufferMinutes;
  activeHours: ActiveHours;
  timeZone: string;
}

export const DEFAULT_SETTINGS: Settings = {
  durationMinutes: 90,
  bufferMinutes: 15,
  activeHours: ALL_DAY_HOURS,
  timeZone: "Asia/Tokyo",
};

export function isValidActiveHours(h: ActiveHours): boolean {
  return (
    Number.isInteger(h.startHour) &&
    Number.isInteger(h.endHour) &&
    h.startHour >= 0 &&
    h.endHour <= 24 &&
    h.startHour < h.endHour
  );
}

/** 曖昧さを解消するための選択肢（選ぶとその日付・時刻に置き換える） */
export interface AmbiguityOption {
  label: string;
  date?: IsoDate;
  startTime?: TimeOfDay;
}

export type AmbiguityKind =
  | "ampm"
  | "period"
  | "no_time"
  | "inherited_time"
  | "no_date"
  | "month_inferred"
  | "weekday_mismatch"
  | "relative_week"
  | "same_weekday"
  | "far_future"
  | "past";

/** 抽出結果の曖昧さ。ユーザーが確認するまで照合できない。 */
export interface Ambiguity {
  kind: AmbiguityKind;
  message: string;
  options?: AmbiguityOption[];
}

export interface Candidate {
  id: string;
  date: IsoDate;
  startTime: TimeOfDay;
  ambiguities: Ambiguity[];
}

export type CalendarErrorCode = "FETCH_FAILED" | "UNAUTHENTICATED" | "PERMISSION_DENIED" | "RATE_LIMITED" | "NETWORK";

export type CalendarFetchResult =
  | {
      status: "ok";
      busy: Interval[];
      /** 実際に予定を取得できた範囲。ここに含まれない日は「空き」と判定しない。 */
      coveredRanges: Interval[];
    }
  | { status: "error"; code: CalendarErrorCode };

export type CandidateStatus =
  "available" | "busy_with_alternatives" | "busy_no_alternatives" | "out_of_scope" | "fetch_failed";

export type OutOfScopeReason = "past" | "crosses_midnight";

export interface CandidateEvaluation {
  candidateId: string;
  status: CandidateStatus;
  /** 元の候補枠（所要時間込み） */
  slot: Interval;
  alternatives: Interval[];
  reason?: OutOfScopeReason;
}
