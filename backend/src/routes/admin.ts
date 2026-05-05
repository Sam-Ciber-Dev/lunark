import { Hono } from "hono";
import { eq, count, desc, sum } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  productImages,
  productVariants,
  categories,
  orders,
  users,
  cartItems,
  wishlistItems,
  orderItems,
} from "../db/schema";
import { requireAdmin } from "../middleware/admin";

// In-memory admin heartbeat store (reset on cold start)
const adminPings = new Map<string, Date>();
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const adminRouter = new Hono();

adminRouter.use("*", requireAdmin);

// ——— Dashboard stats ———
adminRouter.get("/stats", async (c) => {
  const [productCount] = await db.select({ total: count() }).from(products);
  const [orderCount] = await db.select({ total: count() }).from(orders);
  const [userCount] = await db.select({ total: count() }).from(users);
  const [categoryCount] = await db.select({ total: count() }).from(categories);

  return c.json({
    products: productCount.total,
    orders: orderCount.total,
    users: userCount.total,
    categories: categoryCount.total,
  });
});

// ——— Products CRUD ———

// GET /admin/products — list all (including inactive)
adminRouter.get("/products", async (c) => {
  const rows = await db
    .select()
    .from(products)
    .orderBy(products.createdAt);

  const data = await Promise.all(
    rows.map(async (product) => {
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.position);
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));
      return { ...product, images, variants };
    })
  );

  return c.json({ data });
});

// POST /admin/products — create product
adminRouter.post("/products", async (c) => {
  const body = await c.req.json();
  const {
    name, description, price, compareAtPrice, categoryId, active, featured,
    gender, color, material, designType, style, length: garmentLength,
    sleeveLength, fit, composition, details: detailsField, fabricElasticity,
    ageGroup, images, variants,
  } = body;

  if (!name || typeof price !== "number") {
    return c.json({ error: "Name and price are required" }, 400);
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const id = crypto.randomUUID();

  await db.insert(products).values({
    id,
    name,
    slug: `${slug}-${id.slice(0, 8)}`,
    description: description ?? null,
    price,
    compareAtPrice: compareAtPrice ?? null,
    categoryId: categoryId ?? null,
    gender: gender ?? null,
    color: color ?? null,
    material: material ?? null,
    designType: designType ?? null,
    style: style ?? null,
    length: garmentLength ?? null,
    sleeveLength: sleeveLength ?? null,
    fit: fit ?? null,
    composition: composition ?? null,
    details: detailsField ?? null,
    fabricElasticity: fabricElasticity ?? null,
    ageGroup: ageGroup ?? null,
    active: active ?? true,
    featured: featured ?? false,
  });

  // Insert images
  if (Array.isArray(images)) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.insert(productImages).values({
        id: crypto.randomUUID(),
        productId: id,
        url: img.url,
        alt: img.alt ?? null,
        position: i,
      });
    }
  }

  // Insert variants
  if (Array.isArray(variants)) {
    for (const v of variants) {
      await db.insert(productVariants).values({
        id: crypto.randomUUID(),
        productId: id,
        size: v.size,
        stock: v.stock ?? 0,
      });
    }
  }

  return c.json({ id }, 201);
});

// PATCH /admin/products/:id — update product
adminRouter.patch("/products/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) return c.json({ error: "Product not found" }, 404);

  const updates: Record<string, unknown> = {};
  const fields = [
    "name", "description", "price", "compareAtPrice", "categoryId",
    "active", "featured", "gender", "color", "material", "designType",
    "style", "sleeveLength", "fit", "composition", "details",
    "fabricElasticity", "ageGroup",
  ];
  for (const field of fields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  // "length" is a reserved word in JS, handle separately
  if (body.length !== undefined) updates.length = body.length;

  if (Object.keys(updates).length > 0) {
    await db.update(products).set(updates).where(eq(products.id, id));
  }

  // Update variants if provided
  if (Array.isArray(body.variants)) {
    // Delete old variants and re-insert
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    for (const v of body.variants) {
      await db.insert(productVariants).values({
        id: crypto.randomUUID(),
        productId: id,
        size: v.size,
        stock: v.stock ?? 0,
      });
    }
  }

  // Update images if provided
  if (Array.isArray(body.images)) {
    await db.delete(productImages).where(eq(productImages.productId, id));
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      await db.insert(productImages).values({
        id: crypto.randomUUID(),
        productId: id,
        url: img.url,
        alt: img.alt ?? null,
        position: i,
      });
    }
  }

  return c.json({ updated: true });
});

// DELETE /admin/products/:id
adminRouter.delete("/products/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) return c.json({ error: "Product not found" }, 404);

  await db.delete(products).where(eq(products.id, id));
  return c.json({ deleted: true });
});

