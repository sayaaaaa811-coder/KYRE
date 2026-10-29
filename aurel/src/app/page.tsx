import Image from "next/image";
import { siteConfig } from "@/config/site";
import { homeContent, process } from "@/content/home";
import { images } from "@/content/images";
import { services } from "@/content/services";
import { pastExperienceNote, works } from "@/content/works";
import { Hero } from "@/components/sections/Hero";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { ExperienceCard } from "@/components/sections/ExperienceCard";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { CTASection } from "@/components/sections/CTASection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/ButtonLink";

export default function HomePage() {
  const { introduction, services: servicesCopy, experience, process: processCopy } = homeContent;
  const pastExperiences = works.filter((w) => w.kind === "past-experience");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.brand.name,
    description: siteConfig.brand.description,
    url: siteConfig.url,
    areaServed: "JP",
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // 構造化データ（サイト内で管理する固定値のみ）
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />

      {/* Introduction */}
      <section aria-labelledby="intro-title" className="section-y bg-ivory">
        <div className="container-luxe grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6 lg:pt-6">
            <Reveal>
              <SectionHeading id="intro-title" eyebrow={introduction.eyebrow} title={introduction.title} lead={introduction.lead} />
            </Reveal>
            <Reveal delay={0.1} className="mt-12 max-w-xl space-y-5 text-[0.9375rem] leading-[2.2] text-charcoal/85 sm:text-base">
              {introduction.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </Reveal>
            <Reveal delay={0.2} className="mt-12">
              <TextLink href="/about">About Us</TextLink>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src={images.intro.src} alt={images.intro.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services Preview */}
      <section aria-labelledby="services-title" className="section-y bg-white">
        <div className="container-luxe">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <SectionHeading id="services-title" eyebrow={servicesCopy.eyebrow} title={servicesCopy.title} lead={servicesCopy.lead} />
            </Reveal>
            <Reveal delay={0.1}>
              <TextLink href="/services">All Services</TextLink>
            </Reveal>
          </div>
          <ul className="mt-16 grid gap-16 md:grid-cols-3 md:gap-8 lg:mt-24 lg:gap-12">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={i * 0.1}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Experience */}
      <section aria-labelledby="experience-title" className="section-y bg-ivory">
        <div className="container-luxe grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionHeading id="experience-title" eyebrow={experience.eyebrow} title={experience.title} lead={experience.lead} />
            <p className="mt-8 text-sm leading-loose text-stone-ink">{pastExperienceNote}</p>
            <div className="mt-10">
              <TextLink href="/works">View Works</TextLink>
            </div>
          </Reveal>
          <div className="grid gap-14 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {pastExperiences.map((work, i) => (
              <Reveal key={work.id} delay={i * 0.1}>
                <ExperienceCard work={work} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section aria-labelledby="process-title" className="section-y bg-white">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading id="process-title" eyebrow={processCopy.eyebrow} title={processCopy.title} lead={processCopy.lead} />
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
