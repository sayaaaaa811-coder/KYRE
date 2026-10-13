import { formatDateJa, formatTime } from "@/lib/time";
import type { Candidate, CandidateEvaluation } from "@/lib/types";

const STATUS_VIEW = {
  available: { mark: "◎", label: "参加できます", card: "border-gold bg-paper", markClass: "text-gold" },
  busy_with_alternatives: { mark: "×", label: "予定があります", card: "border-line bg-paper", markClass: "text-sub" },
  busy_no_alternatives: {
    mark: "×",
    label: "予定があります（前後3時間に空きなし）",
    card: "border-line bg-paper",
    markClass: "text-sub",
  },
  out_of_scope: { mark: "−", label: "判定対象外", card: "border-line bg-ivory", markClass: "text-sub" },
  fetch_failed: {
    mark: "!",
    label: "予定を取得できませんでした",
    card: "border-alert/40 bg-alert-soft",
    markClass: "text-alert",
  },
} as const;

const REASON_TEXT = {
  past: "過去の日時です。",
  crosses_midnight: "終了が日付をまたぐため判定できません。所要時間を短くしてお試しください。",
} as const;

export function ResultCard({
  candidate,
  evaluation,
  timeZone,
}: {
  candidate: Candidate;
  evaluation: CandidateEvaluation;
  timeZone: string;
}) {
  const view = STATUS_VIEW[evaluation.status];
  const timeRange = `${formatTime(evaluation.slot.start, timeZone)}–${formatTime(evaluation.slot.end, timeZone)}`;

  return (
    <li
      className={`animate-fade-in rounded-2xl border p-4 ${view.card}`}
      data-status={evaluation.status}
      aria-label={`${formatDateJa(candidate.date)} ${candidate.startTime} ${view.label}`}
    >
      <div className="flex items-baseline gap-3">
        <span className={`w-5 shrink-0 text-center text-lg ${view.markClass}`} aria-hidden="true">
          {view.mark}
        </span>
        <div className="min-w-0">
          <p className="font-serif text-lg tracking-wide">
            {formatDateJa(candidate.date)} <span className="ml-1">{timeRange}</span>
          </p>
          <p className={`mt-0.5 text-sm ${evaluation.status === "fetch_failed" ? "text-alert" : "text-sub"}`}>
            {view.label}
          </p>
          {evaluation.reason && <p className="mt-1 text-xs text-sub">{REASON_TEXT[evaluation.reason]}</p>}
        </div>
      </div>

      {evaluation.alternatives.length > 0 && (
        <div className="mt-3 pl-8">
          <p className="text-xs tracking-wider text-sub">この時間なら空いています</p>
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="代替案">
            {evaluation.alternatives.map((alt) => (
              <li key={alt.start} className="rounded-full border border-gold px-3 py-1.5 text-sm text-ink">
                {formatTime(alt.start, timeZone)}〜
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
