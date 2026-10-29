/**
 * サイト用の抽象ビジュアル（光・建築・テーブルを想起させるオリジナル作品）を生成するスクリプト。
 * 第三者の素材を使わないため、ライセンス上の制約はありません。
 * 実写真に差し替える場合は src/content/images.ts のパスを変更してください（README 参照）。
 *
 * 実行: node scripts/generate-visuals.mjs  （Playwright + Chromium が必要）
 */
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const outDir = fileURLToPath(new URL("../public/images/visuals/", import.meta.url));

/** 再現性のある乱数 */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const grain = (opacity) => `
  <svg class="grain" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#n)" opacity="${opacity}"/>
  </svg>`;

function bokeh(seed, count, { w, h, yMin, yMax, rMin, rMax, colors, blur }) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const size = rMin + r() * (rMax - rMin);
    const x = r() * w;
    const y = yMin + r() * (yMax - yMin);
    const c = colors[Math.floor(r() * colors.length)];
    const o = 0.18 + r() * 0.55;
    const b = blur[0] + r() * (blur[1] - blur[0]);
    out += `<div style="position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle, ${c} 0%, ${c} 55%, transparent 72%);opacity:${o};filter:blur(${b}px)"></div>`;
  }
  return out;
}

const base = `
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:var(--w);height:var(--h);overflow:hidden;position:relative}
    .grain{position:absolute;inset:0;mix-blend-mode:overlay;pointer-events:none}
    .abs{position:absolute}
  </style>`;

