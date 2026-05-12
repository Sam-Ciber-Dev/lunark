import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import * as schema from "./db/schema";
import { count } from "drizzle-orm";
import { auth } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { categoriesRouter } from "./routes/categories";
import { cart } from "./routes/cart";
import { ordersRouter } from "./routes/orders";
import { adminRouter } from "./routes/admin";
import { contactRouter } from "./routes/contact";
import { wishlistRouter } from "./routes/wishlist";
import { profileRouter } from "./routes/profile";
import { newsletterRouter } from "./routes/newsletter";
import { trafficRouter } from "./routes/traffic";
import { securityHeaders } from "./middleware/security-headers";
import { trafficLog } from "./middleware/traffic-log";

const isProd = process.env.NODE_ENV === "production";

// In production we require CORS_ORIGIN to be set explicitly. Falling back to
// "http://localhost:3000" silently in production would either break the site
// or, worse, accept requests from an unintended origin if reconfigured later.
if (isProd && !process.env.CORS_ORIGIN) {
  console.error(
    "[startup] CORS_ORIGIN is not set in production — refusing all cross-origin requests until configured",
  );
}
const corsOrigin = process.env.CORS_ORIGIN ?? (isProd ? "https://invalid.invalid" : "http://localhost:3000");

const app = new Hono();

app.use("*", securityHeaders);
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use("*", trafficLog);

// Global error handler. We log the full error server-side but never leak the
// stack to the client in production — stacks reveal internal file paths,
// dependency versions and sometimes secrets baked into bundled code.
app.onError((err, c) => {
  console.error("[hono onError]", err);
  const message = err instanceof Error ? err.message : "internal error";
  const body: Record<string, unknown> = { error: isProd ? "internal error" : message };
  if (!isProd && err instanceof Error) {
    body.stack = err.stack?.split("\n").slice(0, 3).join(" | ");
  }
  return c.json(body, 500);
});

app.get("/", (c) => c.json({ name: "Lunark API", version: "0.1.0" }));

app.get("/health", async (c) => {
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.users);
  return c.json({ status: "ok", users: total });
});

app.route("/auth", auth);
app.route("/products", productsRouter);
app.route("/categories", categoriesRouter);
app.route("/cart", cart);
app.route("/orders", ordersRouter);
app.route("/admin", adminRouter);
app.route("/contact", contactRouter);
app.route("/wishlist", wishlistRouter);
app.route("/profile", profileRouter);
app.route("/newsletter", newsletterRouter);
app.route("/traffic", trafficRouter);

export default app;
