"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import {
  Field,
  buttonSecondary,
  buttonSuccess,
  cardClass,
  inputClass,
  sectionSubtitle,
  sectionTitle,
} from "./Field";
import {
  fetchReference,
  loadEnv,
  saveEnv,
  submitInvoice,
} from "@/lib/fbr/client";
import { SCENARIOS } from "@/lib/fbr/scenarios";
import type {
  Environment,
  InvoiceItem,
  InvoicePayload,
  InvoiceResponse,
  Province,
  UoM,
} from "@/lib/fbr/types";

const emptyItem = (): InvoiceItem => ({
  hsCode: "",
  productDescription: "",
  rate: "",
  uoM: "",
  quantity: 1,
  totalValues: 0,
  valueSalesExcludingST: 0,
  fixedNotifiedValueOrRetailPrice: 0,
  salesTaxApplicable: 0,
  salesTaxWithheldAtSource: 0,
  extraTax: 0,
  furtherTax: 0,
  sroScheduleNo: "",
  fedPayable: 0,
  discount: 0,
  saleType: "Goods at Standard Rate (default)",
  sroItemSerialNo: "",
});

const emptyPayload = (): InvoicePayload => ({
  invoiceType: "Sale Invoice",
  invoiceDate: new Date().toISOString().slice(0, 10),
  sellerNTNCNIC: "",
  sellerBusinessName: "",
  sellerProvince: "Sindh",
  sellerAddress: "",
  buyerNTNCNIC: "",
  buyerBusinessName: "",
  buyerProvince: "Sindh",
  buyerAddress: "",
  buyerRegistrationType: "Registered",
  invoiceRefNo: "",
  scenarioId: "SN001",
  items: [emptyItem()],
});

interface SubmitResult {
  mode: "validate" | "post";
  ok: boolean;
  upstreamStatus: number;
  data: InvoiceResponse | null;
  rawText?: string;
}

interface ServerStatus {
  sandboxToken: boolean;
  productionToken: boolean;
  serverEnvLocked: Environment | null;
}

const FALLBACK_PROVINCES = [
  "Sindh",
  "Punjab",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
];

const FALLBACK_UOMS = ["Numbers, pieces, units", "KG", "Litre", "Square Metre"];

