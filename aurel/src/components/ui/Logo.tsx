import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/** ブランドロゴ（文字ロゴ）。ブランド名は config/site.ts から取得 */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.brand.name} ホーム`}
      className={cn(
        "font-serif text-[1.75rem] leading-none font-medium tracking-[0.32em] transition-colors duration-500",
        tone === "dark" ? "text-charcoal" : "text-ivory",
        className,
      )}
    >
      {siteConfig.brand.name}
    </Link>
  );
}
