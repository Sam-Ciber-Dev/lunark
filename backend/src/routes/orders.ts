import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  orders,
  orderItems,
  cartItems,
  products,
  productVariants,
} from "../db/schema";

const ordersRouter = new Hono();

// GET /orders — list user's orders
ordersRouter.get("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt);

  return c.json({ data: rows });
});

// GET /orders/:id — order detail with items
ordersRouter.get("/:id", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const id = c.req.param("id");
  const order = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .get();

  if (!order) return c.json({ error: "Encomenda não encontrada" }, 404);

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return c.json({ ...order, items });
});

// POST /orders — create order from cart
ordersRouter.post("/", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Não autenticado" }, 401);

  const body = await c.req.json();
  const addressId = typeof body.addressId === "string" ? body.addressId : null;

  // Get cart items
  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));

  if (items.length === 0) {
    return c.json({ error: "Carrinho vazio" }, 400);
  }

  // Resolve product + variant for each cart item & verify stock
  let total = 0;
  const resolvedItems: {
    productId: string;
    variantId: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .get();
    const variant = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .get();

    if (!product || !variant) {
      return c.json({ error: `Produto indisponível (${item.productId})` }, 409);
    }

    if (variant.stock < item.quantity) {
      return c.json(
        { error: `Stock insuficiente para ${product.name} (${variant.size})` },
        409
      );
    }

    resolvedItems.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      size: variant.size,
      price: product.price,
      quantity: item.quantity,
    });

    total += product.price * item.quantity;
  }

  // Create order
  const orderId = crypto.randomUUID();
  await db.insert(orders).values({
    id: orderId,
    userId,
    addressId,
    total: Math.round(total * 100) / 100,
  });

  // Create order items + decrement stock
  for (const ri of resolvedItems) {
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: ri.productId,
      variantId: ri.variantId,
      name: ri.name,
      size: ri.size,
      price: ri.price,
      quantity: ri.quantity,
    });

    // Decrement stock
    const variant = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, ri.variantId))
      .get();
    if (variant) {
      await db
        .update(productVariants)
        .set({ stock: variant.stock - ri.quantity })
        .where(eq(productVariants.id, ri.variantId));
    }
  }

  // Clear cart
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  return c.json({ id: orderId, total: Math.round(total * 100) / 100 }, 201);
});

export { ordersRouter };
