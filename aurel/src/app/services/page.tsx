import Image from "next/image";
import { images } from "@/content/images";
import { formatPrice, services } from "@/content/services";
import { process } from "@/content/home";
import { PageHero } from "@/components/sections/PageHero";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { CTASection } from "@/components/sections/CTASection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink, TextLink } from "@/components/ui/ButtonLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Services｜企業イベント・ブランドイベント・施設活用支援",
  description:
    "企業向けの社内イベント企画・運営、ブランドイベント・体験プロデュース、施設向けのイベント企画・活用支援。3つのサービスの内容と料金の目安をご紹介します。",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Our Services" lead="目的に合わせて選べる、3つのサービス。">
        <p className="leading-loose">
          社内イベントの企画・運営から、ブランドの世界観を伝える体験づくり、施設のイベント活用まで。
          人が集う時間を、目的に沿って設計し、当日の運営まで一貫して担います。
        </p>
      </PageHero>

      <nav aria-label="サービス一覧" className="border-y border-line bg-white">
        <ul className="container-luxe grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} className="group flex items-baseline gap-4 py-6 transition-colors hover:text-champagne-ink md:px-6 md:first:pl-0">
                <span className="font-serif text-lg text-champagne-ink">{s.number}</span>
                <span className="font-serif text-2xl">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {services.map((service, i) => {
        const image = images[service.image];
        const reverse = i % 2 === 1;
        return (
          <section
            key={service.slug}
            id={service.slug}
            aria-labelledby={`${service.slug}-title`}
            className={i % 2 === 0 ? "section-y bg-ivory" : "section-y bg-white"}
          >
            <div className="container-luxe grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className={reverse ? "lg:order-2 lg:col-span-6 lg:col-start-7" : "lg:col-span-6"}>
                <div className="group relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-[1.04]"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.1} className={reverse ? "lg:order-1 lg:col-span-5" : "lg:col-span-5 lg:col-start-8"}>
                <p className="font-serif text-xl text-champagne-ink">{service.number}</p>
                <SectionHeading id={`${service.slug}-title`} eyebrow={service.label} title={service.title} lead={service.subtitle} className="mt-4" />
                <div className="mt-8 space-y-4 text-[0.9375rem] leading-loose text-charcoal/85">
                  {service.description.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                <dl className="mt-10 border-t border-charcoal/15">
                  {service.plans.map((plan) => (
                    <div key={plan.id} className="flex items-baseline justify-between gap-4 border-b border-charcoal/15 py-4">
                      <dt className="font-serif text-xl">{plan.name}</dt>
                      <dd className="text-sm tracking-wider">{formatPrice(plan.price)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-stone-ink">表示料金は税別の目安です。</p>
                <div className="mt-10 flex flex-wrap items-center gap-8">
                  <ButtonLink href={`/services/${service.slug}`} variant="primary">
                    詳しく見る
                  </ButtonLink>
                  <TextLink href={`/contact?service=${service.slug}`}>Contact</TextLink>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section aria-labelledby="process-title" className="section-y bg-ivory">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading id="process-title" eyebrow="Process" title="How We Work" lead="どのサービスも、ご相談から振り返りまで一貫して伴走します。" />
          </Reveal>
          <div className="mt-16 lg:mt-24">
            <ProcessTimeline steps={process} />
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
