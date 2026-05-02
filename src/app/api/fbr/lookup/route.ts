import { NextRequest } from "next/server";
import { FBR_ENDPOINTS } from "@/lib/fbr/endpoints";
import { resolveEnv, resolveToken, proxyJson, unauthorized } from "@/lib/fbr/route-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const env = resolveEnv(req.headers);
  const token = resolveToken(req.headers, env);
  if (!token) return unauthorized(env);

  const kind = req.headers.get("x-fbr-lookup");
  const body = await req.json();

  if (kind === "statl") {
    return proxyJson({ url: FBR_ENDPOINTS.statl(), method: "POST", body, token });
  }
  if (kind === "regtype") {
    return proxyJson({ url: FBR_ENDPOINTS.regType(), method: "POST", body, token });
  }
  return new Response(JSON.stringify({ error: "Unknown lookup kind" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
