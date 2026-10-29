import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** 見出しレベル（ページ内の見出し構造に合わせる） */
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  /** 見出しの id（aria-labelledby 用） */
  id?: string;
};

/** セクション見出し：英字の小見出し・大きな英字タイトル・日本語のリード */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Heading = "h2",
  align = "left",
  tone = "dark",
  className,
  id,
}: SectionHeadingProps) {
  const light = tone === "light";
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow mb-6 flex items-center gap-4", align === "center" && "justify-center", light ? "text-champagne" : "text-champagne-ink")}>
          <span aria-hidden className={cn("h-px w-8", light ? "bg-champagne" : "bg-champagne-ink")} />
          {eyebrow}
        </p>
      )}
      <Heading
        id={id}
        className={cn("display text-[2.5rem] sm:text-5xl lg:text-[4.25rem]", light ? "text-ivory" : "text-charcoal")}
      >
        {title}
      </Heading>
      {lead && (
        <p className={cn("mt-6 text-base leading-loose sm:text-lg", light ? "text-ivory/80" : "text-stone-ink")}>{lead}</p>
      )}
    </div>
  );
}
