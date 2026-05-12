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

// ───── Cache role+ban lookups so we can short-circuit on every request ─────
const userCache = new Map<string, { role: string; banned: boolean; expiresAt: number }>();
const USER_CACHE_TTL = 30_000; // 30s — tight so unban/ban propagates quickly

async function lookupUser(userId: string): Promise<{ role: string; banned: boolean } | null> {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) return { role: cached.role, banned: cached.banned };
  try {
    const row = await db
      .select({ role: users.role, isBanned: users.isBanned })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!row) return null;
    const banned = !!row.isBanned;
    userCache.set(userId, { role: row.role, banned, expiresAt: now + USER_CACHE_TTL });
    if (userCache.size > 5_000) {
      for (const [k, v] of userCache) if (v.expiresAt < now) userCache.delete(k);
    }
    return { role: row.role, banned };
  } catch {
    return null;
  }
}

/** Invalidate a cached user (call this after ban/unban admin actions). */
export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

export async function trafficLog(c: Context, next: Next) {
  const svc = trafficService();
  await svc.init();

  const ip = getClientIp(c);
  const fp = c.req.header("x-fp") || "";
  const hwfp = c.req.header("x-hwfp") || "";
  const path = c.req.path;
  const method = c.req.method;

  // ─── Instant admin tagging + banned-account rejection.
  // Any authenticated request runs through here. We resolve the role +
  // ban status (cached 30s) so a banned user with a still-valid JWT
  // cannot use ANY API endpoint until their session is invalidated.
  const userId = c.req.header("x-user-id");
  let isAdmin = false;
  if (userId) {
    const info = await lookupUser(userId);
    if (info) {
      if (info.role === "admin") {
        svc.registerAdminIp(ip);
        if (fp) svc.registerAdminFp(fp);
        isAdmin = true;
      }
      if (info.banned && !isAdmin) {
        // ACCOUNT_BANNED — the frontend interceptor / NextAuth jwt callback
        // turns this into an immediate sign-out + redirect.
        return c.json({ error: "ACCOUNT_BANNED" }, 403);
      }
    }
  }

  // ─── Hard block: IP / device / hardware (admins are never blocked) ───
  isAdmin = isAdmin || svc.isAdminIp(ip) || svc.isAdminFp(fp);
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
