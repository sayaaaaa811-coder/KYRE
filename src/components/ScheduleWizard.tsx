"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CandidateReviewStep } from "@/components/steps/CandidateReviewStep";
import { MessageInputStep } from "@/components/steps/MessageInputStep";
import { ResultStep } from "@/components/steps/ResultStep";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { useStepHistory } from "@/hooks/useStepHistory";
import { createMockCalendar, isMockScenario, type MockScenario } from "@/lib/calendar/mock";
import type { CalendarProvider } from "@/lib/calendar/types";
import { evaluateCandidates, rangesForCandidates } from "@/lib/matcher";
import { MAX_CANDIDATES, parseMessage } from "@/lib/parser";
import { addDays, todayIn } from "@/lib/time";
import { DEFAULT_SETTINGS, type CalendarFetchResult, type Candidate, type IsoDate, type Settings } from "@/lib/types";

let candidateSeq = 0;
const newCandidateId = () => `c${++candidateSeq}`;

export function ScheduleWizard() {
  const { step, goTo, back } = useStepHistory();

  const [message, setMessage] = useState("");
  const [referenceDate, setReferenceDate] = useState<IsoDate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [scenario, setScenario] = useState<MockScenario>("mixed");

  const [calendarResult, setCalendarResult] = useState<CalendarFetchResult | null>(null);
  const [checkedAt, setCheckedAt] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 現在日時と URL はブラウザでしか確定しないため、マウント後に設定する
    /* eslint-disable react-hooks/set-state-in-effect */
    setReferenceDate(todayIn(Date.now(), DEFAULT_SETTINGS.timeZone));
    const requested = new URLSearchParams(window.location.search).get("mock");
    if (isMockScenario(requested)) setScenario(requested);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Phase 3 で Google 実装に差し替える
  const calendar: CalendarProvider = useMemo(
    () => createMockCalendar({ scenario, timeZone: settings.timeZone, delayMs: 400 }),
    [scenario, settings.timeZone],
  );

  const evaluations = useMemo(
    () =>
      calendarResult ? evaluateCandidates({ candidates, calendar: calendarResult, settings, now: checkedAt }) : [],
    [calendarResult, candidates, settings, checkedAt],
  );

  const updateCandidates = (next: Candidate[]) => {
    setCandidates(next);
    // 候補が変わったら前回の照合結果は使わない
    setCalendarResult(null);
  };

  const extract = () => {
    if (!referenceDate) return;
    const result = parseMessage(message, { referenceDate, timeZone: settings.timeZone });
    const found = result.candidates.slice(0, MAX_CANDIDATES).map((c) => ({ ...c, id: newCandidateId() }));
    updateCandidates(found);
    const notes: string[] = [];
    if (found.length === 0) notes.push("日時を見つけられませんでした。「＋ 候補を追加」から入力してください。");
    if (result.truncated) notes.push(`候補が多いため、先頭の${MAX_CANDIDATES}件だけを表示しています。`);
    if (result.durationHintMinutes && result.durationHintMinutes !== settings.durationMinutes) {
      setSettings({ ...settings, durationMinutes: result.durationHintMinutes });
      notes.push(`メッセージの時間に合わせて、所要時間を${result.durationHintMinutes}分にしました。`);
    }
    setNotice(notes.length > 0 ? notes.join("\n") : null);
    goTo(2);
  };

  const startManual = () => {
    updateCandidates([]);
    setNotice(null);
    goTo(2);
  };

  const addCandidate = () => {
    if (!referenceDate || candidates.length >= MAX_CANDIDATES) return;
    updateCandidates([
      ...candidates,
      { id: newCandidateId(), date: addDays(referenceDate, 1), startTime: "19:00", ambiguities: [] },
    ]);
  };

  const fetchCalendar = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setChecking(true);
    let result: CalendarFetchResult;
    try {
      result = await calendar.fetchBusy(rangesForCandidates(candidates, settings.timeZone), {
        signal: controller.signal,
      });
    } catch {
      result = { status: "error", code: "NETWORK" };
    }
    if (controller.signal.aborted) return;
    setCalendarResult(result);
    setCheckedAt(Date.now());
    setChecking(false);
  };

  const check = async () => {
    await fetchCalendar();
    goTo(3);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="flex h-16 items-center justify-between">
        <div className="flex w-20 items-center">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              className="-ml-2 flex min-h-11 items-center gap-1 px-2 text-sm text-sub hover:text-ink"
            >
              <span aria-hidden="true">‹</span> 戻る
            </button>
          )}
        </div>
        <h1 className="text-center leading-none">
          <span className="block font-serif text-lg tracking-[0.35em] text-ink">KYRE</span>
          <span className="mt-1 block text-[10px] tracking-[0.3em] text-gold">SCHEDULE</span>
        </h1>
        <div className="flex w-20 justify-end">
          <StepIndicator current={step} />
        </div>
      </header>

      <main className="flex flex-1 flex-col pt-4">
        {step === 1 && (
          <MessageInputStep
            message={message}
            onMessageChange={setMessage}
            referenceDate={referenceDate}
            onReferenceDateChange={setReferenceDate}
            onExtract={extract}
            onManual={startManual}
          />
        )}

        {step === 2 && (
          <CandidateReviewStep
            candidates={candidates}
            notice={notice}
            settings={settings}
            checking={checking}
            onCandidateChange={(c) => updateCandidates(candidates.map((x) => (x.id === c.id ? c : x)))}
            onCandidateRemove={(id) => updateCandidates(candidates.filter((x) => x.id !== id))}
            onCandidateAdd={addCandidate}
            onSettingsChange={setSettings}
            onCheck={check}
          />
        )}

        {step === 3 &&
          (calendarResult ? (
            <ResultStep
              candidates={candidates}
              evaluations={evaluations}
              settings={settings}
              calendarKind={calendar.kind}
              fetchFailed={calendarResult.status === "error"}
              retrying={checking}
              onSettingsChange={setSettings}
              onRetry={fetchCalendar}
              onEditCandidates={back}
            />
          ) : (
            <div className="animate-fade-in space-y-4">
              <p className="text-sm text-sub">候補が変更されたため、もう一度空き状況を確認してください。</p>
              <Button className="w-full" onClick={() => goTo(2)}>
                候補の確認に戻る
              </Button>
            </div>
          ))}
      </main>
    </div>
  );
}
