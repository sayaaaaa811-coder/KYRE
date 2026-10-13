"use client";

import { useCallback, useEffect, useState } from "react";

export type Step = 1 | 2 | 3 | 4;

function isStep(value: unknown): value is Step {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/**
 * ウィザードのステップをブラウザ履歴（?step=）と同期する。
 * 端末の「戻る」操作で前のステップに戻れるようにするため。
 * 入力内容はメモリにしか持たないので、再読み込み時はステップ 1 から始める。
 */
export function useStepHistory() {
  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("step");
    window.history.replaceState({ ...window.history.state, kyreStep: 1 }, "", url);

    const onPopState = (event: PopStateEvent) => {
      const s = (event.state as { kyreStep?: unknown } | null)?.kyreStep;
      setStep(isStep(s) ? s : 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goTo = useCallback((next: Step) => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(next));
    window.history.pushState({ ...window.history.state, kyreStep: next }, "", url);
    setStep(next);
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => window.history.back(), []);

  return { step, goTo, back };
}
