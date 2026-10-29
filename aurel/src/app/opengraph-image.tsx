import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.brand.name} — ${siteConfig.brand.category}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Cormorant Garamond をビルド時に取得（取得できない場合は既定のフォントで生成） */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const { name, category } = siteConfig.brand;
  const eyebrow = category.toUpperCase();
  const text = `${name}${eyebrow}Beyond the Ordinary.`;
  const font = await loadFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "radial-gradient(120% 90% at 50% 30%, #3a2f25 0%, #1d1815 55%, #121010 100%)",
          color: "#F4F0E9",
          fontFamily: font ? "Cormorant" : "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 8, color: "#A9957C" }}>{eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, letterSpacing: 36, lineHeight: 1 }}>{name}</div>
          <div style={{ marginTop: 28, fontSize: 44, color: "rgba(244,240,233,0.8)" }}>Beyond the Ordinary.</div>
        </div>
        <div style={{ display: "flex", height: 1, width: 160, background: "#A9957C" }} />
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Cormorant", data: font, weight: 500, style: "normal" }] : undefined,
    },
  );
}
