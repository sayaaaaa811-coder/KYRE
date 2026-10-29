import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

type Step = { number?: string; title: string; label?: string; description: string };

/** 進め方（タイムライン） */
export function ProcessTimeline({
  steps,
  tone = "light",
  titleStyle = "en",
}: {
  steps: readonly Step[];
  tone?: "light" | "dark";
  /** "en": 英字のセリフ見出し / "ja": 日本語見出し */
  titleStyle?: "en" | "ja";
}) {
  const dark = tone === "dark";
  return (
    <ol className="grid gap-px sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, i) => (
        <Reveal as="li" key={step.title} delay={i * 0.07} className={cn("relative pt-10 pb-6 lg:pr-8", dark ? "text-ivory" : "text-charcoal")}>
          <span aria-hidden className={cn("absolute top-0 left-0 h-px w-full", dark ? "bg-line-dark" : "bg-charcoal/15")} />
          <span aria-hidden className={cn("absolute -top-[3px] left-0 size-[7px] rounded-full", dark ? "bg-champagne" : "bg-champagne-ink")} />
          <p className={cn("font-serif text-lg", dark ? "text-champagne" : "text-champagne-ink")}>
            {step.number ?? String(i + 1).padStart(2, "0")}
          </p>
          <h3 className={titleStyle === "en" ? "display mt-3 text-[1.875rem]" : "mt-3 text-lg font-medium tracking-[0.08em]"}>{step.title}</h3>
          {step.label && <p className="mt-1 text-sm tracking-[0.1em]">{step.label}</p>}
          <p className={cn("mt-4 text-[0.9375rem] leading-loose", dark ? "text-ivory/70" : "text-stone-ink")}>{step.description}</p>
        </Reveal>
      ))}
    </ol>
  );
}