const scenes = {
  // ヒーロー：夜のバンケット。シャンデリアの光のボケと、長いテーブルの水平線
  "hero-evening": ({ w, h }) => `
    <div class="abs" style="inset:0;background:radial-gradient(120% 90% at 50% 38%, #3a2f25 0%, #211b16 45%, #121010 100%)"></div>
    <div class="abs" style="left:-10%;right:-10%;top:8%;height:46%;background:radial-gradient(50% 60% at 50% 40%, rgba(233,196,140,.32), transparent 70%);filter:blur(30px)"></div>
    ${bokeh(7, 42, { w, h, yMin: h * 0.05, yMax: h * 0.5, rMin: 30, rMax: 150, colors: ["#f3d6a4", "#e9c08a", "#fff1d6", "#c9a77a"], blur: [2, 14] })}
    ${bokeh(11, 40, { w, h, yMin: h * 0.52, yMax: h * 0.78, rMin: 10, rMax: 46, colors: ["#ffe9c4", "#f0c98f"], blur: [0.5, 4] })}
    <div class="abs" style="left:0;right:0;top:66%;height:1px;background:linear-gradient(90deg,transparent,rgba(244,226,196,.55),transparent)"></div>
    <div class="abs" style="left:0;right:0;top:66%;bottom:0;background:linear-gradient(180deg, rgba(40,32,26,.65), #0e0c0b 85%)"></div>
    <div class="abs" style="left:0;right:0;top:66%;height:18%;background:radial-gradient(60% 100% at 50% 0%, rgba(244,222,186,.18), transparent 70%)"></div>
    <div class="abs" style="inset:0;background:radial-gradient(130% 100% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)"></div>
    ${grain(0.35)}`,

  // イントロ：アイボリーのアーチ回廊と斜光
  "arches-ivory": ({ w, h }) => {
    const n = 5;
    const aw = w / n;
    let arches = "";
    for (let i = 0; i < n; i++) {
      arches += `<div class="abs" style="left:${i * aw + aw * 0.16}px;top:${h * 0.16}px;width:${aw * 0.68}px;height:${h * 0.9}px;border-radius:${aw * 0.34}px ${aw * 0.34}px 0 0;background:linear-gradient(180deg,#d9cdb9 0%,#cbbca4 60%,#bfae95 100%);box-shadow:inset ${aw * 0.06}px 0 ${aw * 0.12}px rgba(80,64,46,.28)"></div>`;
    }
    return `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#efe8dc 0%,#e7dccb 100%)"></div>
    ${arches}
    <div class="abs" style="inset:0;background:linear-gradient(115deg, rgba(255,250,240,.0) 30%, rgba(255,248,232,.55) 48%, rgba(255,250,240,0) 62%);mix-blend-mode:soft-light"></div>
    <div class="abs" style="left:0;right:0;bottom:0;height:12%;background:linear-gradient(180deg,#d8cbb6,#c9b9a1)"></div>
    <div class="abs" style="inset:0;background:radial-gradient(120% 120% at 30% 20%, transparent 50%, rgba(60,48,36,.22) 100%)"></div>
    ${grain(0.28)}`;
  },

  // Corporate：レセプションのグラスとキャンドルを想起させる暖色のボケ
  "reception-glow": ({ w, h }) => `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#2a221c 0%,#1a1613 60%,#141110 100%)"></div>
    ${bokeh(23, 36, { w, h, yMin: h * 0.1, yMax: h * 0.62, rMin: 40, rMax: 170, colors: ["#e6bf86", "#f5dcb2", "#b98d5c", "#fff0d2"], blur: [6, 22] })}
    ${bokeh(29, 26, { w, h, yMin: h * 0.6, yMax: h * 0.9, rMin: 8, rMax: 30, colors: ["#ffe7bd"], blur: [0, 2] })}
    <div class="abs" style="inset:0;background:radial-gradient(120% 100% at 50% 40%, transparent 50%, rgba(0,0,0,.5) 100%)"></div>
    ${grain(0.32)}`,

  // Brand：ギャラリー／ショールーム。白壁、スポットライト、台座
  "gallery-light": ({ w, h }) => `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#f2eee7 0%,#e8e2d8 68%,#d9d1c4 68.2%,#cfc6b8 100%)"></div>
    <div class="abs" style="left:${w * 0.5 - w * 0.22}px;top:0;width:${w * 0.44}px;height:${h * 0.72}px;background:radial-gradient(50% 90% at 50% 0%, rgba(255,252,244,.95), rgba(255,250,240,0) 70%);filter:blur(6px)"></div>
    <div class="abs" style="left:${w * 0.5 - w * 0.07}px;top:${h * 0.42}px;width:${w * 0.14}px;height:${h * 0.3}px;background:linear-gradient(90deg,#e9e3d9 0%,#f7f4ee 45%,#d6cdbf 100%);box-shadow:0 30px 60px rgba(70,58,44,.18)"></div>
    <div class="abs" style="left:${w * 0.5 - w * 0.07}px;top:${h * 0.42}px;width:${w * 0.14}px;height:6px;background:#fbfaf6"></div>
    <div class="abs" style="left:${w * 0.5 - w * 0.035}px;top:${h * 0.27}px;width:${w * 0.07}px;height:${h * 0.15}px;border-radius:50% 50% 46% 46%;background:radial-gradient(60% 60% at 38% 30%, #c9b393, #9c8364 60%, #6f5b43 100%)"></div>
    <div class="abs" style="left:${w * 0.5 + w * 0.07}px;top:${h * 0.42}px;width:${w * 0.22}px;height:${h * 0.3}px;background:linear-gradient(90deg, rgba(90,74,56,.22), transparent);filter:blur(10px)"></div>
    <div class="abs" style="left:${w * 0.08}px;top:${h * 0.2}px;width:${w * 0.16}px;height:${h * 0.24}px;border:1px solid rgba(119,115,109,.35);background:linear-gradient(160deg,#ebe5da,#ddd4c6)"></div>
    <div class="abs" style="inset:0;background:radial-gradient(130% 110% at 50% 30%, transparent 55%, rgba(70,58,44,.2) 100%)"></div>
    ${grain(0.25)}`,

  // Venue：ラウンジ。アーチ窓、琥珀色の灯り、深い陰影
  "lounge-amber": ({ w, h }) => `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#1d1815 0%,#16120f 100%)"></div>
    <div class="abs" style="left:${w * 0.34}px;top:${h * 0.12}px;width:${w * 0.32}px;height:${h * 0.66}px;border-radius:${w * 0.16}px ${w * 0.16}px 0 0;background:linear-gradient(180deg,#5b4a39 0%,#3a2f25 55%,#2a221b 100%);box-shadow:0 0 120px rgba(214,170,112,.25)"></div>
    <div class="abs" style="left:${w * 0.36}px;top:${h * 0.15}px;width:${w * 0.28}px;height:${h * 0.63}px;border-radius:${w * 0.14}px ${w * 0.14}px 0 0;background:radial-gradient(70% 60% at 50% 30%, rgba(238,203,150,.55), rgba(120,92,62,.2) 70%, transparent)"></div>
    ${bokeh(41, 18, { w, h, yMin: h * 0.35, yMax: h * 0.75, rMin: 20, rMax: 80, colors: ["#f0c88a", "#ffdca8"], blur: [3, 12] })}
    <div class="abs" style="left:${w * 0.12}px;top:${h * 0.3}px;width:${w * 0.1}px;height:${w * 0.1}px;border-radius:50%;background:radial-gradient(circle,#ffe1ad 0%,rgba(240,190,120,.5) 35%,transparent 70%);filter:blur(4px)"></div>
    <div class="abs" style="left:${w * 0.78}px;top:${h * 0.3}px;width:${w * 0.1}px;height:${w * 0.1}px;border-radius:50%;background:radial-gradient(circle,#ffe1ad 0%,rgba(240,190,120,.5) 35%,transparent 70%);filter:blur(4px)"></div>
    <div class="abs" style="left:0;right:0;top:78%;bottom:0;background:linear-gradient(180deg,#2b231c,#100d0b)"></div>
    <div class="abs" style="left:0;right:0;top:78%;height:1px;background:linear-gradient(90deg,transparent,rgba(232,196,146,.4),transparent)"></div>
    <div class="abs" style="inset:0;background:radial-gradient(120% 100% at 50% 45%, transparent 45%, rgba(0,0,0,.6) 100%)"></div>
    ${grain(0.33)}`,

  // About / Process：真上から見たテーブルコーディネート（リネン、皿、グラス）
  "table-linen": ({ w, h }) => {
    const r = rng(53);
    let items = "";
    const cols = 4;
    for (let i = 0; i < cols; i++) {
      const cx = (w / cols) * (i + 0.5);
      for (const cy of [h * 0.3, h * 0.72]) {
        const pr = Math.min(w, h) * 0.13;
        items += `<div class="abs" style="left:${cx - pr}px;top:${cy - pr}px;width:${pr * 2}px;height:${pr * 2}px;border-radius:50%;background:radial-gradient(circle at 45% 40%, #ffffff 0%, #f6f3ee 55%, #e3ddd3 72%, #f4f1eb 74%, #e6e0d6 100%);box-shadow:6px 10px 24px rgba(80,66,50,.18)"></div>`;
        items += `<div class="abs" style="left:${cx - pr * 0.55}px;top:${cy - pr * 0.55}px;width:${pr * 1.1}px;height:${pr * 1.1}px;border-radius:50%;border:1px solid rgba(169,149,124,.55)"></div>`;
        const gx = cx + pr * 1.05, gy = cy - pr * 0.85 + r() * 6;
        items += `<div class="abs" style="left:${gx}px;top:${gy}px;width:${pr * 0.42}px;height:${pr * 0.42}px;border-radius:50%;background:radial-gradient(circle at 40% 35%, rgba(255,255,255,.95), rgba(230,224,214,.4) 60%, rgba(150,130,104,.25));box-shadow:3px 6px 12px rgba(80,66,50,.15)"></div>`;
        items += `<div class="abs" style="left:${cx - pr * 1.42}px;top:${cy - pr * 0.6}px;width:5px;height:${pr * 1.2}px;border-radius:3px;background:linear-gradient(90deg,#b7a385,#e1d4bf,#a9957c)"></div>`;
      }
    }
    return `
    <div class="abs" style="inset:0;background:linear-gradient(135deg,#ece6dc 0%,#e4dccf 100%)"></div>
    <div class="abs" style="inset:0;background:repeating-linear-gradient(0deg, rgba(120,104,84,.04) 0 2px, transparent 2px 5px),repeating-linear-gradient(90deg, rgba(120,104,84,.035) 0 2px, transparent 2px 6px)"></div>
    <div class="abs" style="left:0;right:0;top:${h * 0.49}px;height:${h * 0.04}px;background:linear-gradient(180deg,#d4c6b0,#cbbba2)"></div>
    ${items}
    <div class="abs" style="inset:0;background:linear-gradient(120deg, rgba(255,250,240,.35), transparent 45%, rgba(60,48,36,.12))"></div>
    ${grain(0.22)}`;
  },
};

const outputs = [
  { scene: "hero-evening", w: 2400, h: 1500 },
  { scene: "arches-ivory", w: 1800, h: 1350 },
  { scene: "reception-glow", w: 1600, h: 1200 },
  { scene: "gallery-light", w: 1600, h: 1200 },
  { scene: "lounge-amber", w: 1600, h: 1200 },
  { scene: "table-linen", w: 1800, h: 1200 },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const { scene, w, h } of outputs) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<!doctype html><html><head>${base}<style>body{--w:${w}px;--h:${h}px}</style></head><body>${scenes[scene]({ w, h })}</body></html>`);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(`${outDir}${scene}.jpg`);
  await page.close();
  console.log(`generated ${scene}.jpg`);
}
await browser.close();
