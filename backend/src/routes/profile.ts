import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { getUserId } from "../lib/get-user-id";

const profileRouter = new Hono();

// GET /profile/:userId — Get user profile.
// Even though the userId is in the path, we still require the caller to prove
// they own the session for that id — otherwise anyone could enumerate profiles
// by guessing/leaking ids.
profileRouter.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  const authedId = getUserId(c);
  if (!authedId || authedId !== userId) {
    return c.json({ error: "Não autorizado" }, 401);
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// PUT /profile/:userId — Update user profile
profileRouter.put("/:userId", async (c) => {
  const userId = c.req.param("userId");
  const authedId = getUserId(c);
  if (!authedId || authedId !== userId) {
    return c.json({ error: "Não autorizado" }, 401);
  }
  const body = await c.req.json() as { name?: string; image?: string | null };

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.name !== undefined && body.name.trim().length >= 2) {
    updates.name = body.name.trim();
  }

  if (body.image !== undefined) {
    updates.image = body.image; // null to remove, string (data URL or URL) to set
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  const updated = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return c.json(updated);
});

export { profileRouter };
