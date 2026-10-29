import Image from "next/image";
import { homeContent } from "@/content/home";
import { images } from "@/content/images";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

type CTASectionProps = {
  title?: string;
  lead?: string;
  body?: string;
  label?: string;
  href?: string;
};

/** お問い合わせへの誘導セクション */
export function CTASection({
  title = homeContent.cta.title,
  lead = homeContent.cta.lead,
  body = homeContent.cta.body,
  label = homeContent.cta.label,
  href = homeContent.cta.href,
}: CTASectionProps) {
  return (
    <section aria-labelledby="cta-title" className="on-dark relative overflow-hidden bg-charcoal text-ivory">
      <Image src={images.venue.src} alt="" fill sizes="100vw" className="object-cover opacity-35" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/40" />
      <div className="container-luxe section-y relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow flex items-center gap-4 text-champagne">
            <span aria-hidden className="h-px w-8 bg-champagne" />
            Contact
          </p>
          <h2 id="cta-title" className="display mt-6 text-[2.75rem] sm:text-6xl lg:text-[5.25rem]">
            {title}
          </h2>
          <p className="mt-8 text-xl font-light tracking-[0.1em] sm:text-2xl">{lead}</p>
          <p className="mt-6 max-w-xl text-[0.9375rem] leading-loose text-ivory/75">{body}</p>
          <ButtonLink href={href} variant="light" className="mt-12">
            {label}
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
