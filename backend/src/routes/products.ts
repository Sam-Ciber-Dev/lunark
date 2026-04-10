import { Hono } from "hono";
import { eq, and, like, gte, lte, sql, count, desc, asc, isNotNull, or } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  productImages,
  productVariants,
  categories,
} from "../db/schema";
import { productFilterSchema } from "@lunark/shared";

const productsRouter = new Hono();

// GET /products — list with filters + pagination + sort
productsRouter.get("/", async (c) => {
  const query = c.req.query();
  const parsed = productFilterSchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: "Invalid filters", details: parsed.error.flatten() }, 400);
  }

  const {
    category, gender, minPrice, maxPrice, size, color, material,
    designType, style, length: garmentLength, sleeveLength, fit, details: detailsFilter,
    fabricElasticity, ageGroup, search, sort, page, limit, onSale,
  } = parsed.data;
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
  if (gender) conditions.push(eq(products.gender, gender));
  if (minPrice !== undefined) conditions.push(gte(products.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(products.price, maxPrice));
  if (color) conditions.push(eq(products.color, color));
  if (material) conditions.push(eq(products.material, material));
  if (designType) conditions.push(eq(products.designType, designType));
  if (style) conditions.push(eq(products.style, style));
  if (garmentLength) conditions.push(eq(products.length, garmentLength));
  if (sleeveLength) conditions.push(eq(products.sleeveLength, sleeveLength));
  if (fit) conditions.push(eq(products.fit, fit));
  if (detailsFilter) conditions.push(like(products.details, `%${detailsFilter}%`));
  if (fabricElasticity) conditions.push(eq(products.fabricElasticity, fabricElasticity));
  if (ageGroup) conditions.push(eq(products.ageGroup, ageGroup));
  if (onSale) conditions.push(isNotNull(products.compareAtPrice));
  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.description, `%${search}%`)
      )!
    );
  }

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

  // Build order clause based on sort
  const orderClause = (() => {
    switch (sort) {
      case "newest": return desc(products.createdAt);
      case "popular": return desc(products.salesCount);
      case "price-asc": return asc(products.price);
      case "price-desc": return desc(products.price);
      default: return desc(products.featured); // recommended: featured first, then newest
    }
  })();

  // Get paginated products
  let rows = await db
    .select()
    .from(products)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderClause);

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

// GET /products/search-suggestions — smart search autocomplete
productsRouter.get("/search-suggestions", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) return c.json({ suggestions: [] });

  // Search products by name matching
  const matchingProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      gender: products.gender,
      price: products.price,
      salesCount: products.salesCount,
    })
    .from(products)
    .where(
      and(
        eq(products.active, true),
        or(
          like(products.name, `%${q}%`),
          like(products.description, `%${q}%`)
        )
      )
    )
    .orderBy(desc(products.salesCount))
    .limit(8);

  // Get matching categories
  const matchingCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      gender: categories.gender,
    })
    .from(categories)
    .where(like(categories.name, `%${q}%`))
    .limit(5);

  // Add first image to each product suggestion
  const productSuggestions = await Promise.all(
    matchingProducts.map(async (p) => {
      const [img] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .orderBy(productImages.position)
        .limit(1);
      return { ...p, image: img?.url ?? null };
    })
  );

  return c.json({
    products: productSuggestions,
    categories: matchingCategories,
  });
});

// GET /products/new-arrivals — latest products
productsRouter.get("/new-arrivals", async (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.createdAt))
    .limit(Math.min(limit, 50));

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

// GET /products/on-sale — products with compareAtPrice
productsRouter.get("/on-sale", async (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.active, true),
        isNotNull(products.compareAtPrice)
      )
    )
    .orderBy(desc(products.salesCount))
    .limit(Math.min(limit, 50));

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
    return c.json({ error: "Product not found" }, 404);
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
