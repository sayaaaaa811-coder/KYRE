import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { images } from "@/content/images";
import { getService, services } from "@/content/services";
import { PageHero } from "@/components/sections/PageHero";
import { Breadcrumb } from "@/components/sections/Breadcrumb";
import { PricingSection } from "@/components/sections/PricingSection";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { FAQ } from "@/components/sections/FAQ";
import { CTASection } from "@/components/sections/CTASection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({ ...service.seo, path: `/services/${service.slug}` });
}

export default async function ServiceDetailPage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) notFound();

  const image = images[service.image];
  const others = services.filter((s) => s.slug !== service.slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHero
        image={image}
        eyebrow={`${service.number} — ${service.label}`}
        title={service.title}
        lead={service.subtitle}
        breadcrumb={
          <Breadcrumb
            tone="light"
            items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: service.title }]}
          />
        }
      >
        <div className="flex flex-wrap gap-4 pt-4">
          <ButtonLink href={`/contact?service=${service.slug}`} variant="light">
            お問い合わせ・お見積り
          </ButtonLink>
          <ButtonLink href="#pricing" variant="outline-light" arrow={false}>
            料金を見る
          </ButtonLink>
        </div>
      </PageHero>

      {/* Overview & Concept */}
      <section aria-labelledby="concept-title" className="section-y bg-ivory">
        <div className="container-luxe grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow flex items-center gap-4 text-champagne-ink">
              <span aria-hidden className="h-px w-8 bg-champagne-ink" />
              Concept
            </p>
            <h2 id="concept-title" className="mt-6 text-[1.75rem] leading-[1.6] font-light tracking-[0.06em] sm:text-[2rem]">
              {service.concept.heading}
            </h2>
            <div className="mt-8 space-y-4 text-[0.9375rem] leading-loose text-charcoal/85">
              {service.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 text-[0.9375rem] leading-[2.2] text-stone-ink lg:col-span-6 lg:col-start-7 lg:pt-14">
            {service.concept.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Scope */}
      <section aria-labelledby="scope-title" className="section-y bg-white">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading id="scope-title" eyebrow="Scope" title="What We Offer" lead="対応可能なイベント・業務" />
          </Reveal>
          <div className="mt-16 grid gap-12 md:grid-cols-2 lg:gap-20">
            {service.scope.map((group, gi) => (
              <Reveal key={group.title} delay={gi * 0.1}>
                <h3 className="border-b border-charcoal/20 pb-4 text-lg font-medium tracking-[0.08em]">{group.title}</h3>
                <ul className="mt-2">
                  {group.items.map((item, i) => (
                    <li key={item} className="flex items-baseline gap-5 border-b border-line py-4 text-[0.9375rem]">
                      <span aria-hidden className="w-6 font-serif text-base text-champagne-ink">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PricingSection service={service} />

      {/* Flow */}
      <section aria-labelledby="flow-title" className="on-dark section-y bg-charcoal text-ivory">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading id="flow-title" eyebrow="Flow" title="Service Flow" lead="ご相談から開催後まで、サービスの流れ" tone="light" />
          </Reveal>
          <div className="mt-16 lg:mt-24">
            <ProcessTimeline steps={service.flow} tone="dark" titleStyle="ja" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="section-y bg-ivory">
        <div className="container-luxe grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions" lead="よくあるご質問" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <FAQ items={service.faqs} />
          </Reveal>
        </div>
      </section>

      {/* Other services */}
      <section aria-labelledby="other-title" className="bg-white py-20 lg:py-28">
        <div className="container-luxe">
          <h2 id="other-title" className="eyebrow text-champagne-ink">
            Other Services
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {others.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="group relative flex items-center gap-6 overflow-hidden border border-line p-4 transition-colors hover:border-charcoal/40 sm:p-5">
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden sm:w-32">
                    <Image src={images[s.image].src} alt="" fill sizes="128px" className="object-cover transition-transform duration-[1.2s] ease-(--ease-luxe) group-hover:scale-105" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs tracking-[0.12em] text-stone-ink">{s.label}</p>
                    <p className="mt-1 font-serif text-2xl sm:text-3xl">{s.title}</p>
                  </div>
                  <ArrowRight aria-hidden className="mr-2 size-5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.25} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection
        title="Let's Create Something Memorable."
        lead={`${service.label}のご相談はこちら。`}
        body="検討段階のご相談やお見積りのご依頼も承ります。開催時期やご予算が決まっていなくても、お気軽にお問い合わせください。"
        label="無料相談・お見積りはこちら"
        href={`/contact?service=${service.slug}`}
      />
    </>
  );
}
