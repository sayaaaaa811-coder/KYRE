"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/BottomBar";
import { MAX_MESSAGE_LENGTH } from "@/lib/parser";
import { formatDateJa, isValidIsoDate } from "@/lib/time";
import type { IsoDate } from "@/lib/types";

export function MessageInputStep({
  message,
  onMessageChange,
  referenceDate,
  onReferenceDateChange,
  onExtract,
  onManual,
}: {
  message: string;
  onMessageChange: (text: string) => void;
  referenceDate: IsoDate | null;
  onReferenceDateChange: (date: IsoDate) => void;
  onExtract: () => void;
  onManual: () => void;
}) {
  const [canReadClipboard, setCanReadClipboard] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);
  const [editingReference, setEditingReference] = useState(false);

  useEffect(() => {
    // ブラウザ機能の有無はマウント後にしか判定できない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanReadClipboard(typeof navigator !== "undefined" && !!navigator.clipboard?.readText);
  }, []);

  const pasteFromClipboard = async () => {
    setClipboardError(false);
    try {
      const text = await navigator.clipboard.readText();
      onMessageChange(text.slice(0, MAX_MESSAGE_LENGTH));
    } catch {
      setClipboardError(true);
    }
  };

  const length = message.length;
  const empty = message.trim().length === 0;

  return (
    <section aria-labelledby="step1-title" className="animate-fade-in">
      <h2 id="step1-title" className="font-serif text-[22px] leading-snug tracking-wide">
        届いた日程のメッセージを
        <br />
        貼り付けてください
      </h2>

      <label htmlFor="message" className="sr-only">
        メッセージ
      </label>
      <textarea
        id="message"
        value={message}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(e) => onMessageChange(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
        rows={7}
        placeholder={"例）来週どこか飲みに行こう！\n10/20(火)か21(水)の19時〜どう？"}
        className="mt-5 block w-full resize-none rounded-2xl border border-line bg-ivory p-4 text-base leading-relaxed placeholder:text-sub/60 focus:border-gold focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-sub">
        {canReadClipboard ? (
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="min-h-10 rounded-lg border border-line px-3 text-ink hover:border-gold"
          >
            クリップボードから貼り付け
          </button>
        ) : (
          <span />
        )}
        <span aria-live="polite">
          {length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
        </span>
      </div>
      {clipboardError && (
        <p className="mt-2 text-xs text-alert" role="alert">
          クリップボードを読み取れませんでした。入力欄を長押しして貼り付けてください。
        </p>
      )}
      {length >= MAX_MESSAGE_LENGTH && (
        <p className="mt-2 text-xs text-alert" role="alert">
          {MAX_MESSAGE_LENGTH.toLocaleString()} 文字までです。日程に関係する部分だけを貼り付けてください。
        </p>
      )}

      <div className="mt-5 flex items-center justify-between rounded-xl border border-line px-4 py-2 text-sm">
        <span className="text-sub">基準日（「明日」などの起点）</span>
        {editingReference ? (
          <input
            type="date"
            aria-label="基準日"
            value={referenceDate ?? ""}
            onChange={(e) => isValidIsoDate(e.target.value) && onReferenceDateChange(e.target.value)}
            onBlur={() => setEditingReference(false)}
            autoFocus
            className="min-h-10 rounded-lg border border-line bg-ivory px-2 text-base"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingReference(true)}
            className="min-h-10 px-1 font-medium text-ink underline decoration-gold underline-offset-4"
          >
            {referenceDate ? formatDateJa(referenceDate) : "—"} 変更
          </button>
        )}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-sub">
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gold" aria-hidden="true">
          <path
            d="M7 10V8a5 5 0 0110 0v2m-11 0h12v10H6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        メッセージは端末内だけで処理され、サーバーには送信されません。
      </p>

      <BottomBar>
        <Button className="w-full" disabled={empty || !referenceDate} onClick={onExtract}>
          候補を抽出する
        </Button>
        <Button variant="ghost" className="mt-1 w-full text-sm" onClick={onManual} disabled={!referenceDate}>
          日時を手動で入力する
        </Button>
      </BottomBar>
    </section>
  );
}
