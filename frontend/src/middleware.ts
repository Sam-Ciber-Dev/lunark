import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Combined middleware:
 *  1. Device-block gate (runs on ALL routes): if the `lk_blocked` cookie is
 *     set, rewrite the response to /blocked so the user gets the 404-style
 *     page regardless of which URL they typed.
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

  if (!isExempt && req.cookies.get("lk_blocked")?.value === "1") {
    const url = req.nextUrl.clone();
    url.pathname = "/blocked";
    url.search = "";
    return NextResponse.rewrite(url);
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
