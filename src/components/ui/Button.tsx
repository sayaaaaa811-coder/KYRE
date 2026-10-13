import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-black disabled:bg-line disabled:text-sub shadow-[0_1px_0_0_var(--color-gold)_inset]",
  secondary: "border border-gold text-ink bg-paper hover:bg-gold-soft disabled:border-line disabled:text-sub",
  ghost: "text-sub hover:text-ink underline-offset-4 hover:underline disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
