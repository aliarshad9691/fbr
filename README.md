# FBR Digital Invoicing Client

Next.js 16 app that connects to the FBR / PRAL **Digital Invoicing API** (sandbox + production), with login auth, server-side token storage, a full invoice form, and reference-data lookups.

Implements the protocol from PRAL's *Technical Specification for DI API v1.12*.

---

## Quick start

```bash
cd fbr-app
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with the credentials in `.env.local`, and start posting invoices.

Default login:
- **Username:** `mese`
- **Password:** `mese@2026@fbr`

(Both come from `AUTH_USERNAME` / `AUTH_PASSWORD` in `.env.local` — change them there.)

---

## Environment variables (`.env.local`)

`.env.local` is git-ignored. Restart `npm run dev` after editing.

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_USERNAME` | yes | App login username |
| `AUTH_PASSWORD` | yes | App login password |
| `AUTH_SECRET` | yes | JWT signing secret. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | dev only | Set to `true` for local dev / when behind a proxy |
| `FBR_SANDBOX_TOKEN` | optional | Bearer token from PRAL for sandbox. If set, server uses it and the UI hides the manual input |
| `FBR_PRODUCTION_TOKEN` | optional | Bearer token from PRAL for production |
| `FBR_TOKEN` | optional | Fallback token used for *either* env if the env-specific one is missing |
| `FBR_ENV` | optional | Set to `sandbox` or `production` to lock the env toggle in the UI |

If neither env-specific token nor `FBR_TOKEN` is set for an environment, the user can paste a token in the UI Settings card; it is stored in `localStorage` and forwarded only via the app's own `/api/fbr/*` proxy routes.

---

## Authentication

