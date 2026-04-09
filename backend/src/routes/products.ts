import { Hono } from "hono";
import { eq, and, like, gte, lte, sql, count } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  productImages,
  productVariants,
  categories,
} from "../db/schema";
import { productFilterSchema } from "@lunark/shared";

const productsRouter = new Hono();

// GET /products — list with filters + pagination
productsRouter.get("/", async (c) => {
  const query = c.req.query();
  const parsed = productFilterSchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: "Filtros inválidos", details: parsed.error.flatten() }, 400);
  }

  const { category, minPrice, maxPrice, size, search, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [eq(products.active, true)];

  if (category) {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .get();
    if (cat) conditions.push(eq(products.categoryId, cat.id));
  }
  if (minPrice !== undefined) conditions.push(gte(products.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(products.price, maxPrice));
  if (search) conditions.push(like(products.name, `%${search}%`));

  const where = and(...conditions);

  // If filtering by size, we need a subquery for products that have that variant
  let productIds: string[] | undefined;
  if (size) {
    const variantsWithSize = await db
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(and(eq(productVariants.size, size), gte(productVariants.stock, 1)));
    productIds = variantsWithSize.map((v) => v.productId);
  }

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(where);

  // Get paginated products
  let rows = await db
    .select()
    .from(products)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(products.createdAt);

  // Filter by size in-memory (SQLite doesn't support IN with dynamic arrays well)
  if (productIds) {
    const idSet = new Set(productIds);
    rows = rows.filter((r) => idSet.has(r.id));
  }

  // Fetch images + variants for each product
  const data = await Promise.all(
    rows.map(async (product) => {
      const [images, variants] = await Promise.all([
        db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(productImages.position),
        db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, product.id)),
      ]);
      return { ...product, images, variants };
    })
  );

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /products/featured
productsRouter.get("/featured", async (c) => {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .limit(8);

  const data = await Promise.all(
    rows.map(async (product) => {
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.position);
      return { ...product, images };
    })
  );

  return c.json({ data });
});

// GET /products/:slug
productsRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .get();

  if (!product) {
    return c.json({ error: "Produto não encontrado" }, 404);
  }

  const [images, variants] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.position),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id)),
  ]);

  return c.json({ ...product, images, variants });
});

export { productsRouter };
