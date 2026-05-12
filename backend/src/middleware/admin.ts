import type { Context, Next } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "../lib/get-user-id";

export async function requireAdmin(c: Context, next: Next) {
  // Reads the signed token from the x-user-id header and verifies its HMAC.
  // No more "trust whatever the client sends" — a forged or missing token
  // is indistinguishable from an unauthenticated request.
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: "Não autenticado" }, 401);
  }

  let user: { role: string | null } | undefined;
  try {
    user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .get();
  } catch (err) {
    console.error("[requireAdmin] DB lookup failed", err);
    return c.json({ error: "internal error" }, 500);
  }

  if (!user || user.role !== "admin") {
    return c.json({ error: "Acesso negado" }, 403);
  }

  await next();
}
