"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

/** Google 連携の案内（画面下からのシート） */
export function ConnectSheet({
  open,
  configured,
  onConnect,
  onDemo,
  onClose,
}: {
  open: boolean;
  configured: boolean;
  onConnect: () => void;
  onDemo: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="connect-title"
      className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-3xl bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <h2 id="connect-title" className="font-serif text-xl tracking-wide">
          Googleカレンダーと連携
        </h2>
        {configured ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-sub">
              空き状況の確認には、Googleカレンダーとの連携が必要です。
            </p>
            <ul className="mt-4 space-y-2 rounded-xl bg-ivory p-4 text-sm leading-relaxed">
              <li>・取得するのは「予定がある時間帯」だけです</li>
              <li>・予定の件名・場所・参加者は取得しません</li>
              <li>・連携は約1時間で自動的に切れます。いつでも解除できます</li>
            </ul>
            <Button className="mt-6 w-full" onClick={onConnect}>
              Googleで連携する
            </Button>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-sub">
            現在、Googleカレンダー連携は準備中です。デモ用のカレンダーでお試しいただけます。
          </p>
        )}
        <Button variant={configured ? "ghost" : "primary"} className="mt-2 w-full" onClick={onDemo}>
          デモ用のカレンダーで試す
        </Button>
        <Button variant="ghost" className="w-full text-sm" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </dialog>
  );
}
