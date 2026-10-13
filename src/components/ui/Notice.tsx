import type { ReactNode } from "react";

export function Notice({ tone = "info", children }: { tone?: "info" | "alert"; children: ReactNode }) {
  return (
    <div
      role={tone === "alert" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
        tone === "alert" ? "bg-alert-soft text-alert" : "bg-ivory text-sub"
      }`}
    >
      {children}
    </div>
  );
}
