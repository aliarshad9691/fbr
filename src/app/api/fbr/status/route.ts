import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const sandboxToken = Boolean(
    process.env.FBR_SANDBOX_TOKEN?.trim() || process.env.FBR_TOKEN?.trim(),
  );
  const productionToken = Boolean(
    process.env.FBR_PRODUCTION_TOKEN?.trim() || process.env.FBR_TOKEN?.trim(),
  );
  const lockedEnv = process.env.FBR_ENV?.trim().toLowerCase();
  const serverEnvLocked =
    lockedEnv === "production" || lockedEnv === "sandbox" ? lockedEnv : null;

  return NextResponse.json({
    sandboxToken,
    productionToken,
    serverEnvLocked,
  });
}
