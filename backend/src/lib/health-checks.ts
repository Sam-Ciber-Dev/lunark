/**
 * Health Monitor — Lunark infrastructure checks.
 *
 * Mirrors the EyeWeb /health-check endpoint structure (categories, per-service
 * status, parallel execution with timeout, summary + overall status) but
 * targets Lunark's stack: Hono on Fly.io, Turso libSQL, Vercel-hosted Next.js,
 * Brevo email, Cloudflare Turnstile, ip-api.com geo lookups, Google OAuth.
 *
 * Each check returns a tiny object the wrapper converts into a `ServiceStatus`.
 * The wrapper also handles the 10s timeout uniformly so a stuck check can
 * never wedge the panel.
 */

import { db } from "../db";
import {
  users,
  products,
  orders,
  trafficLogs,
  newsletterSubscribers,
} from "../db/schema";
import { count } from "drizzle-orm";

export type ServiceState = "online" | "offline" | "degraded" | "unknown";

export interface ServiceStatus {
  name: string;
  status: ServiceState;
  response_time_ms: number | null;
  message: string | null;
  details: Record<string, unknown> | null;
  category: string | null;
  url: string | null;
}

export interface HealthCheckResponse {
  overall_status: "healthy" | "degraded" | "critical" | "unknown";
  timestamp: string;
  services: ServiceStatus[];
  summary: { online: number; offline: number; degraded: number; unknown: number };
  categories: Record<string, ServiceStatus[]>;
}

type CheckResult = {
  status?: ServiceState;
  message?: string;
  details?: Record<string, unknown>;
  url?: string;
};

type CheckFn = () => Promise<CheckResult>;

