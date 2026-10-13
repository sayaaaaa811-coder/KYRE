"use client";

import { useId } from "react";
import { formatDateJa, isValidIsoDate, isValidTimeOfDay } from "@/lib/time";
import type { Candidate } from "@/lib/types";

export function CandidateCard({
  candidate,
  index,
  onChange,
  onRemove,
}: {
  candidate: Candidate;
  index: number;
  onChange: (next: Candidate) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const ambiguous = candidate.ambiguities.length > 0;
  const validDate = isValidIsoDate(candidate.date);
  const validTime = isValidTimeOfDay(candidate.startTime);

  return (
    <li
      className={`animate-fade-in rounded-2xl border bg-paper p-4 ${ambiguous ? "border-gold" : "border-line"}`}
      aria-label={`候補${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-lg tracking-wide">
          {validDate ? formatDateJa(candidate.date) : "日付未設定"}
          <span className="ml-2">{validTime ? `${candidate.startTime}〜` : "--:--"}</span>
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="-mt-1 -mr-1 flex size-11 items-center justify-center rounded-full text-sub hover:bg-ivory hover:text-ink"
          aria-label={`候補${index + 1}を削除`}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {ambiguous && (
        <div className="mt-2 rounded-xl bg-gold-soft px-3 py-2">
          <p className="text-xs font-bold tracking-wider text-gold-deep">要確認</p>
          <ul className="mt-1 space-y-2 text-sm text-ink">
            {candidate.ambiguities.map((a) => (
              <li key={a.kind}>
                {a.message}
                {a.options && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {a.options.map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...candidate,
                            date: o.date ?? candidate.date,
                            startTime: o.startTime ?? candidate.startTime,
                            ambiguities: candidate.ambiguities.filter((x) => x.kind !== a.kind),
                          })
                        }
                        className="min-h-10 rounded-lg border border-gold bg-paper px-3 text-sm hover:bg-ivory"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onChange({ ...candidate, ambiguities: [] })}
            className="mt-3 min-h-10 rounded-lg bg-ink px-3 text-sm text-paper"
          >
            表示中の日時で確定する
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-2">
        <label htmlFor={`${id}-date`} className="text-xs text-sub">
          日付
          <input
            id={`${id}-date`}
            type="date"
            required
            value={candidate.date}
            onChange={(e) => onChange({ ...candidate, date: e.target.value, ambiguities: [] })}
            className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-ivory px-3 text-base text-ink"
          />
        </label>
        <label htmlFor={`${id}-time`} className="text-xs text-sub">
          開始時刻
          <input
            id={`${id}-time`}
            type="time"
            step={900}
            required
            value={candidate.startTime}
            onChange={(e) => onChange({ ...candidate, startTime: e.target.value, ambiguities: [] })}
            className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-ivory px-3 text-base text-ink"
          />
        </label>
      </div>
    </li>
  );
}
