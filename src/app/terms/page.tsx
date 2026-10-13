import type { Metadata } from "next";
import { PageShell } from "@/components/pages/PageShell";

export const metadata: Metadata = { title: "利用規約 | KYRE Schedule" };

// 草案（Phase 5 で正式版に更新し、公開前に専門家の確認を推奨）
export default function TermsPage() {
  return (
    <PageShell title="利用規約（草案）">
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="rounded-xl bg-ivory p-4 text-sub">この文書は草案です。正式公開前に内容を確定します。</p>
        <p>
          KYRE
          Schedule（以下「本サービス」）は、メッセージに含まれる日程候補とカレンダーの空き状況を照合する補助ツールです。
        </p>
        <p>
          日時の抽出結果や空き状況の判定は、必ずご自身で確認してからご利用ください。判定結果の誤りにより生じた損害について、本サービスは責任を負いかねます。
        </p>
        <p>本サービスは予告なく内容の変更・停止を行う場合があります。</p>
      </div>
    </PageShell>
  );
}
