"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** アニメーションの共通設定。OS の「視差効果を減らす」設定に従う */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
