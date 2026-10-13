import type { NextRequest } from "next/server";
import { getServerConfig } from "@/server/env";
import { isTrustedRequest, json, jsonError } from "@/server/http";
import { logEvent } from "@/server/logger";
import { revokeToken } from "@/server/oauth";
import { cookieNames, cookieOptions, unsealSession } from "@/server/session";

/** 連携解除: Google 側でトークンを失効させ、セッション Cookie を削除する */
export async function POST(request: NextRequest) {
  const config = getServerConfig();
  if (!config) return jsonError(503, "NOT_CONFIGURED");
  if (!isTrustedRequest(request, config)) return jsonError(403, "FORBIDDEN");

  const names = cookieNames(config);
  const session = await unsealSession(request.cookies.get(names.session)?.value, config);
  const revoked = session ? await revokeToken(config, session.accessToken) : true;

  const res = json({ status: "ok", revoked });
  res.cookies.set(names.session, "", cookieOptions(config, 0));
  logEvent("disconnect", { route: "auth/disconnect", status: revoked ? 200 : 502 });
  return res;
}
