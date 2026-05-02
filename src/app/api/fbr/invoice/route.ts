import { NextRequest } from "next/server";
import { FBR_ENDPOINTS } from "@/lib/fbr/endpoints";
import { resolveEnv, resolveToken, proxyJson, unauthorized } from "@/lib/fbr/route-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const env = resolveEnv(req.headers);
  const token = resolveToken(req.headers, env);
  if (!token) return unauthorized(env);

  const mode = req.headers.get("x-fbr-mode") || "post";

  const url =
    mode === "validate"
      ? FBR_ENDPOINTS.validateInvoice(env)
      : FBR_ENDPOINTS.postInvoice(env);

  const body = await req.json();
  return proxyJson({ url, method: "POST", body, token });
}
