"use client";

import type { Environment, InvoicePayload, InvoiceResponse } from "./types";

const STORAGE_TOKEN = "fbr.token";
const STORAGE_ENV = "fbr.env";

export function loadToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_TOKEN) ?? "";
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_TOKEN, token);
}

export function loadEnv(): Environment {
  if (typeof window === "undefined") return "sandbox";
  const v = window.localStorage.getItem(STORAGE_ENV);
  return v === "production" ? "production" : "sandbox";
}

export function saveEnv(env: Environment): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_ENV, env);
}

interface ProxyResult<T> {
  ok: boolean;
  upstreamStatus: number;
  data: T | null;
  rawText?: string;
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = loadToken();
  const env = loadEnv();
  return {
    "Content-Type": "application/json",
    "x-fbr-token": token,
    "x-fbr-env": env,
    ...(extra ?? {}),
  };
}

export async function submitInvoice(
  payload: InvoicePayload,
  mode: "validate" | "post",
): Promise<ProxyResult<InvoiceResponse>> {
  const res = await fetch("/api/fbr/invoice", {
    method: "POST",
    headers: authHeaders({ "x-fbr-mode": mode }),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchReference<T>(
  name: string,
  query?: Record<string, string | number>,
): Promise<ProxyResult<T>> {
  const qs = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  const res = await fetch(`/api/fbr/reference/${name}${qs}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function lookupRegType(regNo: string): Promise<ProxyResult<unknown>> {
  const res = await fetch("/api/fbr/lookup", {
    method: "POST",
    headers: authHeaders({ "x-fbr-lookup": "regtype" }),
    body: JSON.stringify({ Registration_No: regNo }),
  });
  return res.json();
}

export async function lookupStatl(regNo: string, date: string): Promise<ProxyResult<unknown>> {
  const res = await fetch("/api/fbr/lookup", {
    method: "POST",
    headers: authHeaders({ "x-fbr-lookup": "statl" }),
    body: JSON.stringify({ regno: regNo, date }),
  });
  return res.json();
}
