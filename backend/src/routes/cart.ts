import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  cartItems,
  products,
  productImages,
  productVariants,
} from "../db/schema";
import { addToCartSchema } from "@lunark/shared";

const cart = new Hono();

// GET /cart — list cart items for user
cart.get("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));

  const data = await Promise.all(
    items.map(async (item) => {
      const [product, variant, images] = await Promise.all([
        db.select().from(products).where(eq(products.id, item.productId)).get(),
        db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .get(),
        db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, item.productId))
          .orderBy(productImages.position)
          .limit(1),
      ]);
      return {
        ...item,
        product: product
          ? { ...product, image: images[0]?.url ?? null }
          : null,
        variant,
      };
    })
  );

  return c.json({ data });
});

// POST /cart — add item to cart
cart.post("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const body = await c.req.json();
  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Dados inválidos", details: parsed.error.flatten() }, 400);
  }

  const { productId, size, quantity } = parsed.data;

  // Find the variant
  const variant = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.size, size)
      )
    )
    .get();

  if (!variant) {
    return c.json({ error: "Variante não encontrada" }, 404);
  }

  if (variant.stock < quantity) {
    return c.json({ error: "Stock insuficiente" }, 409);
  }

  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.variantId, variant.id)
      )
    )
    .get();

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > variant.stock) {
      return c.json({ error: "Stock insuficiente" }, 409);
    }
    await db
      .update(cartItems)
      .set({ quantity: newQty })
      .where(eq(cartItems.id, existing.id));
    return c.json({ id: existing.id, quantity: newQty });
  }

  const id = crypto.randomUUID();
  await db.insert(cartItems).values({
    id,
    userId,
    productId,
    variantId: variant.id,
    quantity,
  });

  return c.json({ id, quantity }, 201);
});

// PATCH /cart/:id — update quantity
cart.patch("/:id", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const id = c.req.param("id");
  const body = await c.req.json();
  const quantity = Number(body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return c.json({ error: "Quantidade inválida" }, 400);
  }

  const item = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
    .get();

  if (!item) return c.json({ error: "Item não encontrado" }, 404);

  const variant = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, item.variantId))
    .get();

  if (variant && quantity > variant.stock) {
    return c.json({ error: "Stock insuficiente" }, 409);
  }

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
  return c.json({ id, quantity });
});

// DELETE /cart/:id — remove item
cart.delete("/:id", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const id = c.req.param("id");
  const item = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
    .get();

  if (!item) return c.json({ error: "Item não encontrado" }, 404);

  await db.delete(cartItems).where(eq(cartItems.id, id));
  return c.json({ deleted: true });
});

export { cart };
