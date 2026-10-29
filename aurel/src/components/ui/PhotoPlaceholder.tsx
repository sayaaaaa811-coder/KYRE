import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** 実績写真などが未提供の場合の、明確なプレースホルダー */
export function PhotoPlaceholder({ label = "Photo coming soon", note = "写真準備中", className }: { label?: string; note?: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${note}（写真は未掲載です）`}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden border border-dashed border-stone/40 bg-sand text-stone-ink",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,transparent_0_14px,rgba(119,115,109,0.07)_14px_15px)]"
      />
      <ImageIcon aria-hidden className="relative size-6" strokeWidth={1.25} />
      <p className="relative eyebrow">{label}</p>
      <p className="relative text-xs tracking-widest">{note}</p>
    </div>
  );
}

/** 未確定の情報を示すインライン表示 */
export function Pending({ children = "準備中" }: { children?: React.ReactNode }) {
  return <span className="text-stone-ink italic">{children}</span>;
}
