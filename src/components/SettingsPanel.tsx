"use client";

import { useEffect, useState } from "react";
import {
  Field,
  buttonPrimary,
  buttonSecondary,
  cardClass,
  inputClass,
  sectionSubtitle,
  sectionTitle,
} from "./Field";
import {
  loadToken,
  lookupRegType,
  saveToken,
} from "@/lib/fbr/client";
import type { Environment } from "@/lib/fbr/types";

interface ServerStatus {
  sandboxToken: boolean;
  productionToken: boolean;
  serverEnvLocked: Environment | null;
}

interface SettingsPanelProps {
  env: Environment;
  onServerStatus?: (s: ServerStatus) => void;
}

export default function SettingsPanel({ env, onServerStatus }: SettingsPanelProps) {
  const [token, setToken] = useState("");
  const [pingResult, setPingResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<ServerStatus | null>(null);

  useEffect(() => {
    setToken(loadToken());
    fetch("/api/fbr/status")
      .then((r) => r.json())
      .then((s: ServerStatus) => {
        setServer(s);
        onServerStatus?.(s);
      })
      .catch(() => setServer(null));
  }, [onServerStatus]);

  const serverHasThisEnvToken =
    env === "production" ? server?.productionToken : server?.sandboxToken;

  function persist() {
    saveToken(token.trim());
    setPingResult({ ok: true, text: "Token saved to this browser." });
  }

  async function ping() {
    setBusy(true);
    setPingResult(null);
    saveToken(token.trim());
    try {
      const res = await lookupRegType("0788762");
      setPingResult({
        ok: res.ok,
        text: res.ok
          ? `OK · upstream HTTP ${res.upstreamStatus}`
          : `Failed · upstream HTTP ${res.upstreamStatus}`,
      });
    } catch (e) {
      setPingResult({ ok: false, text: `Error: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4">
        <h2 className={sectionTitle}>Connection</h2>
        <p className={sectionSubtitle}>
          The bearer token for the active environment. Server-side env vars take precedence over
          this input.
        </p>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <StatusRow
          label="Sandbox token"
          ok={Boolean(server?.sandboxToken)}
          okText="Configured on server"
          missingText="Not on server — using browser-stored token"
        />
        <StatusRow
          label="Production token"
          ok={Boolean(server?.productionToken)}
          okText="Configured on server"
          missingText="Not on server — using browser-stored token"
        />
      </div>

      {server?.serverEnvLocked && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Environment is locked to <code className="font-semibold">{server.serverEnvLocked}</code>{" "}
          by the <code>FBR_ENV</code> server env var.
        </div>
      )}

      {!serverHasThisEnvToken && (
        <div className="mt-4 grid gap-3">
          <Field
            label={`${env === "production" ? "Production" : "Sandbox"} bearer token`}
            required
            hint="Stored only in this browser's localStorage; sent over our server proxy with each request."
          >
            <input
              type="password"
              className={inputClass}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your FBR-issued token"
              autoComplete="off"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={persist} className={buttonPrimary}>
              Save
            </button>
            <button
              type="button"
              onClick={ping}
              disabled={busy || !token}
              className={buttonSecondary}
            >
              {busy ? "Testing…" : "Test connection"}
            </button>
            {pingResult && (
              <span
                className={`text-xs ${pingResult.ok ? "text-emerald-700" : "text-red-600"}`}
              >
                {pingResult.text}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  missingText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  missingText: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
          ok ? "bg-emerald-500" : "bg-slate-400"
        }`}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="font-medium text-slate-700">{label}</div>
        <div className="truncate text-slate-500">{ok ? okText : missingText}</div>
      </div>
    </div>
  );
}
