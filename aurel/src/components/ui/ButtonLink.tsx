import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "light" | "outline" | "outline-light";

const variants: Record<Variant, string> = {
  primary: "bg-charcoal text-ivory hover:bg-[#2b2a28]",
  light: "bg-ivory text-charcoal hover:bg-white",
  outline: "border border-charcoal/70 text-charcoal hover:bg-charcoal hover:text-ivory",
  "outline-light": "border border-ivory/60 text-ivory hover:bg-ivory hover:text-charcoal",
};

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** 矢印アイコンを表示する */
  arrow?: boolean;
};

/** ボタン型のリンク（CTA 用） */
export function ButtonLink({ href, children, variant = "primary", className, arrow = true }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-14 items-center justify-center gap-4 px-8 py-4 text-[0.9375rem] font-medium tracking-[0.08em] transition-colors duration-500 ease-(--ease-luxe)",
        variants[variant],
        className,
      )}
    >
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-4 shrink-0 transition-transform duration-500 ease-(--ease-luxe) group-hover:translate-x-1.5"
          strokeWidth={1.5}
        />
      )}
    </Link>
  );
}

/** 文字リンク（下線と矢印） */
export function TextLink({
  href,
  children,
  className,
  tone = "dark",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 border-b pb-1.5 text-sm font-medium tracking-[0.12em] uppercase transition-colors duration-500",
        tone === "dark"
          ? "border-charcoal/40 text-charcoal hover:border-charcoal"
          : "border-ivory/40 text-ivory hover:border-ivory",
        className,
      )}
    >
      {children}
      <ArrowRight
        aria-hidden
        className="size-3.5 transition-transform duration-500 ease-(--ease-luxe) group-hover:translate-x-1"
        strokeWidth={1.5}
      />
    </Link>
  );
}
