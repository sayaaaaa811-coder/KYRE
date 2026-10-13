import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ServerConfig } from "./env";

/** 状態を変える API を他サイトから呼ばれないようにする（CSRF 対策） */
export function isTrustedRequest(request: NextRequest, config: Pick<ServerConfig, "appOrigin">): boolean {
  return request.headers.get("origin") === config.appOrigin && request.headers.get("x-kyre-request") === "1";
}

export function jsonError(status: number, code: string): NextResponse {
  return NextResponse.json({ status: "error", code }, { status, headers: { "Cache-Control": "no-store" } });
}

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** 戻り先は固定パスのみ（オープンリダイレクト対策） */
export function redirectHome(config: Pick<ServerConfig, "appOrigin">, query: Record<string, string>): NextResponse {
  const url = new URL("/", config.appOrigin);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "no-store" } });
}

/**
 * リクエスト本文を上限付きで読む（巨大な本文でメモリを消費させない）。
 * 上限を超えたら読み込みを中断して null を返す。
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
