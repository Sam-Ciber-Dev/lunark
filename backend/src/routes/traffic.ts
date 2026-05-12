/**
 * Painel de Segurança — Public traffic endpoints
 *
 * Frontend → backend hooks for tracking sessions without admin auth.
 * All rate-limited per IP (60 req/min).
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { trafficService } from "../lib/traffic-service";
import { getClientIp } from "../middleware/traffic-log";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  signValue,
  verifySigned,
  parseCookieHeader,
  buildSetCookie,
  DEVICE_COOKIE,
  BLOCK_COOKIE,
} from "../lib/cookie-sign";
import { subscribeDeviceEvents, type DeviceEvent } from "../lib/account-events";
import { getUserId } from "../lib/get-user-id";

const trafficRouter = new Hono();

// One year — block must outlive any reasonable session.
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function issueDeviceCookies(c: any, fp: string, blocked: boolean) {
  // lk_dev = signed fingerprint hash (so the backend can re-verify a
  // returning device server-side without trusting any client header).
  c.header(
    "Set-Cookie",
    buildSetCookie(DEVICE_COOKIE, signValue(fp), {
      maxAge: DEVICE_COOKIE_MAX_AGE,
    }),
    { append: true }
  );
  // lk_blk = signed "1" while blocked, or expired immediately when not.
  if (blocked) {
    c.header(
      "Set-Cookie",
      buildSetCookie(BLOCK_COOKIE, signValue("1"), {
        maxAge: DEVICE_COOKIE_MAX_AGE,
      }),
      { append: true }
    );
  } else {
    c.header(
      "Set-Cookie",
      buildSetCookie(BLOCK_COOKIE, "", { maxAge: 0 }),
      { append: true }
    );
  }
}

// ─── Public rate limiter (60 req/60s per IP) ───
const publicRate: Map<string, number[]> = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 60;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW;
  let arr = publicRate.get(ip);
  if (!arr) {
    arr = [];
    publicRate.set(ip, arr);
  }
  while (arr.length && arr[0] < cutoff) arr.shift();
  if (arr.length >= RATE_MAX) return true;
  arr.push(now);
  if (publicRate.size > 10_000) {
    for (const [k, v] of publicRate) {
      if (!v.length || v[v.length - 1] < cutoff) publicRate.delete(k);
    }
  }
  return false;
}

// ───── GET /traffic/check-ip — middleware on the frontend calls this ─────
trafficRouter.get("/check-ip", async (c) => {
  const ip = c.req.query("ip") || getClientIp(c);
  const path = c.req.query("path") || "";
  const ua = c.req.query("ua") || "";
  const fp = c.req.query("fp") || "";
  const hwfp = c.req.query("hwfp") || "";

  if (rateLimited(ip)) return c.json({ blocked: false, rate_limited: true });

  const svc = trafficService();
  await svc.init();

  let blocked = svc.isBlocked(ip);
  if (!blocked && fp) blocked = svc.isDeviceBlocked(fp);
  if (!blocked && hwfp) blocked = svc.isHardwareBlocked(hwfp);

  if (!blocked) svc.heartbeat(ip, fp);

  if (path && !blocked) {
    void (async () => {
      try {
        const geo = await svc.geoLookup(ip);
        await svc.logRequest({
          ip,
          method: "PAGE",
          path,
          statusCode: 200,
          userAgent: ua.slice(0, 500),
          responseTimeMs: 0,
          fingerprintHash: fp,
          geo,
        });
      } catch {}
    })();
  }

  // VPN-switch detection: log an extra PAGE entry when the fingerprint
  // surfaces with a different IP than before.
  if (!blocked && fp && ip) {
    const lastIp = svc.getLastIp(fp);
    if (lastIp && lastIp !== ip) {
      void (async () => {
        try {
          const geo = await svc.geoLookup(ip);
          await svc.logRequest({
            ip,
            method: "PAGE",
            path: "/",
            statusCode: 200,
            userAgent: ua.slice(0, 500),
            responseTimeMs: 0,
            fingerprintHash: fp,
            geo,
          });
        } catch {}
      })();
    }
    svc.setLastIp(fp, ip);
  }

  return c.json({ blocked });
});

// ───── POST /traffic/visit — page-view beacon ─────
trafficRouter.post("/visit", async (c) => {
  const ip = getClientIp(c);
  if (rateLimited(ip)) return c.json({ ok: false, error: "rate_limited" });
  const body = (await c.req.json().catch(() => ({}))) as {
    page?: string;
    fp?: string;
    ua?: string;
  };
  const svc = trafficService();
  await svc.init();
  if (svc.isBlocked(ip)) return c.json({ ok: false });
  const page = (body.page || "/").slice(0, 500);
  const ua = (body.ua || c.req.header("user-agent") || "").slice(0, 500);
  void (async () => {
    try {
      const geo = await svc.geoLookup(ip);
      await svc.logRequest({
        ip,
        method: "PAGE",
        path: page,
        statusCode: 200,
        userAgent: ua,
        responseTimeMs: 0,
        fingerprintHash: body.fp ?? "",
        geo,
      });
    } catch {}
  })();
  return c.json({ ok: true });
});

// ───── POST /traffic/heartbeat — keep online status alive ─────
trafficRouter.post("/heartbeat", async (c) => {
  const ip = getClientIp(c);
  if (rateLimited(ip)) return c.json({ ok: false, error: "rate_limited" });
  const body = (await c.req.json().catch(() => ({}))) as { fp?: string };
  const svc = trafficService();
  await svc.init();
  svc.heartbeat(ip, body.fp ?? "");
  return c.json({ ok: true });
});

// ───── POST /traffic/admin-heartbeat — tags IP+FP as admin ─────
trafficRouter.post("/admin-heartbeat", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ ok: false, error: "unauthorized" }, 401);
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!user || user.role !== "admin") {
    return c.json({ ok: false, error: "unauthorized" }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { ip?: string; fp?: string };
  const ip = body.ip || getClientIp(c);
  if (!ip) return c.json({ ok: false });
  const svc = trafficService();
  await svc.init();
  svc.heartbeat(ip, body.fp ?? "");
  svc.registerAdminIp(ip);
  if (body.fp) svc.registerAdminFp(body.fp);
  return c.json({ ok: true });
});

// ───── POST /traffic/register-fingerprint ─────
trafficRouter.post("/register-fingerprint", async (c) => {
  const ip = getClientIp(c);
  if (rateLimited(ip)) return c.json({ blocked: false, rate_limited: true });

  // Hard cap the body to prevent DB bloat from oversized fingerprint blobs.
  const cl = parseInt(c.req.header("content-length") ?? "0", 10);
  if (cl > 8_192) return c.json({ blocked: false, error: "payload too large" }, 413);

  const body = (await c.req.json().catch(() => ({}))) as {
    hash?: string;
    hardwareHash?: string;
    components?: Record<string, unknown>;
    ip?: string;
  };
  if (!body.hash || typeof body.hash !== "string" || body.hash.length > 128) {
    return c.json({ blocked: false });
  }
  const svc = trafficService();
  await svc.init();
  // Whitelist + truncate component values to keep DB rows bounded.
  const ALLOWED = new Set([
    "user_agent", "platform", "language", "languages", "timezone",
    "screen", "device_pixel_ratio", "hardware_concurrency", "device_memory",
    "touch_points", "canvas", "webgl_vendor", "webgl_renderer",
    "audio", "fonts", "hardware_hash",
  ]);
  const comps: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.components ?? {})) {
    if (!ALLOWED.has(k)) continue;
    if (typeof v === "string") comps[k] = v.slice(0, 256);
    else if (typeof v === "number" || typeof v === "boolean") comps[k] = v;
  }
  if (body.hardwareHash && typeof body.hardwareHash === "string") {
    comps.hardware_hash = body.hardwareHash.slice(0, 128);
  }
  const blocked = await svc.registerFingerprint(body.ip || ip, body.hash, comps);
  // Issue HttpOnly signed cookies so the Next.js edge middleware can verify
  // the block on every navigation without trusting any client-writable state.
  issueDeviceCookies(c, body.hash, blocked);
  return c.json({ blocked });
});

// ───── GET /traffic/check-block ─────
// Server-to-server endpoint called by the Next.js edge middleware on every
// page load. Verifies the HttpOnly signed cookies and cross-checks against
// the live block lists. Always authoritative — never trusts the lk_blk
// cookie alone (it could be stale if the admin unblocked the device).
trafficRouter.get("/check-block", async (c) => {
  const ip = getClientIp(c);
  const cookies = parseCookieHeader(c.req.header("Cookie"));
  const fp = verifySigned(cookies[DEVICE_COOKIE]);
  const hwfp = c.req.header("x-hwfp") || "";

  const svc = trafficService();
  await svc.init();

  // Admins are never blocked. Re-tag here so a returning admin can never
  // be locked out even if their session token isn't on the request yet.
  const isAdmin = svc.isAdminIp(ip) || (fp ? svc.isAdminFp(fp) : false);
  if (isAdmin) {
    // Clear any stale block cookie so the middleware lets them through.
    c.header(
      "Set-Cookie",
      buildSetCookie(BLOCK_COOKIE, "", { maxAge: 0 }),
      { append: true }
    );
    return c.json({ blocked: false });
  }

  let blocked = svc.isBlocked(ip);
  if (!blocked && fp) blocked = svc.isDeviceBlocked(fp);
  if (!blocked && hwfp) blocked = svc.isHardwareBlocked(hwfp);

  // Re-issue the signed cookie so the middleware can short-circuit on the
  // very next request without a backend round-trip.
  if (fp) {
    c.header(
      "Set-Cookie",
      buildSetCookie(
        BLOCK_COOKIE,
        blocked ? signValue("1") : "",
        { maxAge: blocked ? DEVICE_COOKIE_MAX_AGE : 0 }
      ),
      { append: true }
    );
  }

  return c.json({ blocked });
});

// GET /traffic/device-events?fp=… — SSE stream that pushes an instant
// "blocked" event when an admin (or the auto-block heuristic) blocks
// the calling device's fingerprint. The client navigates to /blocked
// immediately, no page refresh required, regardless of which page the
// user is currently viewing.
//
// Security note: the fingerprint hash is non-secret (anyone can compute
// their own), and the only signals on this stream are blocked/unblocked
// for that specific fp. We additionally accept the lk_dev cookie so the
// stream can also push the user's own re-issued status without a query.
trafficRouter.get("/device-events", async (c) => {
  let fp = c.req.query("fp") ?? "";
  if (!fp) {
    // Fall back to the signed device cookie for clients that don't pass fp.
    const cookies = parseCookieHeader(c.req.header("cookie"));
    const dev = cookies[DEVICE_COOKIE];
    const verified = dev ? verifySigned(dev) : null;
    if (verified) fp = verified;
  }
  if (!fp || fp.length > 128) {
    return c.text("missing fp", 400);
  }

  const svc = trafficService();
  await svc.init();

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: "connected", data: "1" });

    // If already blocked when the stream opens, fire immediately.
    if (svc.isDeviceBlocked(fp)) {
      await stream.writeSSE({
        event: "blocked",
        data: JSON.stringify({ type: "blocked" }),
      });
      return;
    }

    const queue: DeviceEvent[] = [];
    let resolveWait: (() => void) | null = null;

    const unsubscribe = subscribeDeviceEvents(fp, (ev) => {
      queue.push(ev);
      if (resolveWait) {
        resolveWait();
        resolveWait = null;
      }
    });

    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: "ping", data: String(Date.now()) }).catch(() => {});
    }, 25_000);

    stream.onAbort(() => {
      clearInterval(heartbeat);
      unsubscribe();
      if (resolveWait) resolveWait();
    });

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((res) => { resolveWait = res; });
        }
        while (queue.length > 0) {
          const ev = queue.shift()!;
          await stream.writeSSE({
            event: ev.type,
            data: JSON.stringify(ev),
          });
          if (ev.type === "blocked") return; // terminal
        }
      }
    } finally {
      clearInterval(heartbeat);
      unsubscribe();
    }
  });
});

export { trafficRouter };
