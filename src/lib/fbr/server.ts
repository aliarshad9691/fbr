import "server-only";

export interface FbrCallOptions {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  token: string;
}

export interface FbrCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
}

export async function callFbr<T = unknown>(opts: FbrCallOptions): Promise<FbrCallResult<T>> {
  const { url, method = "GET", body, token } = opts;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const rawText = await res.text();
  let data: T | null = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText) as T;
    } catch {
      data = null;
    }
  }

  return { ok: res.ok, status: res.status, data, rawText };
}
