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
import { securityHeaders } from "./middleware/security-headers";

const app = new Hono();

app.use("*", securityHeaders);
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
app.route("/products", productsRouter);
app.route("/categories", categoriesRouter);
app.route("/cart", cart);
app.route("/orders", ordersRouter);
app.route("/admin", adminRouter);
app.route("/contact", contactRouter);
app.route("/wishlist", wishlistRouter);

export default app;
