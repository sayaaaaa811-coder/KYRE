import type { NextRequest } from "next/server";
import { getServerConfig } from "@/server/env";
import { json } from "@/server/http";
import { cookieNames, cookieOptions, unsealSession } from "@/server/session";

/** 連携状態のみを返す（トークンなどの中身は返さない） */
export async function GET(request: NextRequest) {
  const config = getServerConfig();
  if (!config) return json({ configured: false, connected: false });

  const raw = request.cookies.get(cookieNames(config).session)?.value;
  const session = await unsealSession(raw, config);
  const res = json({ configured: true, connected: !!session, expiresAt: session?.expiresAt ?? null });
  // 期限切れ・改ざんされた Cookie は削除する
  if (raw && !session) res.cookies.set(cookieNames(config).session, "", cookieOptions(config, 0));
  return res;
}
