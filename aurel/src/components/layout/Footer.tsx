import Link from "next/link";
import { contactNav, mainNav, siteConfig } from "@/config/site";
import { services } from "@/content/services";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const { operator, contact, brand } = siteConfig;
  const social = siteConfig.social.filter((s): s is { label: string; href: string } => Boolean(s.href));
  const operatorRows = [
    { label: "事業形態", value: operator.businessType },
    { label: "屋号", value: operator.tradeName },
    { label: "代表者", value: operator.representative },
    { label: "所在地", value: operator.address },
    { label: "Email", value: contact.email },
    { label: "Tel", value: contact.phone },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-charcoal text-ivory">
      <div className="container-luxe py-20 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo tone="light" className="text-3xl" />
            <p className="eyebrow mt-6 text-champagne">{brand.category}</p>
            <p className="mt-6 max-w-sm text-sm leading-loose text-ivory/70">
              企業イベント、ブランド体験、施設のイベント活用。人が集う時間に、目的と世界観を。
            </p>
          </div>

          <nav aria-label="フッターナビゲーション" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="eyebrow text-ivory/50">Menu</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[{ label: "Home", href: "/" }, ...mainNav, contactNav].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-ivory/80 transition-colors hover:text-ivory">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-ivory/50">Services</p>
              <ul className="mt-6 space-y-3 text-sm">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="text-ivory/80 transition-colors hover:text-ivory">
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="eyebrow text-ivory/50">Information</p>
              <dl className="mt-6 space-y-3 text-sm">
                {operatorRows.map((row) => (
                  <div key={row.label}>
                    <dt className="sr-only">{row.label}</dt>
                    <dd className="text-ivory/80">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {social.length > 0 && (
                <ul className="mt-6 flex gap-5 text-sm">
                  {social.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-ivory/80 hover:text-ivory">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line-dark pt-8 text-xs tracking-wider text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/privacy" className="transition-colors hover:text-ivory">
            プライバシーポリシー
          </Link>
          <p>
            &copy; {year} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
