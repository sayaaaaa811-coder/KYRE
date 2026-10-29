import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** ページごとの metadata を共通の形式で作成する */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteConfig.brand.name}`,
      description,
      url: path,
      siteName: siteConfig.brand.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.brand.name}`,
      description,
    },
  };
}