- **NextAuth (Auth.js v5)** — Credentials provider, JWT session strategy.
- All pages and API routes are gated by `src/proxy.ts` (Next.js 16's renamed middleware).
- Public routes: `/login`, `/api/auth/*`, static assets.
- Anonymous browser request → 307 redirect to `/login`.
- Anonymous API request → 401 JSON.
- "Sign out" button is in the top header.

To rotate the password, edit `AUTH_PASSWORD` in `.env.local` and restart.

---

## FBR endpoints used

All under `https://gw.fbr.gov.pk` (hardcoded in `src/lib/fbr/endpoints.ts`). The bearer token goes in the `Authorization: Bearer <token>` header — handled server-side by this app.

| Purpose | Method | URL |
|---|---|---|
| Post invoice (production) | POST | `/di_data/v1/di/postinvoicedata` |
| Post invoice (sandbox) | POST | `/di_data/v1/di/postinvoicedata_sb` |
| Validate invoice (production) | POST | `/di_data/v1/di/validateinvoicedata` |
| Validate invoice (sandbox) | POST | `/di_data/v1/di/validateinvoicedata_sb` |
| Provinces | GET | `/pdi/v1/provinces` |
| Document types | GET | `/pdi/v1/doctypecode` |
| HS codes | GET | `/pdi/v1/itemdesccode` |
| UoM list | GET | `/pdi/v1/uom` |
| Transaction types | GET | `/pdi/v1/transtypecode` |
| Sale type → rate | GET | `/pdi/v2/SaleTypeToRate?date=&transTypeId=&originationSupplier=` |
| SRO schedule | GET | `/pdi/v1/SroSchedule?rate_id=&date=&origination_supplier_csv=` |
| SRO item | GET | `/pdi/v2/SROItem?date=&sro_id=` |
| HS → UoM | GET | `/pdi/v2/HS_UOM?hs_code=&annexure_id=` |
| STATL | POST | `/dist/v1/statl` |
| Get_Reg_Type | POST | `/dist/v1/Get_Reg_Type` |

Sandbox routing is selected purely by URL suffix (`_sb`). Both envs share the same token format; PRAL issues the actual token (5-year validity).

---

## Sandbox scenarios

When the active environment is **sandbox**, the form requires a `scenarioId` (e.g. `SN001`–`SN028`). Each scenario maps to a specific `saleType`. Selecting a scenario auto-fills the `saleType` on existing items.

The full list of 28 scenarios is in `src/lib/fbr/scenarios.ts`. Pick the one that matches the business activity / sale type you're testing — see the matrix in section 10 of the PRAL DI API doc.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout (light mode forced)
│   ├── page.tsx                 # Home (server component, gets session, renders AppShell)
│   ├── globals.css
│   ├── login/page.tsx           # Login page (server, redirects if already signed in)
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handlers
│       └── fbr/
│           ├── invoice/route.ts          # POST: validate or post invoice
│           ├── reference/[name]/route.ts # GET: reference data (provinces, uom, etc.)
│           ├── lookup/route.ts           # POST: STATL / Get_Reg_Type
│           └── status/route.ts           # GET: which env tokens are server-configured
├── auth.ts                      # NextAuth config (Credentials provider)
├── auth-handlers.ts             # Re-exports handlers (avoids circular import in route)
├── proxy.ts                     # Auth gate — protects all routes
├── components/
│   ├── AppShell.tsx             # Top bar, sign-out, footer
│   ├── InvoiceWorkbench.tsx     # Main form: env toggle, header, items, validate/post
│   ├── SettingsPanel.tsx        # Connection status + manual token input
│   ├── LoginForm.tsx            # Login form (client component)
│   └── Field.tsx                # Shared form primitives, button styles, card class
└── lib/fbr/
    ├── types.ts                 # InvoicePayload, InvoiceItem, ValidationResponse, etc.
    ├── endpoints.ts             # All FBR URL builders
    ├── scenarios.ts             # SN001–SN028 with sale-type mappings
    ├── server.ts                # callFbr() — server-side fetch helper
    ├── route-helpers.ts         # resolveEnv, resolveToken, unauthorized, proxyJson
    └── client.ts                # Browser-side helpers: submit, fetchReference, lookups
```

---

## How a request flows

1. User fills the form, clicks **Validate** or **Post invoice**.
2. Browser → `POST /api/fbr/invoice` with headers `x-fbr-env`, `x-fbr-mode` (`validate` | `post`), and `x-fbr-token` (only if no server-side env var is set).
3. Proxy (`src/proxy.ts`) checks the session — anon requests get 401 here.
4. Route handler resolves the env, then resolves the token in this priority:
   - `FBR_SANDBOX_TOKEN` / `FBR_PRODUCTION_TOKEN` (matched to env)
   - `FBR_TOKEN` (shared fallback)
   - `x-fbr-token` header (browser-stored)
5. Server calls FBR with `Authorization: Bearer <token>`, returns the upstream JSON to the browser.

The bearer token never leaves the server when configured via env vars.

---

## Common tasks

**Switch sandbox ↔ production:** toggle in the form header. Reference data (provinces, UoM) auto-reloads when the active token changes.

**Test the connection:** in the Settings panel, hit "Test connection" — it calls `Get_Reg_Type` with a sample reg number.

**Add an item:** click "+ Add item" inside the Items card. Items are an array; FBR requires at least one.

**Re-fetch reference data:** click "Reload" in the FBR environment card.

**Change login credentials:** edit `AUTH_USERNAME` / `AUTH_PASSWORD` in `.env.local`, restart dev server, re-login.

**Lock production-only deployments:** set `FBR_ENV=production` in the deployment's env — UI toggle becomes disabled and locked to production.

---

## Reference doc

The PRAL spec is at `/Users/aliarshad/Downloads/fbr/20257301172130815TechnicalDocumentationforDIAPIV1.12.pdf` (kept outside the app dir). Key sections:

- §3 — Web API security (bearer token usage)
- §4 — Post / Validate web methods (request/response shapes)
- §5 — Reference APIs
- §7–8 — Sales / Purchase error code tables (referenced when interpreting the `errorCode` field on responses)
- §9 — Sandbox scenarios
- §10 — Applicable scenarios per business activity

---

## Tech stack

- Next.js 16.2.4 (App Router, Turbopack)
- React 19.2.5
- NextAuth (Auth.js) 5.0 beta
- Tailwind CSS v4
- TypeScript 5

## Build / lint

```bash
npm run build    # production build
npm run dev      # dev server
npm run lint     # ESLint flat config
npm start        # serve production build
```
