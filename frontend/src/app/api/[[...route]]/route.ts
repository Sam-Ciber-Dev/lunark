import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "@lunark/api/app";
import { auth } from "@/lib/auth";
import { signApiToken } from "@/lib/api-token";

// Mount the Hono API under /api so routes resolve correctly
// e.g. /api/products → app handles /products
const handler = new Hono();
handler.route("/api", app);

const honoHandle = handle(handler);

/**
 * Wraps every API request to:
 * 1. Strip any client-provided x-user-id header (prevents spoofing).
 * 2. If a NextAuth session exists, mint a short-lived HMAC-signed token
 *    (userId + exp + HMAC-SHA256 tag) and inject it as x-user-id.
 *
 * The backend (`lib/get-user-id.ts`) verifies the signature with
 * timing-safe comparison and rejects anything missing, expired or forged.
 * Calls that reach the public Fly.io backend without going through this
 * proxy are therefore unauthenticated.
 */
async function secureHandle(req: Request) {
  try {
    let session: { user?: { id?: string } } | null = null;
    try {
      // NextAuth `auth()` is overloaded (middleware/session). Cast to the no-arg
      // session-fetch signature so TS doesn't pick the middleware overload.
      session = await (auth as unknown as () => Promise<{ user?: { id?: string } } | null>)();
    } catch (authErr) {
      console.error("[api route] auth() threw", authErr);
      return new Response(JSON.stringify({ error: "auth error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = new Headers(req.headers);
    // Always remove client-supplied identity — cannot be trusted.
    headers.delete("x-user-id");
    // Only inject after server-side session verification, and sign it so the
    // backend can verify the request came from this trusted proxy (and not
    // an attacker calling the Fly.io URL directly with a guessed userId).
    if (session?.user?.id) {
      headers.set("x-user-id", signApiToken(session.user.id));
    }

    // IMPORTANT: do NOT pass `req` as the first arg to `new Request()`.
    // Next.js wraps incoming requests in NextRequest, which has private class
    // fields (#state) that aren't carried over when cloning via the Request
    // constructor — this throws on Vercel's Node runtime. Construct from URL
    // + an explicit init object instead, only including a body when present.
    const method = req.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const secureReq = new Request(req.url, {
      method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      // @ts-expect-error — duplex is required by undici when streaming bodies
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });
    return honoHandle(secureReq);
  } catch (err) {
    console.error("[api route] secureHandle threw", err);
    // Never leak file paths, dependency versions or other internals through
    // the error response — log server-side, send a generic message.
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = secureHandle;
export const POST = secureHandle;
export const PUT = secureHandle;
export const PATCH = secureHandle;
export const DELETE = secureHandle;
