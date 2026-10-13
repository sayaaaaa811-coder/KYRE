import type { ReactNode } from "react";

/** 親指の届く画面下部に主ボタンを固定する */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-8 border-t border-line/60 bg-paper/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
      {children}
    </div>
  );
}
