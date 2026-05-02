import { NextResponse } from "next/server";
import { callFbr } from "./server";
import type { Environment } from "./types";

export function resolveEnv(headers: Headers): Environment {
  const fromEnv = process.env.FBR_ENV?.trim().toLowerCase();
  if (fromEnv === "production" || fromEnv === "sandbox") return fromEnv;
  const fromHeader = headers.get("x-fbr-env")?.trim().toLowerCase();
  return fromHeader === "production" ? "production" : "sandbox";
}

export function resolveToken(headers: Headers, env: Environment): string | null {
  const sandboxEnv = process.env.FBR_SANDBOX_TOKEN?.trim();
  const productionEnv = process.env.FBR_PRODUCTION_TOKEN?.trim();
  const sharedEnv = process.env.FBR_TOKEN?.trim();

  const fromEnv = env === "production" ? productionEnv : sandboxEnv;
  if (fromEnv) return fromEnv;
  if (sharedEnv) return sharedEnv;

  const fromHeader = headers.get("x-fbr-token")?.trim();
  return fromHeader || null;
}

export function hasServerToken(env: Environment): boolean {
  if (env === "production" && process.env.FBR_PRODUCTION_TOKEN?.trim()) return true;
  if (env === "sandbox" && process.env.FBR_SANDBOX_TOKEN?.trim()) return true;
  return Boolean(process.env.FBR_TOKEN?.trim());
}

export function unauthorized(env: Environment): NextResponse {
  const varName = env === "production" ? "FBR_PRODUCTION_TOKEN" : "FBR_SANDBOX_TOKEN";
  return NextResponse.json(
    {
      error: `Missing FBR token for ${env}. Set ${varName} in .env.local or paste a token in the app settings.`,
    },
    { status: 401 },
  );
}

export async function proxyJson(opts: {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  token: string;
}) {
  const result = await callFbr(opts);
  return NextResponse.json(
    {
      ok: result.ok,
      upstreamStatus: result.status,
      data: result.data,
      rawText: result.data ? undefined : result.rawText,
    },
    { status: result.ok ? 200 : result.status || 502 },
  );
}
