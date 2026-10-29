import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getMailConfig } from "@/lib/mail";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/sections/PageHero";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contact｜お問い合わせ・お見積り",
  description:
    "企業イベント、社内パーティー、周年イベント、ブランドイベントの企画・制作、施設のイベント活用に関するご相談・お見積りのご依頼はこちらから。検討段階のご相談も承ります。",
  path: "/contact",
});

const steps = [
  { title: "お問い合わせ", description: "フォームからご相談内容をお送りください。" },
  { title: "ご連絡", description: "内容を確認のうえ、担当者よりメールでご連絡します。" },
  { title: "ヒアリング", description: "オンラインまたは対面で、詳しいご要望を伺います。" },
  { title: "ご提案・お見積り", description: "内容に沿ったご提案とお見積りをお送りします。" },
];

export default function ContactPage() {
  const configured = getMailConfig() !== null;
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's Talk." lead="無料相談・お見積りのご依頼">
        <p className="leading-loose">
          イベントの企画・運営、ブランド体験のプロデュース、施設のイベント活用について、お気軽にご相談ください。
          開催時期やご予算が決まっていない段階でも構いません。
        </p>
      </PageHero>

      <section aria-label="お問い合わせフォーム" className="bg-ivory pb-24 lg:pb-36">
        <div className="container-luxe grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="eyebrow text-champagne-ink">After Your Inquiry</h2>
              <ol className="mt-8 space-y-8">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-5">
                    <span aria-hidden className="font-serif text-xl text-champagne-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-medium tracking-[0.06em]">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-stone-ink">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-12 border-t border-charcoal/15 pt-8 text-sm leading-loose text-stone-ink">
                ご相談・お見積りは無料です。ご提案内容にご納得いただいてからのご依頼となりますので、比較検討中の段階でもお気軽にお問い合わせください。
              </p>
              {siteConfig.contact.email && (
                <p className="mt-6 text-sm">
                  Email：
                  <a href={`mailto:${siteConfig.contact.email}`} className="underline underline-offset-4">
                    {siteConfig.contact.email}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <Suspense fallback={<div className="min-h-[60rem] border border-line bg-white" />}>
              <ContactForm configured={configured} fallbackEmail={siteConfig.contact.email} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}
