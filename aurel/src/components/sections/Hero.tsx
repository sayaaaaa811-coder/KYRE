import Image from "next/image";
import { homeContent } from "@/content/home";
import { images } from "@/content/images";
import { ButtonLink } from "@/components/ui/ButtonLink";

/** トップページのヒーロー（画面幅いっぱいの写真＋コピー） */
export function Hero() {
  const { hero } = homeContent;
  return (
    <section aria-labelledby="hero-title" className="on-dark relative flex min-h-[100svh] items-end overflow-hidden bg-charcoal text-ivory">
      <Image
        src={images.hero.src}
        alt={images.hero.alt}
        fill
        priority
        quality={85}
        sizes="100vw"
        className="animate-[hero-zoom_14s_var(--ease-luxe)_both] object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/45 to-transparent" />

      <div className="container-luxe relative pt-40 pb-20 sm:pb-24 lg:pb-32">
        <p className="eyebrow flex animate-fade-up items-center gap-4 text-ivory/85 [animation-delay:200ms]">
          <span aria-hidden className="h-px w-10 bg-champagne" />
          {hero.eyebrow}
        </p>
        <h1
          id="hero-title"
          className="display mt-8 animate-fade-up text-[3.5rem] leading-[0.98] [animation-delay:350ms] sm:text-7xl lg:text-[8.5rem]"
        >
          {hero.title}
        </h1>
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:items-end">
          <div className="animate-fade-up [animation-delay:550ms] lg:col-span-7">
            <p className="text-xl font-light tracking-[0.12em] sm:text-2xl">{hero.lead}</p>
            <p className="mt-6 text-[0.9375rem] leading-loose text-ivory/80">
              {hero.body.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div className="animate-fade-up [animation-delay:750ms] lg:col-span-5 lg:justify-self-end">
            <ButtonLink href={hero.cta.href} variant="light">
              {hero.cta.label}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div aria-hidden className="absolute right-6 bottom-8 hidden items-center gap-4 text-ivory/60 md:flex lg:right-20">
        <span className="eyebrow [writing-mode:vertical-rl]">Scroll</span>
        <span className="h-16 w-px animate-[scroll-line_2.4s_ease-in-out_infinite] bg-ivory/50" />
      </div>
    </section>
  );
}
