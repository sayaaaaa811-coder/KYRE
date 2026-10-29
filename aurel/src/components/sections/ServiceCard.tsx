import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { images } from "@/content/images";
import type { Service } from "@/content/services";

/** サービス紹介カード（写真付き）。カード全体が詳細ページへのリンク */
export function ServiceCard({ service, headingLevel = "h3" }: { service: Service; headingLevel?: "h2" | "h3" }) {
  const image = images[service.image];
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-[1.05]"
        />
        <span className="absolute top-5 left-5 font-serif text-2xl text-ivory/90">{service.number}</span>
      </div>
      <div className="flex flex-1 flex-col pt-8">
        <p className="eyebrow text-champagne-ink">{service.label}</p>
        <Heading className="display mt-3 text-[2rem] lg:text-[2.375rem]">
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {service.title}
          </Link>
        </Heading>
        <p className="mt-4 flex-1 text-[0.9375rem] leading-loose text-stone-ink">{service.excerpt}</p>
        <span
          aria-hidden
          className="mt-8 inline-flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-charcoal uppercase"
        >
          View Service
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-(--ease-luxe) group-hover:translate-x-1.5" strokeWidth={1.5} />
        </span>
      </div>
      {/* カード全体リンクのフォーカス表示 */}
      <span aria-hidden className="pointer-events-none absolute -inset-2 hidden outline-2 outline-offset-0 outline-champagne-ink group-has-[a:focus-visible]:block" />
    </article>
  );
}
