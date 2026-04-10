import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { wishlistItems, products, productImages } from "../db/schema";

const wishlistRouter = new Hono();

// GET /wishlist — get user's wishlist
wishlistRouter.get("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(wishlistItems.createdAt);

  const data = await Promise.all(
    items.map(async (item) => {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .get();

      if (!product) return null;

      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.position);

      return {
        id: item.id,
        createdAt: item.createdAt,
        product: { ...product, images },
      };
    })
  );

  return c.json({ data: data.filter(Boolean) });
});

// POST /wishlist — add to wishlist
wishlistRouter.post("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { productId } = await c.req.json();
  if (!productId) return c.json({ error: "productId required" }, 400);

  // Check if already in wishlist
  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .get();

  if (existing) return c.json({ id: existing.id, message: "Already in wishlist" });

  const id = crypto.randomUUID();
  await db.insert(wishlistItems).values({
    id,
    userId,
    productId,
  });

  return c.json({ id }, 201);
});

// DELETE /wishlist/:productId — remove from wishlist
wishlistRouter.delete("/:productId", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const productId = c.req.param("productId");

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    );

  return c.json({ deleted: true });
});

// GET /wishlist/check/:productId — check if product is in wishlist
wishlistRouter.get("/check/:productId", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ inWishlist: false });

  const productId = c.req.param("productId");

  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .get();

  return c.json({ inWishlist: !!existing });
});

export { wishlistRouter };
