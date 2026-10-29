import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center bg-ivory pt-32 pb-24">
      <div className="container-luxe">
        <p className="eyebrow text-champagne-ink">404 — Not Found</p>
        <h1 className="display mt-6 text-5xl sm:text-7xl">Page not found.</h1>
        <p className="mt-8 text-base leading-loose text-stone-ink">お探しのページは見つかりませんでした。URLをご確認いただくか、トップページからお進みください。</p>
        <ButtonLink href="/" className="mt-12">
          トップページへ
        </ButtonLink>
      </div>
    </section>
  );
}
