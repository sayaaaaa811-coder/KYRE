/**
 * サイトで使用するビジュアルの一元管理ファイル。
 *
 * 現在の画像は、本プロジェクト用に生成したオリジナルの抽象ビジュアル
 * （scripts/generate-visuals.mjs で作成。第三者の著作物を含みません）です。
 *
 * 写真に差し替える手順:
 * 1. ライセンスを確認した画像を public/images/ 以下に置く
 * 2. 下記の src / alt / credit を書き換える
 * 3. ストック写真は「イメージ」であり、実績写真として使わない（実績写真は src/content/works.ts で管理）
 */
export type SiteImage = {
  src: string;
  alt: string;
  credit: {
    /** 作者・提供元 */
    source: string;
    /** ライセンス */
    license: string;
    /** 出典URL（ある場合） */
    url?: string;
  };
};

const original = {
  source: "Original artwork generated for this site (scripts/generate-visuals.mjs)",
  license: "Project-owned original. No third-party license required.",
};

export const images = {
  hero: {
    src: "/images/visuals/hero-evening.jpg",
    alt: "夜のバンケットを思わせる、暖かな光の重なり",
    credit: original,
  },
  intro: {
    src: "/images/visuals/arches-ivory.jpg",
    alt: "柔らかな光が差し込む、アイボリーのアーチが連なる空間",
    credit: original,
  },
  corporate: {
    src: "/images/visuals/reception-glow.jpg",
    alt: "レセプションのグラスとキャンドルを思わせる暖色の光",
    credit: original,
  },
  brand: {
    src: "/images/visuals/gallery-light.jpg",
    alt: "スポットライトに照らされた台座のあるギャラリー空間",
    credit: original,
  },
  venue: {
    src: "/images/visuals/lounge-amber.jpg",
    alt: "アーチ窓に琥珀色の灯りがともるラウンジ",
    credit: original,
  },
  table: {
    src: "/images/visuals/table-linen.jpg",
    alt: "リネンのテーブルに整然と並ぶ白い器",
    credit: original,
  },
} satisfies Record<string, SiteImage>;
