const LABELS = ["入力", "確認", "照合", "返信"] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-2" aria-label="進行状況">
      {LABELS.map((label, i) => {
        const step = i + 1;
        const state = step < current ? "done" : step === current ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full transition-all ${
                state === "current" ? "w-6 bg-gold" : state === "done" ? "w-1.5 bg-gold" : "w-1.5 bg-line"
              }`}
            />
            <span className="sr-only">
              {label}
              {state === "current" ? "（現在のステップ）" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
