"use client";

import { useState } from "react";
import { formatActiveHours } from "@/components/ActiveHoursControl";
import { ResultCard } from "@/components/result/ResultCard";
import { SettingsControls } from "@/components/SettingsControls";
import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/BottomBar";
import { Notice } from "@/components/ui/Notice";
import type { Candidate, CandidateEvaluation, Settings } from "@/lib/types";

export function ResultStep({
  candidates,
  evaluations,
  settings,
  calendarKind,
  fetchFailed,
  retrying,
  onSettingsChange,
  onRetry,
  onEditCandidates,
}: {
  candidates: Candidate[];
  evaluations: CandidateEvaluation[];
  settings: Settings;
  calendarKind: "mock" | "google";
  fetchFailed: boolean;
  retrying: boolean;
  onSettingsChange: (settings: Settings) => void;
  onRetry: () => void;
  onEditCandidates: () => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const availableCount = evaluations.filter((e) => e.status === "available").length;

  return (
    <section aria-labelledby="step3-title" className="animate-fade-in">
      <h2 id="step3-title" className="font-serif text-[22px] tracking-wide">
        {fetchFailed
          ? "空き状況を確認できませんでした"
          : availableCount > 0
            ? `${availableCount}件の候補に参加できます`
            : "参加できる候補はありませんでした"}
      </h2>

      {calendarKind === "mock" && (
        <p className="mt-2 inline-block rounded-full bg-gold-soft px-3 py-1 text-xs text-gold-deep">
          デモ用のダミーカレンダーで照合しています
        </p>
      )}

      {fetchFailed && (
        <div className="mt-4 space-y-3">
          <Notice tone="alert">
            予定を取得できなかったため、空き状況は表示していません。通信状況を確認して、もう一度お試しください。
          </Notice>
          <Button variant="secondary" className="w-full" onClick={onRetry} disabled={retrying}>
            {retrying ? "再試行しています…" : "もう一度試す"}
          </Button>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {evaluations.map((e) => {
          const candidate = byId.get(e.candidateId);
          return candidate ? (
            <ResultCard key={e.candidateId} candidate={candidate} evaluation={e} timeZone={settings.timeZone} />
          ) : null;
        })}
      </ul>

      <div className="mt-6 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            所要{settings.durationMinutes}分・前後の余裕
            {settings.bufferMinutes === 0 ? "なし" : `${settings.bufferMinutes}分`}
            <br />
            <span className="text-sub">提案する時間帯: {formatActiveHours(settings.activeHours)}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
            className="min-h-10 px-1 text-sm text-ink underline decoration-gold underline-offset-4"
          >
            {showSettings ? "閉じる" : "変更"}
          </button>
        </div>
        {showSettings && (
          <div className="mt-4 space-y-5">
            <SettingsControls settings={settings} onChange={onSettingsChange} />
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-sub">
        ※ Googleカレンダーで「予定なし」に設定した予定は、空いている時間として扱われます。
      </p>

      <BottomBar>
        <Button className="w-full" disabled>
          返信文を作成する（準備中）
        </Button>
        <Button variant="ghost" className="mt-1 w-full text-sm" onClick={onEditCandidates}>
          候補を修正する
        </Button>
      </BottomBar>
    </section>
  );
}
