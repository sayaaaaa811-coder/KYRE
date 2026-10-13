"use client";

import { CandidateCard } from "@/components/candidate/CandidateCard";
import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/BottomBar";
import { Notice } from "@/components/ui/Notice";
import { SettingsControls } from "@/components/SettingsControls";
import { MAX_CANDIDATES } from "@/lib/parser";
import { isValidIsoDate, isValidTimeOfDay } from "@/lib/time";
import type { Candidate, Settings } from "@/lib/types";

export function CandidateReviewStep({
  candidates,
  notice,
  settings,
  checking,
  onCandidateChange,
  onCandidateRemove,
  onCandidateAdd,
  onSettingsChange,
  onCheck,
}: {
  candidates: Candidate[];
  notice: string | null;
  settings: Settings;
  checking: boolean;
  onCandidateChange: (candidate: Candidate) => void;
  onCandidateRemove: (id: string) => void;
  onCandidateAdd: () => void;
  onSettingsChange: (settings: Settings) => void;
  onCheck: () => void;
}) {
  const unresolved = candidates.filter((c) => c.ambiguities.length > 0).length;
  const invalid = candidates.some((c) => !isValidIsoDate(c.date) || !isValidTimeOfDay(c.startTime));
  const canCheck = candidates.length > 0 && unresolved === 0 && !invalid && !checking;

  return (
    <section aria-labelledby="step2-title" className="animate-fade-in">
      <h2 id="step2-title" className="font-serif text-[22px] tracking-wide">
        {candidates.length > 0 ? `${candidates.length}件の候補` : "候補を追加してください"}
      </h2>
      <p className="mt-1 text-sm text-sub">日時が正しいか確認してください。</p>

      {notice && (
        <div className="mt-4">
          <Notice>{notice}</Notice>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {candidates.map((c, i) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            index={i}
            onChange={onCandidateChange}
            onRemove={() => onCandidateRemove(c.id)}
          />
        ))}
      </ul>

      {candidates.length < MAX_CANDIDATES && (
        <button
          type="button"
          onClick={onCandidateAdd}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/60 text-sm text-gold-deep hover:bg-gold-soft"
        >
          ＋ 候補を追加
        </button>
      )}

      <div className="mt-8 space-y-5">
        <SettingsControls settings={settings} onChange={onSettingsChange} />
      </div>

      <BottomBar>
        {unresolved > 0 && (
          <p className="mb-2 text-center text-xs text-gold-deep" role="status">
            要確認の候補が {unresolved} 件あります
          </p>
        )}
        <Button className="w-full" disabled={!canCheck} onClick={onCheck} aria-busy={checking}>
          {checking ? "照合しています…" : "空き状況を確認する"}
        </Button>
      </BottomBar>
    </section>
  );
}
