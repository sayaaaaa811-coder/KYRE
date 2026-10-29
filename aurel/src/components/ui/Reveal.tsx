"use client";

import { m } from "motion/react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** 表示開始の遅延（秒） */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
};

/** スクロールで画面に入ったときに控えめにフェードインする */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Component = m[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
