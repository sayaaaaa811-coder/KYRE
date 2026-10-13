"use client";

import { useId } from "react";
import { ALL_DAY_HOURS, type ActiveHours } from "@/lib/types";

const PRESETS: { label: string; hours: ActiveHours }[] = [
  { label: "24時間", hours: ALL_DAY_HOURS },
  { label: "9〜18時", hours: { startHour: 9, endHour: 18 } },
  { label: "18〜24時", hours: { startHour: 18, endHour: 24 } },
];

const START_OPTIONS = Array.from({ length: 24 }, (_, h) => h);
const END_OPTIONS = Array.from({ length: 24 }, (_, h) => h + 1);

export function formatActiveHours(h: ActiveHours): string {
  return h.startHour === 0 && h.endHour === 24 ? "24時間" : `${h.startHour}:00〜${h.endHour}:00`;
}

export function ActiveHoursControl({
  value,
  onChange,
}: {
  value: ActiveHours;
  onChange: (value: ActiveHours) => void;
}) {
  const id = useId();

  const changeStart = (startHour: number) =>
    onChange({ startHour, endHour: value.endHour > startHour ? value.endHour : startHour + 1 });
  const changeEnd = (endHour: number) =>
    onChange({ startHour: value.startHour < endHour ? value.startHour : endHour - 1, endHour });

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-wider text-sub">
        提案する時間帯（代替案をこの時間内で探します）
      </legend>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const selected = p.hours.startHour === value.startHour && p.hours.endHour === value.endHour;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(p.hours)}
              className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
                selected ? "border-gold bg-gold-soft font-medium text-ink" : "border-line text-sub hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`${id}-start`} className="sr-only">
          時間帯の開始
        </label>
        <select
          id={`${id}-start`}
          value={value.startHour}
          onChange={(e) => changeStart(Number(e.target.value))}
          className="min-h-11 flex-1 rounded-lg border border-line bg-ivory px-3 text-base"
        >
          {START_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
        <span className="text-sub" aria-hidden="true">
          〜
        </span>
        <label htmlFor={`${id}-end`} className="sr-only">
          時間帯の終了
        </label>
        <select
          id={`${id}-end`}
          value={value.endHour}
          onChange={(e) => changeEnd(Number(e.target.value))}
          className="min-h-11 flex-1 rounded-lg border border-line bg-ivory px-3 text-base"
        >
          {END_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
