/**
 * 実績（Works）の一元管理ファイル。
 *
 * 現在掲載しているのは、代表者が本ブランド立ち上げ以前に携わった活動経験です。
 * ブランドとしての受注実績と誤認されないよう、`kind` で区別して表示します。
 *
 * 追加方法:
 * - 配列に同じ形のオブジェクトを追加してください。
 * - 未確定の項目は null のままにすると「準備中」と表示されます。架空の値で埋めないでください。
 * - 写真は、実際の開催写真で掲載許諾を得たものだけを `photos` に追加してください。
 *   ストック写真やイメージ画像を実績写真として使わないでください。
 */
export type WorkPhoto = {
  src: string;
  alt: string;
  /** 撮影者・掲載許諾など */
  credit?: string;
};

export type Work = {
  id: string;
  /** 表示ラベル（例: "Experience 01"） */
  label: string;
  /** "past-experience": 代表者の過去の活動経験 / "project": ブランドとしての実績 */
  kind: "past-experience" | "project";
  title: string;
  /** 規模の数値（大きく表示） */
  scale: { figure: string; unit: string };
  summary: string;
  details: {
    /** 担当範囲 */
    role: string | null;
    /** 会場（公開可能な範囲で） */
    venue: string | null;
    /** 開催時期 */
    period: string | null;
    /** 成果・反響（事実に基づくもののみ） */
    outcome: string | null;
  };
  photos: WorkPhoto[];
};

export const works: Work[] = [
  {
    id: "experience-01",
    label: "Experience 01",
    kind: "past-experience",
    title: "100名規模ラグジュアリーイベント",
    scale: { figure: "100", unit: "名規模" },
    summary: "ラグジュアリーイベントを半年間で3回主催。",
    details: { role: null, venue: null, period: null, outcome: null },
    photos: [],
  },
  {
    id: "experience-02",
    label: "Experience 02",
    kind: "past-experience",
    title: "400名規模イベント",
    scale: { figure: "400", unit: "名規模" },
    summary: "イベントを3回開催。",
    details: { role: null, venue: null, period: null, outcome: null },
    photos: [],
  },
];

/** 過去の活動経験であることを示す注記（トップページ・Works ページで共通） */
export const pastExperienceNote =
  "掲載内容は、代表者が本ブランドの立ち上げ以前に携わった活動経験です。本ブランドとしての受注実績ではありません。";

export const workDetailLabels: Record<keyof Work["details"], string> = {
  role: "担当範囲",
  venue: "会場",
  period: "開催時期",
  outcome: "成果・反響",
};
