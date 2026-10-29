import { siteConfig } from "@/config/site";
import { PageHero } from "@/components/sections/PageHero";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy Policy｜プライバシーポリシー",
  description: "お問い合わせフォーム等で取得する個人情報の取り扱いについて定めたプライバシーポリシーです。",
  path: "/privacy",
});

/** 未設定の値は、公開前に設定が必要であることが分かる形で表示する */
function Field({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <span className="bg-sand px-1.5 text-stone-ink">［{label}：公開前に記載］</span>;
}

export default function PrivacyPage() {
  const { brand, operator, contact, privacy } = siteConfig;
  const operatorName = operator.tradeName ?? brand.name;

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: "1. 基本方針",
      body: (
        <p>
          {operatorName}（以下「当事業者」といいます）は、お客さまの個人情報を適切に取り扱うことが重要な責務であると考え、個人情報の保護に関する法律その他の関係法令を遵守し、以下のとおりプライバシーポリシーを定めます。
        </p>
      ),
    },
    {
      title: "2. 取得する個人情報",
      body: (
        <>
          <p>当事業者は、お問い合わせフォーム等を通じて、次の情報を取得します。</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>会社名、担当者名、メールアドレス、電話番号</li>
            <li>ご相談のサービス、開催予定日、開催エリア、参加予定人数、想定予算、ご相談内容</li>
            <li>送信日時、IPアドレス等の通信に関する情報（不正な送信の防止のため）</li>
          </ul>
        </>
      ),
    },
    {
      title: "3. 利用目的",
      body: (
        <ul className="list-disc space-y-1 pl-6">
          <li>お問い合わせへの回答、ご相談内容の確認のため</li>
          <li>お見積り、ご提案、契約の締結および履行のため</li>
          <li>サービスに関するご連絡のため</li>
          <li>不正な送信やスパムの防止、サービスの安全な運営のため</li>
        </ul>
      ),
    },
    {
      title: "4. 第三者提供",
      body: <p>当事業者は、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供しません。</p>,
    },
    {
      title: "5. 業務の委託",
      body: (
        <p>
          当事業者は、利用目的の達成に必要な範囲で、個人情報の取り扱いを外部に委託することがあります（例：メール送信サービス、Webサイトのホスティングサービス）。委託先には適切な管理を求めます。なお、委託先が海外の事業者である場合、個人情報が日本国外のサーバーで取り扱われることがあります。
        </p>
      ),
    },
    {
      title: "6. 安全管理措置",
      body: <p>当事業者は、個人情報の漏えい、滅失、毀損を防止するため、必要かつ適切な安全管理措置を講じます。</p>,
    },
    {
      title: "7. 開示・訂正・利用停止等",
      body: (
        <p>
          ご本人から個人情報の開示、訂正、追加、削除、利用停止等のご請求があった場合は、ご本人であることを確認したうえで、法令に従い速やかに対応します。下記のお問い合わせ窓口までご連絡ください。
        </p>
      ),
    },
    {
      title: "8. Cookie・アクセス解析",
      body: (
        <p>
          本サイトでは、現在アクセス解析ツールおよび広告目的の Cookie は使用していません。今後導入する場合は、本ポリシーを改定してお知らせします。
        </p>
      ),
    },
    {
      title: "9. お問い合わせ窓口",
      body: (
        <dl className="space-y-1">
          <div className="flex flex-wrap gap-x-3">
            <dt>事業者：</dt>
            <dd>
              {operatorName}（{operator.businessType}）
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt>代表者：</dt>
            <dd>
              <Field value={operator.representative} label="代表者名" />
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt>所在地：</dt>
            <dd>
              <Field value={operator.address} label="所在地" />
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt>連絡先：</dt>
            <dd>
              <Field value={contact.email} label="メールアドレス" />
            </dd>
          </div>
        </dl>
      ),
    },
    {
      title: "10. 改定",
      body: <p>当事業者は、法令の変更等に応じて本ポリシーを改定することがあります。改定後の内容は本ページに掲載した時点から効力を生じます。</p>,
    },
  ];

  return (
    <>
      <PageHero eyebrow="Privacy Policy" title="Privacy Policy" lead="プライバシーポリシー" />
      <section className="bg-white py-20 lg:py-28">
        <div className="container-luxe">
          <div className="mx-auto max-w-3xl space-y-14">
            {sections.map((s, i) => (
              <section key={s.title} aria-labelledby={`privacy-${i + 1}`}>
                <h2 id={`privacy-${i + 1}`} className="border-b border-charcoal/15 pb-4 text-lg font-medium tracking-[0.06em]">
                  {s.title}
                </h2>
                <div className="mt-6 space-y-4 text-[0.9375rem] leading-loose text-charcoal/85">{s.body}</div>
              </section>
            ))}
            <p className="border-t border-charcoal/15 pt-8 text-sm text-stone-ink">
              制定日：<Field value={privacy.enactedOn} label="制定日" />
              {privacy.updatedOn && <span className="ml-6">最終改定日：{privacy.updatedOn}</span>}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
