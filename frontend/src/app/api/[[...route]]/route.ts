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
  const session = await auth();

  const headers = new Headers(req.headers);
  // Always remove client-supplied identity — cannot be trusted
  headers.delete("x-user-id");
  // Only inject after server-side session verification
  if (session?.user?.id) {
    headers.set("x-user-id", session.user.id);
  }

  const secureReq = new Request(req, { headers });
  return honoHandle(secureReq);
}

export const GET = secureHandle;
export const POST = secureHandle;
export const PUT = secureHandle;
export const PATCH = secureHandle;
export const DELETE = secureHandle;
