import { Check } from "lucide-react";
import { splitPrice, type Plan } from "@/content/services";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/cn";

/** 料金プランのカード */
export function PricingCard({
  plan,
  index,
  contactHref,
  emphasis = false,
}: {
  plan: Plan;
  index: number;
  contactHref: string;
  /** 視覚的なリズムのために濃色で表示する（「おすすめ」の意味は持たせない） */
  emphasis?: boolean;
}) {
  const price = splitPrice(plan.price);
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex h-full flex-col p-8 sm:p-10",
        emphasis ? "on-dark bg-charcoal text-ivory" : "border border-line bg-white text-charcoal",
      )}
    >
      <p className={cn("font-serif text-lg", emphasis ? "text-champagne" : "text-champagne-ink")}>
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 id={`plan-${plan.id}`} className="display mt-2 text-[2.125rem]">
        {plan.name}
      </h3>
      <p className={cn("mt-4 min-h-[3.5rem] text-sm leading-relaxed", emphasis ? "text-ivory/75" : "text-stone-ink")}>{plan.summary}</p>

      <p className={cn("mt-8 border-y py-6", emphasis ? "border-line-dark" : "border-line")}>
        <span className="sr-only">料金（税別）：</span>
        {price.prefix && <span className="mr-1 text-sm">{price.prefix}</span>}
        <span className="font-serif text-6xl leading-none tracking-tight">{price.figure}</span>
        <span className="ml-1 text-base">{price.unit}</span>
        {price.suffix && <span className="ml-1 text-sm">{price.suffix}</span>}
        <span className={cn("mt-2 block text-xs tracking-wider", emphasis ? "text-ivory/60" : "text-stone-ink")}>税別</span>
      </p>

      <div className="mt-8 flex-1">
        {plan.inherits && (
          <p className={cn("mb-4 text-sm font-medium", emphasis ? "text-champagne" : "text-champagne-ink")}>{plan.inherits}：</p>
        )}
        <ul className="space-y-3.5">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3 text-[0.9375rem] leading-relaxed">
              <Check aria-hidden className={cn("mt-1 size-4 shrink-0", emphasis ? "text-champagne" : "text-champagne-ink")} strokeWidth={1.5} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <ButtonLink href={contactHref} variant={emphasis ? "light" : "outline"} className="mt-10 w-full">
        このプランで相談する
      </ButtonLink>
    </article>
  );
}
