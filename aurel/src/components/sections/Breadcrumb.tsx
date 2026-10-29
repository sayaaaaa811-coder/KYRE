import Link from "next/link";
import { cn } from "@/lib/cn";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items, tone = "dark" }: { items: Crumb[]; tone?: "dark" | "light" }) {
  return (
    <nav aria-label="パンくずリスト">
      <ol className={cn("flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] uppercase", tone === "light" ? "text-ivory/70" : "text-stone-ink")}>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className={cn("transition-colors", tone === "light" ? "hover:text-ivory" : "hover:text-charcoal")}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
