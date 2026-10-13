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
