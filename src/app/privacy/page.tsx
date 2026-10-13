import type { Metadata } from "next";
import { PageShell } from "@/components/pages/PageShell";

export const metadata: Metadata = { title: "プライバシーポリシー | KYRE Schedule" };

// 草案（Phase 5 で正式版に更新し、公開前に専門家の確認を推奨）
export default function PrivacyPage() {
  return (
    <PageShell title="プライバシーポリシー（草案）">
      <div className="space-y-6 text-sm leading-relaxed">
        <Notice />
        <Section title="1. 取得する情報">
          <p>
            Google カレンダーと連携した場合、ご利用の Google
            アカウントのメインカレンダーについて、指定された日の「予定がある時間帯（開始・終了時刻）」のみを取得します。予定の件名・場所・参加者・説明などは取得しません。メールアドレス等のアカウント情報も取得しません。
          </p>
        </Section>
        <Section title="2. 取得しない情報">
          <p>
            貼り付けたメッセージの本文は、ご利用の端末（ブラウザ）内だけで処理し、当サービスのサーバーや第三者に送信・保存しません。
          </p>
        </Section>
        <Section title="3. 利用目的">
          <p>取得した予定の時間帯は、候補日時に参加できるかの判定と代替時間の提案にのみ使用します。</p>
        </Section>
        <Section title="4. 保存期間">
          <p>
            予定の時間帯はサーバーに保存しません。Google との連携情報（アクセストークン）は暗号化してご利用のブラウザの
            Cookie に保存し、約1時間で失効します。設定画面からいつでも連携を解除できます。
          </p>
        </Section>
        <Section title="5. Google API の利用について">
          <p>
            当サービスによる Google API から受け取った情報の利用および他アプリへの転送は、Google API Services User Data
            Policy（Limited Use の要件を含む）に従います。
          </p>
        </Section>
        <Section title="6. お問い合わせ">
          <p>（公開前に連絡先を記載します）</p>
        </Section>
      </div>
    </PageShell>
  );
}

function Notice() {
  return <p className="rounded-xl bg-ivory p-4 text-sub">この文書は草案です。正式公開前に内容を確定します。</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-medium">{title}</h2>
      <div className="mt-2 text-ink/90">{children}</div>
    </section>
  );
}
