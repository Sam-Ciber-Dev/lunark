import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "@lunark/api/app";
import { auth } from "@/lib/auth";

// Mount the Hono API under /api so routes resolve correctly
// e.g. /api/products → app handles /products
const handler = new Hono();
handler.route("/api", app);

const honoHandle = handle(handler);

/**
 * Wraps every API request to:
 * 1. Strip any client-provided x-user-id header (prevents spoofing)
 * 2. Re-inject x-user-id from the verified NextAuth session (server-side only)
 * This ensures the Hono backend always receives a trustworthy user identity.
 */
async function secureHandle(req: Request) {
  try {
    let session: Awaited<ReturnType<typeof auth>> | null = null;
    try {
      session = await auth();
    } catch (authErr) {
      console.error("[api route] auth() threw", authErr);
      const msg = authErr instanceof Error ? authErr.message : "auth failed";
      return new Response(JSON.stringify({ error: `auth error: ${msg}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = new Headers(req.headers);
    // Always remove client-supplied identity — cannot be trusted
    headers.delete("x-user-id");
    // Only inject after server-side session verification
    if (session?.user?.id) {
      headers.set("x-user-id", session.user.id);
    }

    const secureReq = new Request(req, { headers });
    return honoHandle(secureReq);
  } catch (err) {
    console.error("[api route] secureHandle threw", err);
    const msg = err instanceof Error ? err.message : "internal error";
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 4).join(" | ") : undefined;
    return new Response(JSON.stringify({ error: `route error: ${msg}`, stack }), {
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
