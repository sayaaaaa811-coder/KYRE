import Image from "next/image";
import { pastExperienceNote, workDetailLabels, works, type Work } from "@/content/works";
import { PageHero } from "@/components/sections/PageHero";
import { CTASection } from "@/components/sections/CTASection";
import { PhotoPlaceholder, Pending } from "@/components/ui/PhotoPlaceholder";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Works｜これまでの活動経験",
  description: "代表者がこれまでに手がけてきたイベントの活動経験をご紹介します。100名規模、400名規模のイベントの主催・開催経験があります。",
  path: "/works",
});

function WorkEntry({ work }: { work: Work }) {
  const details = Object.entries(work.details) as [keyof Work["details"], string | null][];
  return (
    <article aria-labelledby={`${work.id}-title`} className="grid gap-12 border-t border-charcoal/15 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
      <Reveal className="min-w-0 lg:col-span-5">
        <p className="eyebrow text-champagne-ink">{work.label}</p>
        <p className="mt-6 flex items-baseline gap-3" aria-hidden>
          <span className="font-serif text-[6rem] leading-[0.85] tracking-tight sm:text-[9rem]">{work.scale.figure}</span>
          <span className="text-lg tracking-[0.1em]">{work.scale.unit}</span>
        </p>
        <h2 id={`${work.id}-title`} className="mt-10 text-xl font-normal tracking-[0.06em] sm:text-2xl">
          {work.title}
        </h2>
        <p className="mt-3 text-base text-stone-ink">{work.summary}</p>
        {work.kind === "past-experience" && (
          <p className="mt-6 inline-block border border-line px-3 py-1.5 text-xs tracking-wider text-stone-ink">代表者の過去の活動経験</p>
        )}

        <dl className="mt-10 border-t border-line">
          {details.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4 text-[0.9375rem]">
              <dt className="text-stone-ink">{workDetailLabels[key]}</dt>
              <dd>{value ?? <Pending>詳細は準備中です</Pending>}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal delay={0.1} className="min-w-0 lg:col-span-7">
        {work.photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {work.photos.map((photo, i) => (
              <figure key={photo.src} className={i === 0 ? "sm:col-span-2" : undefined}>
                <div className="relative aspect-[3/2] overflow-hidden bg-sand">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                </div>
                {photo.credit && <figcaption className="mt-2 text-xs text-stone-ink">{photo.credit}</figcaption>}
              </figure>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoPlaceholder className="aspect-[3/2] sm:col-span-2" />
            <PhotoPlaceholder className="aspect-[4/3]" />
            <PhotoPlaceholder className="aspect-[4/3]" />
          </div>
        )}
      </Reveal>
    </article>
  );
}

export default function WorksPage() {
  return (
    <>
      <PageHero eyebrow="Works" title="Experience" lead="これまでに手がけてきたイベント。">
        <p className="leading-loose">{pastExperienceNote}</p>
      </PageHero>

      <section aria-label="活動経験の一覧" className="bg-ivory pb-24 lg:pb-36">
        <div className="container-luxe">
          {works.map((work) => (
            <WorkEntry key={work.id} work={work} />
          ))}
          <p className="border-t border-charcoal/15 pt-10 text-sm leading-loose text-stone-ink">
            写真・会場・担当範囲などの詳細は、掲載の準備が整い次第公開します。
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
