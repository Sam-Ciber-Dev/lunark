import { Hono } from "hono";
import { eq, count } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  productImages,
  productVariants,
  categories,
  orders,
  users,
} from "../db/schema";
import { requireAdmin } from "../middleware/admin";

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
  const { name, description, price, compareAtPrice, categoryId, active, featured, images, variants } = body;

  if (!name || typeof price !== "number") {
    return c.json({ error: "Nome e preço são obrigatórios" }, 400);
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
  if (!existing) return c.json({ error: "Produto não encontrado" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = body.price;
  if (body.compareAtPrice !== undefined) updates.compareAtPrice = body.compareAtPrice;
  if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
  if (body.active !== undefined) updates.active = body.active;
  if (body.featured !== undefined) updates.featured = body.featured;

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
  if (!existing) return c.json({ error: "Produto não encontrado" }, 404);

  await db.delete(products).where(eq(products.id, id));
  return c.json({ deleted: true });
});

// ——— Categories CRUD ———

adminRouter.post("/categories", async (c) => {
  const body = await c.req.json();
  const { name, description } = body;

  if (!name) return c.json({ error: "Nome obrigatório" }, 400);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const id = crypto.randomUUID();
  await db.insert(categories).values({ id, name, slug, description: description ?? null });
  return c.json({ id, slug }, 201);
});

adminRouter.patch("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) return c.json({ error: "Categoria não encontrada" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;

  if (Object.keys(updates).length > 0) {
    await db.update(categories).set(updates).where(eq(categories.id, id));
  }

  return c.json({ updated: true });
});

adminRouter.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) return c.json({ error: "Categoria não encontrada" }, 404);

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
  if (!existing) return c.json({ error: "Encomenda não encontrada" }, 404);

  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ error: "Estado inválido" }, 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (Object.keys(updates).length > 0) {
    await db.update(orders).set(updates).where(eq(orders.id, id));
  }

  return c.json({ updated: true });
});

export { adminRouter };
