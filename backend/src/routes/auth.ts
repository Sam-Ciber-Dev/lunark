import { Hono } from "hono";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { registerSchema, loginSchema } from "@lunark/shared";

const auth = new Hono();

// POST /auth/register
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Dados inválidos", details: parsed.error.flatten() }, 400);
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return c.json({ error: "Este email já está registado" }, 409);
  }

  const passwordHash = await hash(password, 12);
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    name,
    email,
    passwordHash,
  });

  return c.json({ id, name, email }, 201);
});

// POST /auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Dados inválidos" }, 400);
  }

  const { email, password } = parsed.data;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user || !user.passwordHash) {
    return c.json({ error: "Email ou password incorretos" }, 401);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Email ou password incorretos" }, 401);
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  });
});

export { auth };
