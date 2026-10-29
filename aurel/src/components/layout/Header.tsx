"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Menu, X } from "lucide-react";
import { contactNav, mainNav, siteConfig } from "@/config/site";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/** 写真のヒーローを持つページ（ヘッダーを透過表示にする） */
function hasImageHero(pathname: string) {
  return pathname === "/" || /^\/services\/[^/]+$/.test(pathname);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // メニュー表示中：背景のスクロール停止、Esc で閉じる、フォーカスをメニュー内に留める
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusables = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a, button"));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  const transparent = hasImageHero(pathname) && !scrolled;
  const light = transparent || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-700 ease-(--ease-luxe)",
        open
          ? "border-b border-transparent bg-transparent"
          : transparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-line/70 bg-ivory/88 backdrop-blur-md",
        light && "on-dark",
      )}
    >
      <div className="container-luxe flex h-20 items-center justify-between lg:h-24">
        <Logo tone={light ? "light" : "dark"} className="relative z-50" />

        <nav aria-label="メインナビゲーション" className="hidden items-center gap-12 md:flex">
          <ul className="flex items-center gap-10">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative py-2 text-[0.8125rem] font-medium tracking-[0.24em] uppercase transition-colors duration-500",
                      light ? "text-ivory/85 hover:text-ivory" : "text-charcoal/75 hover:text-charcoal",
                      active && (light ? "text-ivory" : "text-charcoal"),
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-500 ease-(--ease-luxe) group-hover:scale-x-100",
                        light ? "bg-ivory" : "bg-charcoal",
                        active && "scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={contactNav.href}
            aria-current={isActive(pathname, contactNav.href) ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 items-center px-7 text-[0.8125rem] font-medium tracking-[0.24em] uppercase transition-colors duration-500",
              light
                ? "bg-ivory text-charcoal hover:bg-white"
                : "bg-charcoal text-ivory hover:bg-[#2b2a28]",
            )}
          >
            {contactNav.label}
          </Link>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          className={cn(
            "relative z-50 -mr-2 inline-flex size-12 items-center justify-center md:hidden",
            light ? "text-ivory" : "text-charcoal",
          )}
        >
          {open ? <X strokeWidth={1.25} className="size-7" /> : <Menu strokeWidth={1.25} className="size-7" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            className="on-dark fixed inset-0 z-40 flex flex-col bg-charcoal md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="モバイルナビゲーション" className="container-luxe flex flex-1 flex-col justify-center pt-20">
              <ul className="space-y-2">
                {[{ label: "Home", href: "/" }, ...mainNav, contactNav].map((item, i) => (
                  <m.li
                    key={item.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.08 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="block py-2 font-serif text-5xl text-ivory/90 transition-colors hover:text-champagne"
                    >
                      {item.label}
                    </Link>
                  </m.li>
                ))}
              </ul>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-14 border-t border-line-dark pt-8"
              >
                <p className="eyebrow text-champagne">{siteConfig.brand.category}</p>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex min-h-14 w-full items-center justify-center bg-ivory px-8 text-[0.9375rem] font-medium tracking-[0.08em] text-charcoal"
                >
                  お問い合わせ・お見積り
                </Link>
              </m.div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
