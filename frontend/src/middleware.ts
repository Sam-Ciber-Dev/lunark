import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Edge in-memory cache of fingerprint→blocked decisions. Keyed by the
 * signed `lk_dev` cookie value so a tampered cookie can never hit a stale
 * "not blocked" entry. TTL kept short so admin unblock actions propagate
 * within a minute even without explicit invalidation.
 *
 * Cache stores `1` for blocked, `0` for not-blocked.
 */
const blockCache = new Map<string, { result: 0 | 1; expiresAt: number }>();
const CACHE_TTL = 60_000;

async function checkBlocked(req: NextRequest): Promise<boolean> {
  const devCookie = req.cookies.get("lk_dev")?.value;
  const blkCookie = req.cookies.get("lk_blk")?.value;

  // No fingerprint cookie yet → can't be blocked server-side. The visit
  // will register on first mount; if matched, the backend sets `lk_blk`
  // HttpOnly and the next navigation gets rewritten.
  if (!devCookie) return false;

  // Fast path: a valid block cookie is signed by the backend; we still
  // trust-but-verify via the backend periodically to handle unbans.
  const cacheKey = `${devCookie}|${blkCookie ?? ""}`;
  const cached = blockCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.result === 1;
  }

  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const res = await fetch(`${API_URL}/traffic/check-block`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        "x-real-ip": req.headers.get("x-real-ip") ?? "",
        "cf-connecting-ip": req.headers.get("cf-connecting-ip") ?? "",
      },
      // Edge runtime — never cache.
      cache: "no-store",
    });
    if (!res.ok) {
      // Fail-open on backend errors so a backend outage doesn't take the
      // site down for everyone. The trafficLog middleware still 403s every
      // API call from a blocked fingerprint, so they can't do much anyway.
      return false;
    }
    const data = (await res.json()) as { blocked?: boolean };
    const result: 0 | 1 = data?.blocked ? 1 : 0;
    blockCache.set(cacheKey, { result, expiresAt: now + CACHE_TTL });
    if (blockCache.size > 10_000) {
      blockCache.forEach((v, k) => {
        if (v.expiresAt < now) blockCache.delete(k);
      });
    }
    return result === 1;
  } catch {
    return false;
  }
}

/**
 * Combined middleware:
 *  1. Device-block gate (runs on ALL routes): asks the backend if this
 *     device is blocked, using HttpOnly signed cookies (`lk_dev` + `lk_blk`)
 *     that the client cannot forge. If blocked → rewrite to /blocked.
 *  2. NextAuth gate (runs only on protected paths): unauthenticated users on
 *     /profile, /orders or /admin are redirected to /login.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the /blocked page itself, the API proxy, and Next.js internals so
  // the rewrite doesn't loop and the backend can still receive heartbeats.
  const isExempt =
    pathname.startsWith("/blocked") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (!isExempt) {
    const blocked = await checkBlocked(req);
    if (blocked) {
      const url = req.nextUrl.clone();
      url.pathname = "/blocked";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  // Only run the NextAuth auth check on the originally protected paths to
  // keep edge latency low on public routes.
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/admin")
  ) {
    // @ts-expect-error — next-auth v5 typing for middleware composition
    return auth(req);
  }
  return NextResponse.next();
}

export const config = {
  // Match everything except static assets so the device-block gate is global.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?)).*)"],
};
