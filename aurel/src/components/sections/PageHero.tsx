import Image from "next/image";
import type { SiteImage } from "@/content/images";
import { cn } from "@/lib/cn";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  /** 指定すると写真付きの暗いヒーローになる */
  image?: SiteImage;
  /** 画像付きヒーローのパンくず等 */
  breadcrumb?: React.ReactNode;
};

/** 下層ページの見出しエリア */
export function PageHero({ eyebrow, title, lead, children, image, breadcrumb }: PageHeroProps) {
  if (image) {
    return (
      <section className="on-dark relative flex min-h-[78svh] items-end overflow-hidden bg-charcoal text-ivory">
        <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="animate-[hero-zoom_14s_var(--ease-luxe)_both] object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="container-luxe relative pt-36 pb-16 lg:pb-24">
          {breadcrumb}
          <p className="eyebrow mt-8 flex animate-fade-up items-center gap-4 text-ivory/85">
            <span aria-hidden className="h-px w-10 bg-champagne" />
            {eyebrow}
          </p>
          <h1 className="display mt-6 animate-fade-up text-5xl [animation-delay:150ms] sm:text-7xl lg:text-[7rem]">{title}</h1>
          {lead && (
            <p className="mt-8 animate-fade-up text-xl font-light tracking-[0.1em] [animation-delay:300ms] sm:text-2xl">{lead}</p>
          )}
          {children && <div className="mt-6 max-w-2xl animate-fade-up text-ivory/80 [animation-delay:400ms]">{children}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory pt-40 pb-16 lg:pt-52 lg:pb-24">
      <div className="container-luxe">
        {breadcrumb}
        <p className={cn("eyebrow flex animate-fade-up items-center gap-4 text-champagne-ink", Boolean(breadcrumb) && "mt-8")}>
          <span aria-hidden className="h-px w-10 bg-champagne-ink" />
          {eyebrow}
        </p>
        <h1 className="display mt-6 max-w-5xl animate-fade-up text-5xl [animation-delay:150ms] sm:text-7xl lg:text-[6.5rem]">{title}</h1>
        {lead && <p className="mt-8 animate-fade-up text-lg tracking-[0.08em] text-charcoal [animation-delay:300ms] sm:text-xl">{lead}</p>}
        {children && <div className="mt-6 max-w-2xl animate-fade-up text-stone-ink [animation-delay:400ms]">{children}</div>}
      </div>
    </section>
  );
}
