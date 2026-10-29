import { NextResponse, type NextRequest } from "next/server";
import { contactPayloadSchema, type ContactResponse } from "@/lib/contact-schema";
import { getMailConfig, sendContactMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 20_000;
/** フォーム表示から送信までの最短時間（これより速い送信は自動投稿とみなす） */
const MIN_FILL_MS = 3_000;

function reply(body: ContactResponse, status: number) {
  return NextResponse.json(body, { status });
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // 他サイトからの送信を拒否
  if (!isSameOrigin(request)) {
    return reply({ ok: false, code: "forbidden", message: "送信元が正しくありません。" }, 403);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ ok: false, code: "invalid", message: "入力内容が長すぎます。" }, 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return reply({ ok: false, code: "invalid", message: "送信内容を読み取れませんでした。" }, 400);
  }

  const parsed = contactPayloadSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return reply({ ok: false, code: "invalid", message: "入力内容をご確認ください。", fieldErrors }, 400);
  }

  const { website, startedAt, ...values } = parsed.data;
  if (website !== "" || Date.now() - startedAt < MIN_FILL_MS) {
    return reply(
      { ok: false, code: "spam", message: "送信を受け付けられませんでした。時間をおいて再度お試しください。" },
      400,
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return reply(
      { ok: false, code: "rate_limited", message: "短時間に複数回送信されました。しばらく時間をおいてお試しください。" },
      429,
    );
  }

  const config = getMailConfig();
  if (!config) {
    // 送信先が未設定の場合、成功を装わずにその旨を返す
    return reply(
      {
        ok: false,
        code: "not_configured",
        message: "現在、フォームからの送信を受け付けられない状態です（送信先が未設定です）。",
      },
      503,
    );
  }

  try {
    await sendContactMail(config, values);
  } catch {
    return reply(
      { ok: false, code: "send_failed", message: "送信に失敗しました。時間をおいて再度お試しください。" },
      502,
    );
  }

  return reply({ ok: true }, 200);
}
