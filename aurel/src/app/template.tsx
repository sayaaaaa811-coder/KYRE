/**
 * ページ遷移ごとに再マウントされるテンプレート。
 * CSS アニメーションのみで自然にフェードインさせる（JavaScript の読み込みを待たない）。
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
