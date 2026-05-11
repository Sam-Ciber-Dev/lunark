/**
 * Painel de Segurança — Traffic-logging middleware
 *
 * Drops in after `securityHeaders` / `cors` / `logger` in app.ts.
 *
 * Responsibilities:
 *  1. Resolve the real client IP (x-forwarded-for, x-real-ip, fall back).
 *  2. Read optional x-fp / x-hwfp headers (set by the frontend).
 *  3. Short-circuit blocked IPs / devices / hardware hashes with 403.
 *  4. Skip traffic endpoints themselves (no feedback loop).
 *  5. After the response, fire-and-forget log the request, including
 *     geolocation lookup + threat detection.
 */

import type { Context, Next } from "hono";
import { trafficService, isInfraIp } from "../lib/traffic-service";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export function getClientIp(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header("x-real-ip");
  if (real) return real.trim();
  const cf = c.req.header("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

export function getClientCountry(c: Context): string {
  return c.req.header("cf-ipcountry") || c.req.header("x-vercel-ip-country") || "";
}

export function getClientCity(c: Context): string {
  return c.req.header("x-vercel-ip-city") || "";
}

// ───── Cache role lookups so we can flag admin IPs/FPs instantly ─────
const roleCache = new Map<string, { role: string; expiresAt: number }>();
const ROLE_CACHE_TTL = 60_000;

async function lookupRole(userId: string): Promise<string | null> {
  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.role;
  try {
    const row = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!row) return null;
    roleCache.set(userId, { role: row.role, expiresAt: now + ROLE_CACHE_TTL });
    if (roleCache.size > 5_000) {
      for (const [k, v] of roleCache) if (v.expiresAt < now) roleCache.delete(k);
    }
    return row.role;
  } catch {
    return null;
  }
}

export async function trafficLog(c: Context, next: Next) {
  const svc = trafficService();
  await svc.init();

  const ip = getClientIp(c);
  const fp = c.req.header("x-fp") || "";
  const hwfp = c.req.header("x-hwfp") || "";
  const path = c.req.path;
  const method = c.req.method;

  // ─── Instant admin tagging: any authenticated admin request marks
  // the IP+FP as admin BEFORE the block check runs. This means an
  // administrator can never be auto-blocked even on the very first
  // request after the backend cold-starts.
  const userId = c.req.header("x-user-id");
  if (userId) {
    const role = await lookupRole(userId);
    if (role === "admin") {
      svc.registerAdminIp(ip);
      if (fp) svc.registerAdminFp(fp);
    }
  }

  // ─── Hard block: IP / device / hardware (admins are never blocked) ───
  const isAdmin = svc.isAdminIp(ip) || svc.isAdminFp(fp);
  if (
    !isAdmin &&
    (svc.isBlocked(ip) || svc.isDeviceBlocked(fp) || svc.isHardwareBlocked(hwfp))
  ) {
    return c.json({ error: "Acesso bloqueado" }, 403);
  }

  const start = Date.now();
  await next();
  const elapsed = Date.now() - start;

  // Skip non-logged paths (avoid feedback loops + noise)
  if (!svc.shouldLog(path)) return;
  if (isInfraIp(ip)) return;

  // Fire-and-forget logging — never block the response.
  const statusCode = c.res.status ?? 200;
  const userAgent = c.req.header("user-agent") || "";
  void (async () => {
    try {
      // Use edge-provided geo headers when present, otherwise look up.
      const cfCountry = getClientCountry(c);
      const cfCity = getClientCity(c);
      let geo;
      if (cfCountry) {
        geo = { country: cfCountry, city: cfCity, isVpn: false, provider: "" };
        svc.setCachedGeo(ip, geo);
      } else {
        geo = await svc.geoLookup(ip);
      }
      await svc.logRequest({
        ip,
        method,
        path,
        statusCode,
        userAgent,
        responseTimeMs: elapsed,
        fingerprintHash: fp,
        geo,
      });
    } catch {
      /* never escape */
    }
  })();
}
