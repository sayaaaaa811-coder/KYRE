"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectSheet } from "@/components/ConnectSheet";
import { ReplyStep } from "@/components/steps/ReplyStep";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { copyText } from "@/lib/clipboard";
import { CandidateReviewStep } from "@/components/steps/CandidateReviewStep";
import { MessageInputStep } from "@/components/steps/MessageInputStep";
import { ResultStep } from "@/components/steps/ResultStep";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { useStepHistory } from "@/hooks/useStepHistory";
import { createGoogleCalendar } from "@/lib/calendar/google";
import { createMockCalendar, isMockScenario, type MockScenario } from "@/lib/calendar/mock";
import type { CalendarProvider } from "@/lib/calendar/types";
import { evaluateCandidates, rangesForCandidates } from "@/lib/matcher";
import { MAX_CANDIDATES, parseMessage } from "@/lib/parser";
import {
  canGenerateReply,
  defaultSelectedAlternatives,
  generateReply,
  toggleAlternative,
  type Tone,
} from "@/lib/reply";
import { fetchConnectionStatus, savePending, takePending, type ConnectionStatus } from "@/lib/session-client";
import { addDays, todayIn } from "@/lib/time";
import { DEFAULT_SETTINGS, type CalendarFetchResult, type Candidate, type IsoDate, type Settings } from "@/lib/types";

let candidateSeq = 0;
const newCandidateId = () => `c${++candidateSeq}`;

const AUTH_ERRORS: Record<string, string> = {
  denied: "Google連携がキャンセルされました。連携するか、デモ用のカレンダーでお試しください。",
  scope:
    "カレンダーの空き状況へのアクセスが許可されませんでした。Googleの確認画面で、カレンダーの項目にチェックを入れて連携してください。",
  state: "連携の確認に失敗しました。お手数ですが、もう一度お試しください。",
  rate_limited: "短時間に操作が集中しました。少し時間をおいてからお試しください。",
  failed: "Google連携に失敗しました。もう一度お試しください。",
};

const googleCalendar = createGoogleCalendar();