export default function InvoiceWorkbench() {
  const [env, setEnv] = useState<Environment>("sandbox");
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [payload, setPayload] = useState<InvoicePayload>(emptyPayload);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [uoms, setUoms] = useState<UoM[]>([]);
  const [refStatus, setRefStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [refMessage, setRefMessage] = useState<string>("");
  const [busy, setBusy] = useState<"" | "validate" | "post">("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const lastRefEnvRef = useRef<Environment | null>(null);

  useEffect(() => {
    setEnv(loadEnv());
  }, []);

  useEffect(() => {
    saveEnv(env);
  }, [env]);

  const loadReferenceData = useCallback(async () => {
    setRefStatus("loading");
    setRefMessage("");
    try {
      const [pRes, uRes] = await Promise.all([
        fetchReference<Province[]>("provinces"),
        fetchReference<UoM[]>("uom"),
      ]);
      const pOk = pRes.ok && Array.isArray(pRes.data);
      const uOk = uRes.ok && Array.isArray(uRes.data);
      if (pOk) setProvinces(pRes.data as Province[]);
      if (uOk) setUoms(uRes.data as UoM[]);
      if (pOk && uOk) {
        setRefStatus("ready");
        setRefMessage(
          `Loaded ${(pRes.data as Province[]).length} provinces, ${(uRes.data as UoM[]).length} UoMs`,
        );
      } else {
        setRefStatus("error");
        setRefMessage(
          `Could not fetch reference data (provinces ${pRes.upstreamStatus}, UoM ${uRes.upstreamStatus}). Set a valid token.`,
        );
      }
    } catch (e) {
      setRefStatus("error");
      setRefMessage(`Error: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    if (!server) return;
    if (lastRefEnvRef.current === env) return;
    const tokenAvailable =
      env === "production" ? server.productionToken : server.sandboxToken;
    if (tokenAvailable) {
      lastRefEnvRef.current = env;
      void loadReferenceData();
    }
  }, [server, env, loadReferenceData]);

  function updatePayload<K extends keyof InvoicePayload>(key: K, value: InvoicePayload[K]) {
    setPayload((p) => ({ ...p, [key]: value }));
  }

  function updateItem(idx: number, patch: Partial<InvoiceItem>) {
    setPayload((p) => ({
      ...p,
      items: p.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setPayload((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  }

  function removeItem(idx: number) {
    setPayload((p) => ({
      ...p,
      items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items,
    }));
  }

  async function submit(mode: "validate" | "post") {
    setBusy(mode);
    setResult(null);
    try {
      const body: InvoicePayload = {
        ...payload,
        scenarioId: env === "sandbox" ? payload.scenarioId : undefined,
      };
      const res = await submitInvoice(body, mode);
      setResult({
        mode,
        ok: res.ok,
        upstreamStatus: res.upstreamStatus,
        data: res.data,
        rawText: res.rawText,
      });
    } catch (e) {
      setResult({
        mode,
        ok: false,
        upstreamStatus: 0,
        data: null,
        rawText: (e as Error).message,
      });
    } finally {
      setBusy("");
    }
  }

  const provinceOptions = useMemo(
    () =>
      provinces.length > 0 ? provinces.map((p) => p.stateProvinceDesc) : FALLBACK_PROVINCES,
    [provinces],
  );

  const uomOptions = useMemo(
    () => (uoms.length > 0 ? uoms.map((u) => u.description) : FALLBACK_UOMS),
    [uoms],
  );

  const envLocked = Boolean(server?.serverEnvLocked);
  const effectiveEnv: Environment = server?.serverEnvLocked ?? env;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className={sectionTitle}>FBR environment</h2>
            <p className={sectionSubtitle}>
              Choose where to send invoices. Sandbox requires a scenario ID; production does not.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Environment"
            className="inline-flex w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-sm sm:w-auto"
          >
            {(["sandbox", "production"] as Environment[]).map((e) => {
              const active = effectiveEnv === e;
              return (
                <button
                  key={e}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={envLocked && server?.serverEnvLocked !== e}
                  onClick={() => !envLocked && setEnv(e)}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  {e === "sandbox" ? "Sandbox" : "Production"}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Reference data:{" "}
            <span
              className={
                refStatus === "ready"
                  ? "font-medium text-emerald-700"
                  : refStatus === "error"
                  ? "font-medium text-red-600"
                  : "font-medium text-slate-700"
              }
            >
              {refStatus === "loading"
                ? "loading…"
                : refStatus === "ready"
                ? refMessage
                : refStatus === "error"
                ? "unavailable"
                : "not loaded"}
            </span>
          </span>
          <button
            type="button"
            onClick={loadReferenceData}
            className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            Reload
          </button>
        </div>
        {refStatus === "error" && (
          <p className="mt-2 text-xs text-red-600">{refMessage}</p>
        )}
      </section>

      <SettingsPanel env={effectiveEnv} onServerStatus={setServer} />

      <section className={cardClass}>
        <header className="mb-5">
          <h2 className={sectionTitle}>Invoice header</h2>
          <p className={sectionSubtitle}>Single header per invoice; the items array is below.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Invoice type" required>
            <select
              className={inputClass}
              value={payload.invoiceType}
              onChange={(e) =>
                updatePayload("invoiceType", e.target.value as InvoicePayload["invoiceType"])
              }
            >
              <option value="Sale Invoice">Sale Invoice</option>
              <option value="Debit Note">Debit Note</option>
            </select>
          </Field>
          <Field label="Invoice date" required>
            <input
              type="date"
              className={inputClass}
              value={payload.invoiceDate}
              onChange={(e) => updatePayload("invoiceDate", e.target.value)}
            />
          </Field>
          <Field
            label="Invoice ref no."
            hint="22 digits (NTN) / 28 digits (CNIC). Only for Debit Note."
          >
            <input
              className={inputClass}
              value={payload.invoiceRefNo}
              onChange={(e) => updatePayload("invoiceRefNo", e.target.value)}
            />
          </Field>
        </div>

        <Divider label="Seller" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Seller NTN/CNIC" required hint="7 or 13 digits">
            <input
              className={inputClass}
              value={payload.sellerNTNCNIC}
              onChange={(e) => updatePayload("sellerNTNCNIC", e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="Seller business name" required>
            <input
              className={inputClass}
              value={payload.sellerBusinessName}
              onChange={(e) => updatePayload("sellerBusinessName", e.target.value)}
            />
          </Field>
          <Field label="Seller province" required>
            <select
              className={inputClass}
              value={payload.sellerProvince}
              onChange={(e) => updatePayload("sellerProvince", e.target.value)}
            >
              {provinceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Seller address" required>
              <input
                className={inputClass}
                value={payload.sellerAddress}
                onChange={(e) => updatePayload("sellerAddress", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <Divider label="Buyer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Buyer registration type" required>
            <select
              className={inputClass}
              value={payload.buyerRegistrationType}
              onChange={(e) =>
                updatePayload(
                  "buyerRegistrationType",
                  e.target.value as InvoicePayload["buyerRegistrationType"],
                )
              }
            >
              <option value="Registered">Registered</option>
              <option value="Unregistered">Unregistered</option>
            </select>
          </Field>
          <Field
            label="Buyer NTN/CNIC"
            required={payload.buyerRegistrationType === "Registered"}
            hint="Optional when Unregistered"
          >
            <input
              className={inputClass}
              value={payload.buyerNTNCNIC}
              onChange={(e) => updatePayload("buyerNTNCNIC", e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="Buyer business name" required>
            <input
              className={inputClass}
              value={payload.buyerBusinessName}
              onChange={(e) => updatePayload("buyerBusinessName", e.target.value)}
            />
          </Field>
          <Field label="Buyer province" required>
            <select
              className={inputClass}
              value={payload.buyerProvince}
              onChange={(e) => updatePayload("buyerProvince", e.target.value)}
            >
              {provinceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-2">
            <Field label="Buyer address" required>
              <input
                className={inputClass}
                value={payload.buyerAddress}
                onChange={(e) => updatePayload("buyerAddress", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {effectiveEnv === "sandbox" && (
          <>
            <Divider label="Sandbox scenario" />
            <Field label="Scenario ID" required hint="Required only for sandbox testing">
              <select
                className={inputClass}
                value={payload.scenarioId ?? ""}
                onChange={(e) => {
                  const sid = e.target.value;
                  const sc = SCENARIOS.find((s) => s.id === sid);
                  setPayload((p) => ({
                    ...p,
                    scenarioId: sid,
                    items: p.items.map((it) => (sc ? { ...it, saleType: sc.saleType } : it)),
                  }));
                }}
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.description}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
      </section>

      <section className={cardClass}>
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={sectionTitle}>Items</h2>
            <p className={sectionSubtitle}>One row per line item on the invoice.</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className={buttonSecondary + " w-full sm:w-auto"}
          >
            + Add item
          </button>
        </header>

        <div className="flex flex-col gap-4">
          {payload.items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Item #{idx + 1}</span>
                {payload.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Field label="HS code" required>
                  <input
                    className={inputClass}
                    value={it.hsCode}
                    placeholder="0101.2100"
                    onChange={(e) => updateItem(idx, { hsCode: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
                  <Field label="Product description" required>
                    <input
                      className={inputClass}
                      value={it.productDescription}
                      onChange={(e) => updateItem(idx, { productDescription: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Sale type" required>
                  <input
                    className={inputClass}
                    value={it.saleType}
                    onChange={(e) => updateItem(idx, { saleType: e.target.value })}
                  />
                </Field>
                <Field label="Rate" required hint='e.g. "18%"'>
                  <input
                    className={inputClass}
                    value={it.rate}
                    onChange={(e) => updateItem(idx, { rate: e.target.value })}
                  />
                </Field>
                <Field label="UoM" required>
                  <select
                    className={inputClass}
                    value={it.uoM}
                    onChange={(e) => updateItem(idx, { uoM: e.target.value })}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {uomOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity" required>
                  <input
                    type="number"
                    step="0.0001"
                    className={inputClass}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Sales value (excl. ST)" required>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.valueSalesExcludingST}
                    onChange={(e) =>
                      updateItem(idx, { valueSalesExcludingST: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Total values (incl. tax)" required>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.totalValues}
                    onChange={(e) => updateItem(idx, { totalValues: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Fixed/notified or retail price" required>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.fixedNotifiedValueOrRetailPrice}
                    onChange={(e) =>
                      updateItem(idx, {
                        fixedNotifiedValueOrRetailPrice: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Sales tax applicable" required>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.salesTaxApplicable}
                    onChange={(e) =>
                      updateItem(idx, { salesTaxApplicable: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="ST withheld at source" required>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.salesTaxWithheldAtSource}
                    onChange={(e) =>
                      updateItem(idx, { salesTaxWithheldAtSource: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Extra tax">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.extraTax}
                    onChange={(e) => updateItem(idx, { extraTax: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Further tax">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.furtherTax}
                    onChange={(e) => updateItem(idx, { furtherTax: Number(e.target.value) })}
                  />
                </Field>
                <Field label="FED payable">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.fedPayable}
                    onChange={(e) => updateItem(idx, { fedPayable: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Discount">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={it.discount}
                    onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                  />
                </Field>
                <Field label="SRO schedule no.">
                  <input
                    className={inputClass}
                    value={it.sroScheduleNo}
                    onChange={(e) => updateItem(idx, { sroScheduleNo: e.target.value })}
                  />
                </Field>
                <Field label="SRO item serial no.">
                  <input
                    className={inputClass}
                    value={it.sroItemSerialNo}
                    onChange={(e) => updateItem(idx, { sroItemSerialNo: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`${cardClass} sticky bottom-3 z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="text-xs text-slate-500">
          Sending to{" "}
          <span className="font-mono font-medium text-slate-700">
            {effectiveEnv === "sandbox" ? "Sandbox" : "Production"}
          </span>
          . Validate first to surface any errors without committing.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => submit("validate")}
            disabled={Boolean(busy)}
            className={buttonSecondary}
          >
            {busy === "validate" ? "Validating…" : "Validate"}
          </button>
          <button
            type="button"
            onClick={() => submit("post")}
            disabled={Boolean(busy)}
            className={buttonSuccess}
          >
            {busy === "post" ? "Posting…" : "Post invoice"}
          </button>
        </div>
      </section>

      {result && (
        <section className={cardClass}>
          <header className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className={sectionTitle}>Response</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                result.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {result.mode} · {result.ok ? "OK" : "ERROR"} · HTTP {result.upstreamStatus}
            </span>
          </header>
          {result.data?.invoiceNumber && (
            <p className="mb-2 text-sm text-slate-700">
              Invoice number:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900">
                {result.data.invoiceNumber}
              </code>
            </p>
          )}
          {result.data?.validationResponse && (
            <p className="mb-3 text-sm text-slate-700">
              Status: <strong>{result.data.validationResponse.status}</strong> (code{" "}
              {result.data.validationResponse.statusCode})
              {result.data.validationResponse.error && (
                <> — {result.data.validationResponse.error}</>
              )}
            </p>
          )}
          <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(result.data ?? result.rawText, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
