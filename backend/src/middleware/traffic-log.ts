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

export async function trafficLog(c: Context, next: Next) {
  const svc = trafficService();
  await svc.init();

  const ip = getClientIp(c);
  const fp = c.req.header("x-fp") || "";
  const hwfp = c.req.header("x-hwfp") || "";
  const path = c.req.path;
  const method = c.req.method;

  // ─── Hard block: IP / device / hardware ───
  if (svc.isBlocked(ip) || svc.isDeviceBlocked(fp) || svc.isHardwareBlocked(hwfp)) {
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
