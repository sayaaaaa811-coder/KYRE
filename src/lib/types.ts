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

export interface Settings {
  durationMinutes: DurationMinutes;
  bufferMinutes: BufferMinutes;
  timeZone: string;
}

export const DEFAULT_SETTINGS: Settings = {
  durationMinutes: 90,
  bufferMinutes: 15,
  timeZone: "Asia/Tokyo",
};

/** 抽出結果の曖昧さ。ユーザーが確認するまで照合できない。 */
export interface Ambiguity {
  kind: string;
  message: string;
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
