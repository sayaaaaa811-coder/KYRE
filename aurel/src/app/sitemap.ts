import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { services } from "@/content/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/services", ...services.map((s) => `/services/${s.slug}`), "/works", "/contact", "/privacy"];
  return routes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path.startsWith("/services") ? 0.9 : path === "/privacy" ? 0.3 : 0.7,
  }));
}
