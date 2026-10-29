import type { Faq } from "@/content/services";

/** よくある質問（details/summary によるアコーディオン。JavaScript 不要でキーボード操作可） */
export function FAQ({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-charcoal/15 border-y border-charcoal/15">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 [&::-webkit-details-marker]:hidden">
            <span className="flex gap-4 text-base font-medium leading-relaxed sm:text-lg">
              <span aria-hidden className="font-serif text-xl text-champagne-ink">
                Q.
              </span>
              {item.question}
            </span>
            <span aria-hidden className="relative mt-2 size-4 shrink-0">
              <span className="absolute top-1/2 left-0 h-px w-4 bg-charcoal" />
              <span className="absolute top-0 left-1/2 h-4 w-px bg-charcoal transition-transform duration-500 ease-(--ease-luxe) group-open:scale-y-0" />
            </span>
          </summary>
          <div className="flex gap-4 pb-8 pr-10 text-[0.9375rem] leading-loose text-stone-ink">
            <span aria-hidden className="font-serif text-xl text-champagne-ink">
              A.
            </span>
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
