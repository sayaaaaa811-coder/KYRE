import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/pages/PageShell";
import { OPERATOR, OPERATOR_INFO_FILLED } from "@/lib/legal/operator";

export const metadata: Metadata = { title: "利用規約 | KYRE Schedule" };

export default function TermsPage() {
  return (
    <PageShell title="利用規約">
      <div className="space-y-6 text-sm leading-relaxed">
        {!OPERATOR_INFO_FILLED && (
          <p className="rounded-xl bg-ivory p-4 text-sub">運営者情報の記入後に正式版として公開します。</p>
        )}
        <p>
          この利用規約（以下「本規約」）は、{OPERATOR.name}（以下「運営者」）が提供する KYRE
          Schedule（以下「本サービス」）の利用条件を定めるものです。利用者は、本規約に同意のうえ本サービスを利用するものとします。
        </p>

        <Section title="第1条（本サービスの内容）">
          <p>
            本サービスは、利用者が入力したメッセージから日程の候補を抽出し、利用者の Google
            カレンダーの空き状況と照合して、参加可能な日時・代替の時間・返信文の案を表示する無料の補助ツールです。
          </p>
        </Section>

        <Section title="第2条（利用者の責任）">
          <ul className="list-disc space-y-1 pl-5">
            <li>日時の抽出結果、空き状況の判定、返信文の内容は、利用者自身が確認したうえで利用してください。</li>
            <li>
              Google カレンダーで「予定なし」に設定された予定や、メインカレンダー以外の予定は、判定に反映されません。
            </li>
            <li>他人のメッセージを入力する場合は、その内容の取り扱いに配慮してください。</li>
          </ul>
        </Section>

        <Section title="第3条（禁止事項）">
          <ul className="list-disc space-y-1 pl-5">
            <li>法令または公序良俗に反する行為</li>
            <li>本サービスのサーバーやネットワークに過度な負荷をかける行為、不正アクセスまたはその試み</li>
            <li>本サービスの運営を妨害する行為</li>
          </ul>
        </Section>

        <Section title="第4条（免責）">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              運営者は、本サービスの判定結果の正確性・完全性を保証しません。判定結果の誤りや本サービスの停止によって利用者に生じた損害について、運営者の故意または重大な過失による場合を除き、責任を負いません。
            </li>
            <li>Google のサービスの仕様変更・障害により、本サービスの一部または全部が利用できない場合があります。</li>
          </ul>
        </Section>

        <Section title="第5条（サービスの変更・停止）">
          <p>運営者は、事前の通知なく本サービスの内容を変更し、または提供を停止・終了することがあります。</p>
        </Section>

        <Section title="第6条（個人情報）">
          <p>
            利用者の情報は、
            <Link href="/privacy" className="underline decoration-gold underline-offset-4">
              プライバシーポリシー
            </Link>
            に従って取り扱います。
          </p>
        </Section>

        <Section title="第7条（規約の変更）">
          <p>運営者は、必要に応じて本規約を変更できます。変更後の規約は本ページに掲載した時点から効力を生じます。</p>
        </Section>

        <Section title="第8条（準拠法）">
          <p>本規約は日本法に準拠します。</p>
        </Section>

        <p className="text-sub">
          制定日: {OPERATOR.effectiveDate}
          <br />
          お問い合わせ: {OPERATOR.contactEmail}
        </p>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-medium">{title}</h2>
      <div className="mt-2 text-ink/90">{children}</div>
    </section>
  );
}
