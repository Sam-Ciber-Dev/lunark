import type { Context, Next } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(c: Context, next: Next) {
  const userId = c.req.header("x-user-id");
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
    const msg = err instanceof Error ? err.message : "db error";
    return c.json({ error: `admin gate db error: ${msg}` }, 500);
  }

  if (!user || user.role !== "admin") {
    return c.json({ error: "Acesso negado" }, 403);
  }

  await next();
}