// ─────────────────────────────────────────────────────────────────────────
//  Service wrapper — adds 10s timeout, captures response time, normalises
//  exceptions into an "offline" status.
// ─────────────────────────────────────────────────────────────────────────
async function checkService(
  name: string,
  fn: CheckFn,
  category: string
): Promise<ServiceStatus> {
  const start = Date.now();
  const timeoutMs = 10_000;
  try {
    const result = await Promise.race<CheckResult | "timeout">([
      fn(),
      new Promise<"timeout">((res) => setTimeout(() => res("timeout"), timeoutMs)),
    ]);
    if (result === "timeout") {
      return {
        name,
        status: "offline",
        response_time_ms: timeoutMs,
        message: "Timeout ao conectar ao serviço",
        details: null,
        category,
        url: null,
      };
    }
    const elapsed = Date.now() - start;
    return {
      name,
      status: result.status ?? "online",
      response_time_ms: Math.round(elapsed * 100) / 100,
      message: result.message ?? null,
      details: result.details ?? null,
      category,
      url: result.url ?? null,
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    return {
      name,
      status: "offline",
      response_time_ms: Math.round(elapsed * 100) / 100,
      message: err instanceof Error ? err.message : String(err),
      details: null,
      category,
      url: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
//  Fetch with timeout helper — used by every external HTTP probe so the
//  global 10s wrapper is never the only safety net.
// ─────────────────────────────────────────────────────────────────────────
async function fetchTimeout(
  url: string,
  init: RequestInit = {},
  ms = 5_000
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

// ═════════════════════════════════════════════════════════════════════════
//  Category 1 — Backend
// ═════════════════════════════════════════════════════════════════════════
async function checkBackendApi(): Promise<CheckResult> {
  const isProd = process.env.NODE_ENV === "production";
  return {
    status: "online",
    message: "API a responder normalmente",
    details: {
      runtime: "Hono",
      environment: isProd ? "production" : "development",
      node: process.version,
    },
    url: isProd ? "https://api.lunark.store/docs" : "http://localhost:4000/",
  };
}

// ═════════════════════════════════════════════════════════════════════════
//  Category 2 — Base de Dados (Turso libSQL)
// ═════════════════════════════════════════════════════════════════════════
function tursoDashboardUrl(): string {
  // Extract org / db name from TURSO_DATABASE_URL when possible.
  // libsql://<db-name>-<org>.turso.io  → https://app.turso.tech/<org>/databases/<db>
  const raw = process.env.TURSO_DATABASE_URL ?? "";
  try {
    const host = raw.replace(/^libsql:\/\//, "").replace(/^https?:\/\//, "").split("/")[0];
    const stem = host.replace(/\.turso\.io$/, "");
    return `https://app.turso.tech/${stem}`;
  } catch {
    return "https://app.turso.tech/";
  }
}

async function checkDatabaseConnection(): Promise<CheckResult> {
  const dash = tursoDashboardUrl();
  if (!process.env.TURSO_DATABASE_URL) {
    return { status: "unknown", message: "TURSO_DATABASE_URL não configurado", url: dash };
  }
  // A trivial select round-trips a request through the libSQL client.
  await db.select({ c: count() }).from(users).limit(1);
  return { status: "online", message: "Conexão estabelecida", url: dash };
}

async function checkTable(
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any
): Promise<CheckResult> {
  const dash = tursoDashboardUrl();
  const rows = await db.select({ c: count() }).from(table);
  const n = rows[0]?.c ?? 0;
  return {
    status: "online",
    message: `Tabela '${label}' acessível`,
    details: { registos: n },
    url: dash,
  };
}

// ═════════════════════════════════════════════════════════════════════════
//  Category 3 — Autenticação
// ═════════════════════════════════════════════════════════════════════════
async function checkGoogleOAuth(): Promise<CheckResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const dash = "https://console.cloud.google.com/apis/credentials";
  if (!clientId) {
    return { status: "unknown", message: "GOOGLE_CLIENT_ID não configurado", url: dash };
  }
  // Hit the public discovery doc — fast, unauthenticated, indicates Google
  // OAuth is reachable from this host.
  const r = await fetchTimeout("https://accounts.google.com/.well-known/openid-configuration");
  if (r.ok) {
    return {
      status: "online",
      message: "Provedor Google OAuth alcançável",
      details: { client_id_suffix: clientId.slice(-12) },
      url: dash,
    };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: dash };
}

async function checkTurnstile(): Promise<CheckResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const dash = "https://dash.cloudflare.com/?to=/:account/turnstile";
  if (!secret) {
    return { status: "unknown", message: "TURNSTILE_SECRET_KEY não configurado", url: dash };
  }
  // siteverify with an obviously-invalid token returns 200 + error codes.
  // We treat any 200 from Cloudflare as "endpoint healthy".
  const body = new URLSearchParams({ secret, response: "health-check-probe" });
  const r = await fetchTimeout(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  if (r.status === 200) {
    return { status: "online", message: "Endpoint siteverify operacional", url: dash };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: dash };
}

// ═════════════════════════════════════════════════════════════════════════
//  Category 4 — APIs Externas
// ═════════════════════════════════════════════════════════════════════════
async function checkBrevo(): Promise<CheckResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const dash = "https://app.brevo.com/settings/keys/api";
  if (!apiKey) {
    return { status: "unknown", message: "BREVO_API_KEY não configurada", url: dash };
  }
  const r = await fetchTimeout("https://api.brevo.com/v3/account", {
    headers: { "api-key": apiKey, Accept: "application/json" },
  });
  if (r.status === 401) {
    return { status: "offline", message: "API Key inválida", url: dash };
  }
  if (r.ok) {
    const data = (await r.json()) as { plan?: Array<{ type?: string }> };
    const plan = data.plan?.[0]?.type ?? "unknown";
    return {
      status: "online",
      message: "API operacional",
      details: { plano: plan },
      url: dash,
    };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: dash };
}

async function checkIpApi(): Promise<CheckResult> {
  // ip-api.com — public, no key. Used by traffic-service.geoLookup* for
  // VPN detection. Hitting a known cacheable IP is cheap and proves both
  // network egress and provider availability.
  const r = await fetchTimeout("http://ip-api.com/json/8.8.8.8?fields=status");
  if (r.ok) {
    const data = (await r.json()) as { status?: string };
    if (data.status === "success") {
      return {
        status: "online",
        message: "Lookup geo/VPN operacional",
        url: "https://members.ip-api.com/",
      };
    }
    return { status: "degraded", message: "Resposta inesperada", url: "https://ip-api.com/" };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: "https://ip-api.com/" };
}

async function checkNextAuthProxy(): Promise<CheckResult> {
  // Hit the frontend's NextAuth session endpoint with a HEAD to validate
  // the front-end deployment is alive and the auth handler is mounted.
  const base =
    process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.store";
  const url = `${base.replace(/\/$/, "")}/api/nextauth/session`;
  const r = await fetchTimeout(url, { method: "GET" });
  if (r.ok) {
    return { status: "online", message: "Sessão NextAuth alcançável", url: base };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: base };
}

// ═════════════════════════════════════════════════════════════════════════
//  Category 5 — Infraestrutura
// ═════════════════════════════════════════════════════════════════════════
async function checkFly(): Promise<CheckResult> {
  const dash = "https://fly.io/dashboard";
  const flyAppName = process.env.FLY_APP_NAME;
  if (!flyAppName) {
    if (process.env.NODE_ENV !== "production") {
      return { status: "online", message: "Ambiente local (não aplicável)", url: dash };
    }
    return { status: "unknown", message: "FLY_APP_NAME não configurado", url: dash };
  }
  // We're literally running on Fly. The fact that this handler is executing
  // proves the host is online; we still report region + machine for visibility.
  return {
    status: "online",
    message: "Fly.io operacional",
    details: {
      app: flyAppName,
      region: process.env.FLY_REGION ?? "?",
      machine: (process.env.FLY_MACHINE_ID ?? "?").slice(0, 12),
    },
    url: `https://fly.io/apps/${flyAppName}`,
  };
}

async function checkVercel(): Promise<CheckResult> {
  const url =
    process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.store";
  const dash = "https://vercel.com/dashboard";
  const r = await fetchTimeout(url, { method: "HEAD", redirect: "follow" });
  if (r.ok) {
    return { status: "online", message: "Frontend operacional", url: dash };
  }
  return { status: "degraded", message: `Status: ${r.status}`, url: dash };
}

// ═════════════════════════════════════════════════════════════════════════
//  Main runner — executes every check in parallel and aggregates.
// ═════════════════════════════════════════════════════════════════════════
export async function runHealthCheck(): Promise<HealthCheckResponse> {
  const checks: Array<[string, CheckFn, string]> = [
    // Backend
    ["Backend API", checkBackendApi, "Backend"],

    // Base de Dados
    ["Base de Dados - Conexão", checkDatabaseConnection, "Base de Dados"],
    ["Tabela: users", () => checkTable("users", users), "Base de Dados"],
    ["Tabela: products", () => checkTable("products", products), "Base de Dados"],
    ["Tabela: orders", () => checkTable("orders", orders), "Base de Dados"],
    ["Tabela: traffic_logs", () => checkTable("traffic_logs", trafficLogs), "Base de Dados"],
    [
      "Tabela: newsletter_subscribers",
      () => checkTable("newsletter_subscribers", newsletterSubscribers),
      "Base de Dados",
    ],

    // Autenticação
    ["Google OAuth", checkGoogleOAuth, "Autenticação"],
    ["Cloudflare Turnstile", checkTurnstile, "Autenticação"],
    ["NextAuth (frontend)", checkNextAuthProxy, "Autenticação"],

    // APIs Externas
    ["Brevo (Email)", checkBrevo, "APIs Externas"],
    ["ip-api.com (Geo/VPN)", checkIpApi, "APIs Externas"],

    // Infraestrutura
    ["Fly.io (Backend)", checkFly, "Infraestrutura"],
    ["Vercel (Frontend)", checkVercel, "Infraestrutura"],
  ];

  const services = await Promise.all(checks.map(([n, f, c]) => checkService(n, f, c)));

  const summary = { online: 0, offline: 0, degraded: 0, unknown: 0 };
  for (const s of services) summary[s.status] += 1;

  const categories: Record<string, ServiceStatus[]> = {};
  for (const s of services) {
    const cat = s.category ?? "Outros";
    (categories[cat] ??= []).push(s);
  }

  let overall_status: HealthCheckResponse["overall_status"];
  if (summary.offline > 0) overall_status = "critical";
  else if (summary.degraded > 0) overall_status = "degraded";
  else if (summary.unknown > services.length / 2) overall_status = "unknown";
  else overall_status = "healthy";

  return {
    overall_status,
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    services,
    summary,
    categories,
  };
}
