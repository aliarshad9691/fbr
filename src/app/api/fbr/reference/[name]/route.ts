import { NextRequest } from "next/server";
import { FBR_ENDPOINTS } from "@/lib/fbr/endpoints";
import { resolveEnv, resolveToken, proxyJson, unauthorized } from "@/lib/fbr/route-helpers";

export const runtime = "nodejs";

const SIMPLE: Record<string, () => string> = {
  provinces: FBR_ENDPOINTS.provinces,
  doctypes: FBR_ENDPOINTS.docTypes,
  hscodes: FBR_ENDPOINTS.hsCodes,
  sroitemcode: FBR_ENDPOINTS.sroItemCode,
  transtypes: FBR_ENDPOINTS.transTypes,
  uom: FBR_ENDPOINTS.uom,
};

function buildUrl(name: string, sp: URLSearchParams): string | null {
  if (SIMPLE[name]) return SIMPLE[name]();

  if (name === "saletypetorate") {
    const date = sp.get("date");
    const transTypeId = Number(sp.get("transTypeId"));
    const originationSupplier = Number(sp.get("originationSupplier"));
    if (!date || !transTypeId || !originationSupplier) return null;
    return FBR_ENDPOINTS.saleTypeToRate(date, transTypeId, originationSupplier);
  }
  if (name === "srosched") {
    const rateId = Number(sp.get("rate_id"));
    const date = sp.get("date");
    const csv = Number(sp.get("origination_supplier_csv"));
    if (!rateId || !date || !csv) return null;
    return FBR_ENDPOINTS.sroSchedule(rateId, date, csv);
  }
  if (name === "sroitem") {
    const date = sp.get("date");
    const sroId = Number(sp.get("sro_id"));
    if (!date || !sroId) return null;
    return FBR_ENDPOINTS.sroItem(date, sroId);
  }
  if (name === "hsuom") {
    const hsCode = sp.get("hs_code");
    const annexureId = Number(sp.get("annexure_id"));
    if (!hsCode || !annexureId) return null;
    return FBR_ENDPOINTS.hsUom(hsCode, annexureId);
  }
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ name: string }> },
) {
  const env = resolveEnv(req.headers);
  const token = resolveToken(req.headers, env);
  if (!token) return unauthorized(env);

  const { name } = await ctx.params;
  const url = buildUrl(name.toLowerCase(), req.nextUrl.searchParams);
  if (!url) {
    return new Response(
      JSON.stringify({ error: `Unknown reference '${name}' or missing query parameters.` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  return proxyJson({ url, method: "GET", token });
}
