import Image from "next/image";
import { siteConfig } from "@/config/site";
import { aboutContent, representativeProfile } from "@/content/about";
import { images } from "@/content/images";
import { PageHero } from "@/components/sections/PageHero";
import { CTASection } from "@/components/sections/CTASection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhotoPlaceholder, Pending } from "@/components/ui/PhotoPlaceholder";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About｜私たちについて",
  description:
    "企業の想いや目的を理解し、人々の記憶に残る体験へ。空間、音楽、演出、ホスピタリティを組み合わせ、企業と人、人と人の間に新しい価値を生み出すイベント・空間体験プロデュースです。",
  path: "/about",
});

export default function AboutPage() {
  const { operator, brand } = siteConfig;
  const profile = representativeProfile;

  const facts = [
    { label: "ブランド名", value: brand.name },
    { label: "事業内容", value: "企業イベントの企画・運営／ブランドイベント・体験プロデュース／施設向けイベント企画・活用支援" },
    { label: "事業形態", value: operator.businessType },
    { label: "屋号", value: operator.tradeName },
    { label: "代表者", value: operator.representative },
    { label: "所在地", value: operator.address },
    { label: "開業", value: operator.established },
  ].filter((row) => row.value !== null || row.label === "代表者" || row.label === "所在地");

  return (
    <>
      <PageHero eyebrow={aboutContent.eyebrow} title={aboutContent.title} lead={aboutContent.lead} />

      <section aria-label="私たちの考え方" className="bg-ivory pb-24 lg:pb-36">
        <div className="container-luxe grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <div className="relative aspect-[5/4] overflow-hidden">
              <Image src={images.table.src} alt={images.table.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 text-base leading-[2.3] lg:col-span-5 lg:col-start-8 lg:self-center">
            {aboutContent.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="values-title" className="section-y bg-white">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading id="values-title" eyebrow="Philosophy" title="What We Value" lead="体験を設計するうえで、大切にしていること。" />
          </Reveal>
          <ul className="mt-16 grid gap-12 md:grid-cols-3 lg:mt-24">
            {aboutContent.values.map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 0.1} className="border-t border-charcoal/20 pt-8">
                <p className="font-serif text-lg text-champagne-ink">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="display mt-3 text-4xl">{v.title}</h3>
                <p className="mt-2 text-sm tracking-[0.1em]">{v.label}</p>
                <p className="mt-5 text-[0.9375rem] leading-loose text-stone-ink">{v.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="profile-title" className="section-y bg-ivory">
        <div className="container-luxe grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            {profile.photo ? (
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={profile.photo.src} alt={profile.photo.alt} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
              </div>
            ) : (
              <PhotoPlaceholder className="aspect-[4/5]" label="Portrait" note="プロフィール写真準備中" />
            )}
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
            <SectionHeading id="profile-title" eyebrow="Profile" title="Founder" />
            <p className="mt-10 text-sm tracking-[0.18em] text-stone-ink uppercase">{profile.title}</p>
            <p className="mt-3 text-2xl tracking-[0.1em]">{profile.name ?? <Pending>代表者名 — 準備中</Pending>}</p>
            {profile.nameEn && <p className="mt-1 font-serif text-xl text-stone-ink">{profile.nameEn}</p>}
            <div className="mt-8 space-y-4 text-[0.9375rem] leading-loose text-charcoal/85">
              {profile.bio.length > 0 ? profile.bio.map((p) => <p key={p}>{p}</p>) : <p><Pending>プロフィールは準備中です。</Pending></p>}
            </div>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="overview-title" className="section-y bg-white">
        <div className="container-luxe grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionHeading id="overview-title" eyebrow="Overview" title="Information" lead="事業者情報" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <dl className="border-t border-charcoal/15">
              {facts.map((row) => (
                <div key={row.label} className="grid gap-2 border-b border-charcoal/15 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
                  <dt className="text-sm tracking-[0.08em] text-stone-ink">{row.label}</dt>
                  <dd className="text-[0.9375rem] leading-relaxed">{row.value ?? <Pending>準備中</Pending>}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
