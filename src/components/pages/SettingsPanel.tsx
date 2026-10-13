"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { disconnectGoogle, fetchConnectionStatus, type ConnectionStatus } from "@/lib/session-client";

export function SettingsPanel() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"done" | "partial" | null>(null);

  useEffect(() => {
    void fetchConnectionStatus().then(setStatus);
  }, []);

  const disconnect = async () => {
    setBusy(true);
    const ok = await disconnectGoogle();
    setStatus(await fetchConnectionStatus());
    setResult(ok ? "done" : "partial");
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line p-5" aria-labelledby="google-title">
        <h2 id="google-title" className="text-sm font-medium tracking-wider text-sub">
          Googleカレンダー連携
        </h2>
        <p className="mt-2 text-lg" role="status">
          {status === null
            ? "確認しています…"
            : !status.configured
              ? "準備中（デモのみ利用できます）"
              : status.connected
                ? "連携しています"
                : "連携していません"}
        </p>
        {status?.connected && (
          <Button variant="secondary" className="mt-4 w-full" onClick={disconnect} disabled={busy}>
            {busy ? "解除しています…" : "連携を解除する"}
          </Button>
        )}
        {result === "done" && (
          <div className="mt-4">
            <Notice>連携を解除しました。KYRE からはカレンダーにアクセスできなくなりました。</Notice>
          </div>
        )}
        {result === "partial" && (
          <div className="mt-4">
            <Notice tone="alert">
              この端末の連携情報は削除しましたが、Google 側での解除を確認できませんでした。下のリンクから KYRE
              のアクセス権を削除してください。
            </Notice>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-sub">
          Google アカウント側からもアクセス権を確認・削除できます：
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-ink underline decoration-gold underline-offset-4"
          >
            Google アカウントの「サードパーティ接続」
          </a>
        </p>
      </section>

      <section className="rounded-2xl border border-line p-5 text-sm leading-relaxed">
        <h2 className="text-sm font-medium tracking-wider text-sub">データの取り扱い</h2>
        <ul className="mt-3 space-y-2">
          <li>・貼り付けたメッセージは端末内だけで処理し、保存・送信しません</li>
          <li>・カレンダーからは「予定がある時間帯」だけを取得し、保存しません</li>
          <li>・連携は約1時間で自動的に切れます</li>
        </ul>
        <div className="mt-4 flex gap-4">
          <Link href="/privacy" className="underline decoration-gold underline-offset-4">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="underline decoration-gold underline-offset-4">
            利用規約
          </Link>
        </div>
      </section>
    </div>
  );
}
