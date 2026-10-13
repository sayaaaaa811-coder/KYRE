import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageShell } from "@/components/pages/PageShell";
import { OPERATOR, OPERATOR_INFO_FILLED } from "@/lib/legal/operator";

export const metadata: Metadata = { title: "プライバシーポリシー | KYRE Schedule" };

export default function PrivacyPage() {
  return (
    <PageShell title="プライバシーポリシー">
      <div className="space-y-6 text-sm leading-relaxed">
        {!OPERATOR_INFO_FILLED && (
          <p className="rounded-xl bg-ivory p-4 text-sub">運営者情報の記入後に正式版として公開します。</p>
        )}
        <p>
          {OPERATOR.name}（以下「運営者」）は、KYRE
          Schedule（以下「本サービス」）における利用者の情報の取り扱いについて、以下のとおり定めます。
        </p>

        <Section title="1. 取得する情報">
          <p>本サービスは、利用者が Google カレンダーと連携した場合に限り、次の情報を Google から取得します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              利用者が確認を求めた日について、Google
              アカウントのメインカレンダーで「予定あり」となっている時間帯（開始時刻と終了時刻）
            </li>
          </ul>
          <p className="mt-2">
            予定の件名・場所・参加者・説明、メールアドレス、氏名などのアカウント情報は取得しません。本サービスが Google
            に求める権限は、空き時間情報の表示（calendar.freebusy）のみです。
          </p>
        </Section>

        <Section title="2. 取得・送信しない情報">
          <p>
            利用者が貼り付けたメッセージの本文、作成された返信文は、利用者の端末（ブラウザ）内だけで処理し、運営者のサーバーや第三者に送信・保存しません。
          </p>
        </Section>

        <Section title="3. 利用目的">
          <p>
            取得した予定の時間帯は、利用者が入力した候補日時に参加できるかの判定、代替となる時間の提案、および返信文の作成のためにのみ利用します。広告、分析、AI
            の学習その他の目的には利用しません。
          </p>
        </Section>

        <Section title="4. 保存と削除">
          <ul className="list-disc space-y-1 pl-5">
            <li>予定の時間帯は運営者のサーバーに保存せず、判定後は利用者の端末の画面上にのみ保持されます。</li>
            <li>
              Google との連携に必要なアクセストークンは、暗号化したうえで利用者のブラウザの Cookie
              に保存し、約1時間で自動的に失効します。運営者はデータベースを使用しておらず、トークンを保管しません。
            </li>
            <li>
              Google
              連携の画面に移動する間だけ、入力した候補日時（メッセージ本文は含みません）をブラウザの一時領域（sessionStorage）に保存し、戻った直後に削除します。
            </li>
            <li>
              設定画面の「連携を解除する」から、いつでも Google 側のアクセス権を取り消し、Cookie を削除できます。Google
              アカウントの「サードパーティ接続」からも取り消せます。
            </li>
          </ul>
        </Section>

        <Section title="5. 第三者提供・外部送信">
          <p>
            運営者は、法令に基づく場合を除き、取得した情報を第三者に提供しません。本サービスは広告・アクセス解析ツールを使用していません。本サービスの運用のため、サーバーの提供事業者（ホスティング事業者）のシステム上でプログラムが動作しますが、予定の時間帯やアクセストークンを記録するものではありません。
          </p>
        </Section>

        <Section title="6. ログ">
          <p>
            障害対応と不正利用防止のため、サーバーでは通信の結果（成功・失敗の種別、処理時間など）と、接続元の IP
            アドレスに基づく利用回数を一時的に扱います。メッセージ本文、予定の時間帯、アクセストークンはログに記録しません。
          </p>
        </Section>

        <Section title="7. 安全管理">
          <p>
            通信の暗号化（HTTPS）、アクセストークンの暗号化、必要最小限の権限、不正なリクエストの遮断などの措置を講じています。
          </p>
        </Section>

        <Section title="8. Google API Services User Data Policy の遵守">
          <p>
            本サービスによる Google API から受け取った情報の利用および他のアプリへの転送は、Limited Use の要件を含む
            Google API Services User Data Policy に従います。
          </p>
          <p className="mt-2 text-xs text-sub" lang="en">
            KYRE Schedule&apos;s use and transfer to any other app of information received from Google APIs will adhere
            to the Google API Services User Data Policy, including the Limited Use requirements.
          </p>
        </Section>

        <Section title="9. お問い合わせ・開示等のご請求">
          <p>
            本ポリシーに関するお問い合わせ、個人情報の開示・訂正・利用停止等のご請求は、次の窓口までご連絡ください。なお、運営者は利用者の個人情報を保有しないため、多くの場合、開示の対象となる情報はありません。
          </p>
          <p className="mt-2">窓口: {OPERATOR.contactEmail}</p>
        </Section>

        <Section title="10. 改定">
          <p>本ポリシーを改定する場合は、本ページで告知します。</p>
          <p className="mt-2 text-sub">制定日: {OPERATOR.effectiveDate}</p>
        </Section>
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
