"use client";

import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  tone: "info" | "alert";
}

/** 画面下部に一時的に表示するお知らせ */
export function Toast({ message, onDone }: { message: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, message.tone === "alert" ? 5000 : 2500);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-5" aria-live="polite">
      {message && (
        <p
          key={message.id}
          role="status"
          className={`animate-fade-in max-w-sm rounded-full px-5 py-3 text-center text-sm shadow-lg ${
            message.tone === "alert" ? "bg-alert text-paper" : "bg-ink text-paper"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