// ——— Categories CRUD ———

adminRouter.post("/categories", async (c) => {
  const body = await c.req.json();
  const { name, description, parentId, gender, position } = body;

  if (!name) return c.json({ error: "Name required" }, 400);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const id = crypto.randomUUID();
  await db.insert(categories).values({
    id,
    name,
    slug: gender ? `${gender}-${slug}` : slug,
    description: description ?? null,
    parentId: parentId ?? null,
    gender: gender ?? null,
    position: position ?? 0,
  });
  return c.json({ id, slug }, 201);
});

adminRouter.patch("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) return c.json({ error: "Category not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.parentId !== undefined) updates.parentId = body.parentId;
  if (body.gender !== undefined) updates.gender = body.gender;
  if (body.position !== undefined) updates.position = body.position;

  if (Object.keys(updates).length > 0) {
    await db.update(categories).set(updates).where(eq(categories.id, id));
  }

  return c.json({ updated: true });
});

adminRouter.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) return c.json({ error: "Category not found" }, 404);

  await db.delete(categories).where(eq(categories.id, id));
  return c.json({ deleted: true });
});

// ——— Orders management ———

// GET /admin/orders — all orders with user info
adminRouter.get("/orders", async (c) => {
  const rows = await db
    .select()
    .from(orders)
    .orderBy(orders.createdAt);

  const data = await Promise.all(
    rows.map(async (order) => {
      const user = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, order.userId))
        .get();
      return { ...order, user };
    })
  );

  return c.json({ data });
});

// PATCH /admin/orders/:id — update order status
adminRouter.patch("/orders/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.select().from(orders).where(eq(orders.id, id)).get();
  if (!existing) return c.json({ error: "Order not found" }, 404);

  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (Object.keys(updates).length > 0) {
    await db.update(orders).set(updates).where(eq(orders.id, id));
  }

  return c.json({ updated: true });
});

// ——— Admin online status ———

// POST /admin/ping — heartbeat from admin clients
adminRouter.post("/ping", (c) => {
  const userId = c.req.header("x-user-id");
  if (userId) adminPings.set(userId, new Date());
  return c.json({ ok: true });
});

// GET /admin/online — list all admins with online status
adminRouter.get("/online", async (c) => {
  const admins = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "admin"));

  const now = Date.now();
  const data = admins.map((a) => {
    const last = adminPings.get(a.id);
    return {
      id: a.id,
      name: a.name,
      online: last ? now - last.getTime() < ONLINE_THRESHOLD_MS : false,
    };
  });

  return c.json(data);
});

// ——— Top product stats ———

// GET /admin/stats/most-carted
adminRouter.get("/stats/most-carted", async (c) => {
  const rows = await db
    .select({ productId: cartItems.productId, count: count() })
    .from(cartItems)
    .groupBy(cartItems.productId)
    .orderBy(desc(count()))
    .limit(10);

  const data = await Promise.all(
    rows.map(async (r) => {
      const product = await db
        .select({ name: products.name })
        .from(products)
        .where(eq(products.id, r.productId))
        .get();
      const image = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, r.productId))
        .limit(1)
        .get();
      return { productId: r.productId, name: product?.name ?? r.productId, imageUrl: image?.url ?? null, count: r.count };
    })
  );

  return c.json(data);
});

// GET /admin/stats/most-wishlisted
adminRouter.get("/stats/most-wishlisted", async (c) => {
  const rows = await db
    .select({ productId: wishlistItems.productId, count: count() })
    .from(wishlistItems)
    .groupBy(wishlistItems.productId)
    .orderBy(desc(count()))
    .limit(10);

  const data = await Promise.all(
    rows.map(async (r) => {
      const product = await db
        .select({ name: products.name })
        .from(products)
        .where(eq(products.id, r.productId))
        .get();
      const image = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, r.productId))
        .limit(1)
        .get();
      return { productId: r.productId, name: product?.name ?? r.productId, imageUrl: image?.url ?? null, count: r.count };
    })
  );

  return c.json(data);
});

// GET /admin/stats/most-ordered
adminRouter.get("/stats/most-ordered", async (c) => {
  const rows = await db
    .select({ productId: orderItems.productId, count: sum(orderItems.quantity) })
    .from(orderItems)
    .groupBy(orderItems.productId)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(10);

  const data = await Promise.all(
    rows.map(async (r) => {
      const product = await db
        .select({ name: products.name })
        .from(products)
        .where(eq(products.id, r.productId))
        .get();
      const image = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, r.productId))
        .limit(1)
        .get();
      return { productId: r.productId, name: product?.name ?? r.productId, imageUrl: image?.url ?? null, count: Number(r.count ?? 0) };
    })
  );

  return c.json(data);
});

export { adminRouter };