export function ScheduleWizard() {
  const { step, goTo, back } = useStepHistory();

  const [message, setMessage] = useState("");
  const [referenceDate, setReferenceDate] = useState<IsoDate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [scenario, setScenario] = useState<MockScenario>("mixed");
  const [demo, setDemo] = useState(false);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [calendarResult, setCalendarResult] = useState<CalendarFetchResult | null>(null);
  const [calendarKind, setCalendarKind] = useState<"mock" | "google">("mock");
  const [checkedAt, setCheckedAt] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const [tone, setTone] = useState<Tone>("casual");
  /** ユーザーが選んだ代替案（未操作なら null = 初期選択） */
  const [chosenAlternatives, setChosenAlternatives] = useState<Record<string, readonly number[]> | null>(null);
  /** 編集中の返信文（どの自動作成文を元にしたか base で管理） */
  const [draft, setDraft] = useState<{ base: string; text: string } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mockCalendar: CalendarProvider = useMemo(
    () => createMockCalendar({ scenario, timeZone: settings.timeZone, delayMs: 400 }),
    [scenario, settings.timeZone],
  );

  const runCheck = useCallback(async (provider: CalendarProvider, target: Candidate[], timeZone: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setChecking(true);
    let result: CalendarFetchResult;
    try {
      result = await provider.fetchBusy(rangesForCandidates(target, timeZone), { signal: controller.signal });
    } catch {
      result = { status: "error", code: "NETWORK" };
    }
    if (controller.signal.aborted) return;
    if (result.status === "error" && result.code === "UNAUTHENTICATED") {
      setConnection((c) => (c ? { ...c, connected: false } : c));
    }
    setCalendarKind(provider.kind);
    setCalendarResult(result);
    setChosenAlternatives(null);
    setCheckedAt(Date.now());
    setChecking(false);
  }, []);

  useEffect(() => {
    // 現在日時・URL・連携状態はブラウザでしか確定しないため、マウント後に設定する
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("mock");
    const restore = params.get("restore") === "1";
    const authError = params.get("auth_error");
    if (restore || authError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("restore");
      url.searchParams.delete("auth_error");
      window.history.replaceState(window.history.state, "", url);
    }
    const pending = restore || authError ? takePending() : null;
    const restored = pending?.candidates.map((c) => ({ ...c, id: newCandidateId() })) ?? [];

    /* eslint-disable react-hooks/set-state-in-effect */
    if (isMockScenario(requested)) {
      setScenario(requested);
      setDemo(true);
    }
    setReferenceDate(pending?.referenceDate ?? todayIn(Date.now(), DEFAULT_SETTINGS.timeZone));
    if (pending) {
      setCandidates(restored);
      setSettings(pending.settings);
    }
    if (authError) {
      setNotice(AUTH_ERRORS[authError] ?? AUTH_ERRORS.failed);
      if (pending) goTo(2);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    let cancelled = false;
    void fetchConnectionStatus().then((status) => {
      if (cancelled) return;
      setConnection(status);
      if (!restore || !pending) return;
      goTo(2);
      if (status.connected && restored.length > 0) {
        void runCheck(googleCalendar, restored, pending.settings.timeZone).then(() => goTo(3));
      } else if (!status.connected) {
        setNotice(AUTH_ERRORS.failed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [goTo, runCheck]);

  const evaluations = useMemo(
    () =>
      calendarResult ? evaluateCandidates({ candidates, calendar: calendarResult, settings, now: checkedAt }) : [],
    [calendarResult, candidates, settings, checkedAt],
  );

  const selectedAlternatives = chosenAlternatives ?? defaultSelectedAlternatives(evaluations);
  const generatedReply =
    calendarResult && canGenerateReply(evaluations)
      ? generateReply({ candidates, evaluations, selectedAlternatives, tone, timeZone: settings.timeZone })
      : null;
  // 元になった自動作成文が変わったら（代替案の選択・設定の変更など）、編集内容は破棄する
  const activeDraft = draft && generatedReply !== null && draft.base === generatedReply ? draft : null;
  const replyText = activeDraft?.text ?? generatedReply;

  const showToast = useCallback((text: string, toastTone: ToastMessage["tone"] = "info") => {
    setToast({ id: Date.now(), text, tone: toastTone });
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  const copyReply = async (text: string | null) => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) showToast("コピーしました。LINEに戻って貼り付けてください");
    else showToast("コピーできませんでした。文章を長押ししてコピーしてください", "alert");
  };

  const restart = () => {
    setMessage("");
    setCandidates([]);
    setCalendarResult(null);
    setChosenAlternatives(null);
    setDraft(null);
    setNotice(null);
    setReferenceDate(todayIn(Date.now(), DEFAULT_SETTINGS.timeZone));
    goTo(1);
  };

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

  const activeProvider = (): CalendarProvider | null =>
    demo ? mockCalendar : connection?.connected ? googleCalendar : null;

  const check = async () => {
    const provider = activeProvider();
    if (!provider) {
      setSheetOpen(true);
      return;
    }
    await runCheck(provider, candidates, settings.timeZone);
    goTo(3);
  };

  const retry = () => {
    const provider = activeProvider();
    if (provider) void runCheck(provider, candidates, settings.timeZone);
    else setSheetOpen(true);
  };

  const connectGoogle = () => {
    if (!referenceDate) return;
    savePending({ referenceDate, candidates, settings });
    // API ルートへの通常の画面遷移（Google の同意画面へリダイレクトされる）
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/google/start");
  };

  const startDemo = async () => {
    setSheetOpen(false);
    setDemo(true);
    await runCheck(mockCalendar, candidates, settings.timeZone);
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
          <span className="mt-1 block text-[10px] tracking-[0.3em] text-gold-deep">SCHEDULE</span>
        </h1>
        <div className="flex w-20 items-center justify-end gap-2">
          <StepIndicator current={step} />
          <Link
            href="/settings"
            aria-label="設定"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-sub hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </Link>
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
              calendarKind={calendarKind}
              errorCode={calendarResult.status === "error" ? calendarResult.code : null}
              retrying={checking}
              onSettingsChange={setSettings}
              onRetry={retry}
              onReconnect={connectGoogle}
              tone={tone}
              onToneChange={setTone}
              replyText={replyText}
              selectedAlternatives={selectedAlternatives}
              onToggleAlternative={(id, start) =>
                setChosenAlternatives(toggleAlternative(selectedAlternatives, id, start))
              }
              onCopy={() => void copyReply(replyText)}
              onEditReply={() => goTo(4)}
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

        {step === 4 &&
          (replyText !== null && generatedReply !== null ? (
            <ReplyStep
              text={replyText}
              edited={activeDraft !== null && activeDraft.text !== generatedReply}
              tone={tone}
              onToneChange={(t) => {
                setTone(t);
                setDraft(null);
              }}
              onTextChange={(text) => setDraft({ base: generatedReply, text })}
              onReset={() => setDraft(null)}
              onCopy={() => void copyReply(replyText)}
              onRestart={restart}
            />
          ) : (
            <div className="animate-fade-in space-y-4">
              <p className="text-sm text-sub">返信文を作成するには、先に空き状況を確認してください。</p>
              <Button className="w-full" onClick={() => goTo(2)}>
                候補の確認に戻る
              </Button>
            </div>
          ))}
      </main>

      <Toast message={toast} onDone={hideToast} />

      <ConnectSheet
        open={sheetOpen}
        configured={connection?.configured ?? false}
        onConnect={connectGoogle}
        onDemo={startDemo}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
