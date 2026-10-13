"use client";

import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/BottomBar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TONE_LABELS, type Tone } from "@/lib/reply";

export function ReplyStep({
  text,
  edited,
  tone,
  onToneChange,
  onTextChange,
  onReset,
  onCopy,
  onRestart,
}: {
  text: string;
  edited: boolean;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  onTextChange: (text: string) => void;
  onReset: () => void;
  onCopy: () => void;
  onRestart: () => void;
}) {
  return (
    <section aria-labelledby="step4-title" className="animate-fade-in">
      <h2 id="step4-title" className="font-serif text-[22px] tracking-wide">
        返信文を確認してください
      </h2>
      <p className="mt-1 text-sm text-sub">自由に書き換えてからコピーできます。</p>

      <div className="mt-5">
        <SegmentedControl
          label="文体"
          options={["casual", "polite"] as const}
          value={tone}
          onChange={onToneChange}
          format={(t) => TONE_LABELS[t]}
        />
        {edited && <p className="mt-2 text-xs text-sub">文体を切り替えると、編集した内容は元に戻ります。</p>}
      </div>

      <label htmlFor="reply" className="sr-only">
        返信文
      </label>
      <textarea
        id="reply"
        value={text}
        onChange={(e) => onTextChange(e.target.value.slice(0, 2000))}
        rows={9}
        className="mt-4 block w-full resize-none rounded-2xl border border-line bg-ivory p-4 text-base leading-relaxed focus:border-gold focus:outline-none"
      />
      {edited && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 min-h-10 text-sm text-ink underline decoration-gold underline-offset-4"
        >
          自動作成の文に戻す
        </button>
      )}

      <BottomBar>
        <Button className="w-full" onClick={onCopy} disabled={text.trim().length === 0}>
          コピーする
        </Button>
        <Button variant="ghost" className="mt-1 w-full text-sm" onClick={onRestart}>
          最初からやり直す
        </Button>
      </BottomBar>
    </section>
  );
}
