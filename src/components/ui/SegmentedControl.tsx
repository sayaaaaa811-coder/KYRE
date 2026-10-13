"use client";

import { useId } from "react";

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="mb-2 text-xs font-medium tracking-wider text-sub">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="flex rounded-xl border border-line bg-ivory p-1">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`min-h-10 flex-1 rounded-lg text-sm transition-colors ${
                selected ? "bg-paper font-medium text-ink shadow-sm ring-1 ring-gold" : "text-sub hover:text-ink"
              }`}
            >
              {format(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
