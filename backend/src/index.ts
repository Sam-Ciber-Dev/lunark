import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { db } from "./db";
import * as schema from "./db/schema";
import { count } from "drizzle-orm";
import { auth } from "./routes/auth";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (c) => c.json({ name: "Lunark API", version: "0.1.0" }));

app.get("/health", async (c) => {
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.users);
  return c.json({ status: "ok", users: total });
});

app.route("/auth", auth);

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Lunark API running on http://localhost:${port}`);
});

export default app;
