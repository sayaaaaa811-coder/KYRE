import Link from "next/link";
import type { ReactNode } from "react";

/** 補助ページ（設定・ポリシー）の共通レイアウト */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="flex h-16 items-center justify-between">
        <Link href="/" className="-ml-2 flex min-h-11 items-center gap-1 px-2 text-sm text-sub hover:text-ink">
          <span aria-hidden="true">‹</span> トップへ
        </Link>
        <p className="text-center leading-none">
          <span className="block font-serif text-lg tracking-[0.35em] text-ink">KYRE</span>
          <span className="mt-1 block text-[10px] tracking-[0.3em] text-gold-deep">SCHEDULE</span>
        </p>
        <span className="w-20" />
      </header>
      <main className="flex-1 pt-4 pb-12">
        <h1 className="font-serif text-[22px] tracking-wide">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
