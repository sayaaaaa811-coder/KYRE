import type { Work } from "@/content/works";
import { cn } from "@/lib/cn";

/** 規模を大きな数字で見せる実績（活動経験）カード */
export function ExperienceCard({ work, tone = "light" }: { work: Work; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article className={cn("border-t pt-8", dark ? "border-line-dark" : "border-charcoal/20")}>
      <p className={cn("eyebrow", dark ? "text-champagne" : "text-champagne-ink")}>{work.label}</p>
      <p className="mt-6 flex items-baseline gap-3" aria-label={`${work.scale.figure}${work.scale.unit}`}>
        <span className="font-serif text-[6.5rem] leading-[0.85] tracking-tight sm:text-[8.5rem]">{work.scale.figure}</span>
        <span className={cn("text-lg tracking-[0.1em]", dark ? "text-ivory/85" : "text-charcoal")}>{work.scale.unit}</span>
      </p>
      <h3 className="mt-8 text-lg font-medium tracking-[0.06em]">{work.title}</h3>
      <p className={cn("mt-2 text-[0.9375rem]", dark ? "text-ivory/75" : "text-stone-ink")}>{work.summary}</p>
    </article>
  );
}
