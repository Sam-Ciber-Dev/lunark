/**
 * Pull the authenticated userId off the request.
 *
 * The frontend signs an HMAC token (see lib/api-token.ts) and sends it in the
 * `x-user-id` header. This helper verifies the signature *once* per request,
 * caches the result on the context, and returns null for missing/forged/expired
 * tokens. Public routes simply receive null and behave as "guest".
 *
 * Routes that require authentication should:
 *   const userId = getUserId(c);
 *   if (!userId) return c.json({ error: "Não autenticado" }, 401);
 */

import type { Context } from "hono";
import { verifyApiToken } from "./api-token";

const KEY = "userIdVerified";

export function getUserId(c: Context): string | null {
  const cached = (c.get as (k: string) => unknown)(KEY);
  if (typeof cached === "string") return cached;
  if (cached === null) return null;

  const header = c.req.header("x-user-id");
  const userId = verifyApiToken(header);
  // Cache either way so we don't re-verify on subsequent calls.
  (c.set as (k: string, v: unknown) => void)(KEY, userId);
  return userId;
}
