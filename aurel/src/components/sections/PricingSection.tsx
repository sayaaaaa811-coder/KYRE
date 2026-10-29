import { Check, Minus } from "lucide-react";
import { formatPrice, type Service } from "@/content/services";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PricingCard } from "./PricingCard";

/** 料金表（プランカード＋比較表＋注記） */
export function PricingSection({ service }: { service: Service }) {
  const contactHref = (planId: string) => `/contact?service=${service.slug}&plan=${planId}`;

  // 上位プランが下位の内容を含む場合、機能ごとの比較表をつくる
  const matrix = service.cumulative
    ? service.plans.flatMap((plan, planIndex) =>
        plan.features.map((feature) => ({
          feature,
          included: service.plans.map((_, i) => i >= planIndex),
        })),
      )
    : null;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="section-y bg-ivory">
      <div className="container-luxe">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="pricing-title" eyebrow="Pricing" title="Plans & Pricing" lead="ご依頼内容に合わせて選べる料金プラン。" className="lg:col-span-7" />
          <p className="text-sm leading-loose text-stone-ink lg:col-span-5">
            いずれのプランも目安の料金です。ご要望を伺ったうえで、必要な業務だけを組み合わせたお見積りも作成します。
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {service.plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08}>
              <PricingCard plan={plan} index={i} contactHref={contactHref(plan.id)} emphasis={i === service.plans.length - 1} />
            </Reveal>
          ))}
        </div>

        {matrix && (
          <Reveal className="mt-20">
            <h3 className="eyebrow text-champagne-ink">Compare Plans</h3>
            <p className="mt-3 text-sm text-stone-ink">プランごとの対応範囲の比較</p>
            <div className="relative mt-8 overflow-x-auto border border-line bg-white" tabIndex={0} role="region" aria-label="プラン比較表（横にスクロールできます）">
              <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
                <caption className="sr-only">{service.title} のプラン比較</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-2/5 px-6 py-5 text-xs font-medium tracking-[0.18em] text-stone-ink uppercase">
                      内容
                    </th>
                    {service.plans.map((plan) => (
                      <th key={plan.id} scope="col" className="px-4 py-5 text-center">
                        <span className="block font-serif text-2xl font-normal">{plan.name}</span>
                        <span className="mt-1 block text-xs font-normal text-stone-ink">{formatPrice(plan.price)}（税別）</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.feature} className="border-b border-line/70 last:border-b-0">
                      <th scope="row" className="px-6 py-4 font-normal">
                        {row.feature}
                      </th>
                      {row.included.map((inc, i) => (
                        <td key={service.plans[i].id} className="px-4 py-4 text-center">
                          {inc ? (
                            <>
                              <Check aria-hidden className="mx-auto size-4 text-champagne-ink" strokeWidth={1.75} />
                              <span className="sr-only">対応</span>
                            </>
                          ) : (
                            <>
                              <Minus aria-hidden className="mx-auto size-4 text-stone/50" strokeWidth={1.5} />
                              <span className="sr-only">対象外</span>
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        <ul className="mt-12 space-y-2 text-sm leading-relaxed text-stone-ink">
          {service.pricingNotes.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden>※</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
