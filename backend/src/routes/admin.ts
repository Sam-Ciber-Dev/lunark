import { Hono } from "hono";
import { eq, gt, count, desc, sum, asc, and, isNull, like, or } from "drizzle-orm";
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
  adminChatMessages,
  newsletterSubscribers,
  newsletterBannedEmails,
  supportTickets,
  supportMessages,
} from "../db/schema";
import { requireAdmin } from "../middleware/admin";
import { invalidateUserCache } from "../middleware/traffic-log";
import {
  sendNewsletterBroadcast,
  sendSupportReply,
  sendAccountBannedEmail,
  sendAccountUnbannedEmail,
  sendAccountRenamedEmail,
  sendAccountDeletedEmail,
} from "../lib/email";

// In-memory admin heartbeat store (reset on cold start)
const adminPings = new Map<string, Date>();
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const adminRouter = new Hono();

adminRouter.use("*", requireAdmin);

// ——— Dashboard stats ———
adminRouter.get("/stats", async (c) => {
  const [productCount] = await db.select({ total: count() }).from(products);
  const [orderCount] = await db.select({ total: count() }).from(orders);
  const [userCount] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.role, "customer"));
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

// GET /admin/online — list all admins with online status + the Luny AI bot.
adminRouter.get("/online", async (c) => {
  const admins = await db
    .select({ id: users.id, name: users.name, image: users.image })
    .from(users)
    .where(eq(users.role, "admin"));

  const now = Date.now();
  const data = admins.map((a) => {
    const last = adminPings.get(a.id);
    return {
      id: a.id,
      name: a.name,
      image: a.image ?? null,
      online: last ? now - last.getTime() < ONLINE_THRESHOLD_MS : false,
      role: "admin" as const,
    };
  });

  // Luny is "always online" as long as Groq is configured.
  data.push({
    id: "__luny__",
    name: "Luny",
    image: null,
    online: !!process.env.GROQ_API_KEY,
    role: "ai" as unknown as "admin",
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

// ——— Chat Admin (shared multi-admin chat + AI @luny) ———

const CHAT_SYSTEM_PROMPT = `És a Luny, a assistente de IA do painel de administração da loja Lunark.
Ajudas os administradores a gerir a loja: produtos, encomendas, clientes, marketing, segurança, suporte.
Responde sempre na mesma língua que o admin escreveu (Português ou Inglês).
Sê concisa, profissional e direta. Quando úteis, sugere comandos práticos ou ações concretas no painel.
Tens vários administradores nesta conversa partilhada — quando alguém te mencionar com @luny, responde a essa pessoa.`;

const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const MAX_CONTENT_LEN = 4000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB per file (base64-encoded inline)
const MAX_ATTACHMENTS_PER_MSG = 4;
const AI_MENTION_RE = /@(?:luny|eye)\b/i;

interface Attachment {
  name: string;
  mime: string;
  size: number;
  /** data: URL (base64) so it can be rendered/sent to vision model directly. */
  dataUrl: string;
}

interface StoredMessage {
  id: string;
  authorId: string | null;
  authorRole: "admin" | "ai";
  authorName: string;
  authorImage: string | null;
  content: string;
  attachments: Attachment[];
  replyTo: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

function parseAttachments(raw: string | null): Attachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Decode the text payload of a `data:` URL. Returns null for binary content
 * we can't safely turn into a string. Used to feed .txt / .md / .csv contents
 * straight into the AI prompt.
 */
function decodeDataUrlText(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const meta = dataUrl.slice(5, comma); // strip "data:"
  const payload = dataUrl.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  try {
    if (isBase64) {
      const buf = Buffer.from(payload, "base64");
      return buf.toString("utf8");
    }
    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

function rowToMessage(row: typeof adminChatMessages.$inferSelect): StoredMessage {
  const deleted = !!row.deletedAt;
  return {
    id: row.id,
    authorId: row.authorId ?? null,
    authorRole: row.authorRole as "admin" | "ai",
    authorName: row.authorName,
    authorImage: row.authorImage ?? null,
    content: deleted ? "" : row.content,
    attachments: deleted ? [] : parseAttachments(row.attachments ?? null),
    replyTo: row.replyTo ?? null,
    editedAt: row.editedAt ?? null,
    deletedAt: row.deletedAt ?? null,
    createdAt: row.createdAt,
  };
}

function validateAttachments(input: unknown): Attachment[] | { error: string } {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return { error: "attachments must be an array" };
  if (input.length > MAX_ATTACHMENTS_PER_MSG) {
    return { error: `Too many attachments (max ${MAX_ATTACHMENTS_PER_MSG})` };
  }
  const out: Attachment[] = [];
  for (const a of input) {
    if (!a || typeof a !== "object") return { error: "invalid attachment" };
    const obj = a as Record<string, unknown>;
    const name = typeof obj.name === "string" ? obj.name.slice(0, 200) : null;
    const mime = typeof obj.mime === "string" ? obj.mime.slice(0, 100) : null;
    const size = typeof obj.size === "number" ? obj.size : null;
    const dataUrl = typeof obj.dataUrl === "string" ? obj.dataUrl : null;
    if (!name || !mime || size === null || !dataUrl) return { error: "incomplete attachment" };
    if (!dataUrl.startsWith("data:")) return { error: "attachment must be a data URL" };
    if (size > MAX_ATTACHMENT_BYTES) return { error: `Attachment too large (max ${MAX_ATTACHMENT_BYTES} bytes)` };
    if (dataUrl.length > MAX_ATTACHMENT_BYTES * 1.5) return { error: "Attachment payload too large" };
    out.push({ name, mime, size, dataUrl });
  }
  return out;
}

// GET /admin/chat/messages?since=<ISO>&limit=<n>
adminRouter.get("/chat/messages", async (c) => {
  const since = c.req.query("since");
  const limitRaw = Number(c.req.query("limit") ?? "100");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;

  const where = since ? gt(adminChatMessages.createdAt, since) : undefined;
  const rows = await db
    .select()
    .from(adminChatMessages)
    .where(where as ReturnType<typeof gt> | undefined)
    .orderBy(asc(adminChatMessages.createdAt))
    .limit(limit);

  return c.json({ data: rows.map(rowToMessage) });
});

// GET /admin/chat/members — list all admins for mention autocomplete + profiles
adminRouter.get("/chat/members", async (c) => {
  const rows = await db
    .select({ id: users.id, name: users.name, image: users.image, email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));
  return c.json({ data: rows });
});

// POST /admin/chat/messages — create a message; trigger AI if @luny is mentioned
adminRouter.post("/chat/messages", async (c) => {
  try {
  const userId = c.req.header("x-user-id")!;
  const body = (await c.req.json().catch(() => ({}))) as {
    content?: string;
    attachments?: unknown;
    replyTo?: string | null;
  };

  const content = typeof body.content === "string" ? body.content.slice(0, MAX_CONTENT_LEN) : "";
  const attachmentsResult = validateAttachments(body.attachments);
  if (!Array.isArray(attachmentsResult)) {
    return c.json({ error: attachmentsResult.error }, 400);
  }
  const attachments = attachmentsResult;

  if (!content.trim() && attachments.length === 0) {
    return c.json({ error: "content or attachments required" }, 400);
  }

  const author = await db
    .select({ id: users.id, name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!author) return c.json({ error: "author not found" }, 404);

  const id = crypto.randomUUID();
  await db.insert(adminChatMessages).values({
    id,
    authorId: author.id,
    authorRole: "admin",
    authorName: author.name,
    authorImage: author.image ?? null,
    content,
    attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    replyTo: body.replyTo ?? null,
  });

  const userRow = await db.select().from(adminChatMessages).where(eq(adminChatMessages.id, id)).get();
  const userMsg = rowToMessage(userRow!);

  // AI reply if @luny or @eye mentioned
  let aiMsg: StoredMessage | null = null;
  if (AI_MENTION_RE.test(content)) {
    aiMsg = await generateAiReply({ trigger: userMsg }).catch((err: unknown) => {
      console.error("[admin/chat] AI reply failed", err);
      return null;
    });
  }

  return c.json({ data: aiMsg ? [userMsg, aiMsg] : [userMsg] }, 201);
  } catch (err: unknown) {
    console.error("[admin/chat] POST /chat/messages failed", err);
    const msg = err instanceof Error ? err.message : "internal error";
    return c.json({ error: `chat send failed: ${msg}` }, 500);
  }
});

// PATCH /admin/chat/messages/:id — edit own message
adminRouter.patch("/chat/messages/:id", async (c) => {
  const userId = c.req.header("x-user-id")!;
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { content?: string };
  const content = typeof body.content === "string" ? body.content.slice(0, MAX_CONTENT_LEN) : "";
  if (!content.trim()) return c.json({ error: "content required" }, 400);

  const existing = await db.select().from(adminChatMessages).where(eq(adminChatMessages.id, id)).get();
  if (!existing) return c.json({ error: "Message not found" }, 404);
  if (existing.authorId !== userId) return c.json({ error: "Not your message" }, 403);
  if (existing.deletedAt) return c.json({ error: "Message was unsent" }, 410);

  const now = new Date().toISOString();
  await db
    .update(adminChatMessages)
    .set({ content, editedAt: now })
    .where(eq(adminChatMessages.id, id));

  const updated = await db.select().from(adminChatMessages).where(eq(adminChatMessages.id, id)).get();
  return c.json({ data: rowToMessage(updated!) });
});

// DELETE /admin/chat/messages/:id — unsend own message (soft delete)
adminRouter.delete("/chat/messages/:id", async (c) => {
  const userId = c.req.header("x-user-id")!;
  const id = c.req.param("id");

  const existing = await db.select().from(adminChatMessages).where(eq(adminChatMessages.id, id)).get();
  if (!existing) return c.json({ error: "Message not found" }, 404);
  if (existing.authorId !== userId) return c.json({ error: "Not your message" }, 403);

  const now = new Date().toISOString();
  await db
    .update(adminChatMessages)
    .set({ deletedAt: now, content: "", attachments: null })
    .where(eq(adminChatMessages.id, id));

  return c.json({ ok: true });
});

// DELETE /admin/chat/messages — clear entire shared history (admin-only).
// Hard delete so the chat truly resets. Already protected by requireAdmin gate.
adminRouter.delete("/chat/messages", async (c) => {
  try {
    await db.delete(adminChatMessages);
    return c.json({ ok: true });
  } catch (err) {
    console.error("[admin/chat] clear history failed", err);
    const msg = err instanceof Error ? err.message : "internal error";
    return c.json({ error: `clear failed: ${msg}` }, 500);
  }
});

/* ─── AI helpers ─── */

interface GroqTextContent {
  type: "text";
  text: string;
}
interface GroqImageContent {
  type: "image_url";
  image_url: { url: string };
}
type GroqContent = string | (GroqTextContent | GroqImageContent)[];

interface GroqHistoryMsg {
  role: "system" | "user" | "assistant";
  content: GroqContent;
  name?: string;
}

async function generateAiReply({ trigger }: { trigger: StoredMessage }): Promise<StoredMessage | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[admin/chat] GROQ_API_KEY missing — skipping AI reply");
    return saveAiMessage(
      "⚠️ A Luny não está configurada neste ambiente (GROQ_API_KEY em falta). Avisa o administrador do sistema."
    );
  }

  // Pull last ~15 messages as history (excluding deleted)
  const recent = await db
    .select()
    .from(adminChatMessages)
    .orderBy(desc(adminChatMessages.createdAt))
    .limit(15);
  const history = recent
    .filter((r) => !r.deletedAt)
    .reverse()
    .map(rowToMessage);

  const hasImages = history.some((m) =>
    m.attachments.some((a) => a.mime.startsWith("image/"))
  );
  const model = hasImages ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;

  const messages: GroqHistoryMsg[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...history.map((m): GroqHistoryMsg => {
      const role: "user" | "assistant" = m.authorRole === "ai" ? "assistant" : "user";
      const prefix = m.authorRole === "admin" ? `[${m.authorName}] ` : "";
      const images = m.attachments.filter((a) => a.mime.startsWith("image/"));
      const nonImage = m.attachments.filter((a) => !a.mime.startsWith("image/"));
      const fileSummaries = nonImage
        .map((a) => {
          // Inline plain-text file contents so the model can actually read them.
          const isText =
            a.mime.startsWith("text/") ||
            /\.(txt|md|csv|json|log|xml|yaml|yml|ini|conf)$/i.test(a.name);
          if (isText) {
            const decoded = decodeDataUrlText(a.dataUrl);
            if (decoded !== null) {
              const truncated = decoded.length > 8000 ? decoded.slice(0, 8000) + "\n…[truncated]" : decoded;
              return `[Ficheiro anexo "${a.name}" (${a.mime}) — conteúdo:\n${truncated}\n]`;
            }
          }
          return `[Ficheiro anexo: ${a.name} (${a.mime})]`;
        })
        .join("\n");
      const textPart = [prefix + m.content, fileSummaries].filter(Boolean).join("\n");

      if (images.length > 0 && hasImages) {
        const parts: (GroqTextContent | GroqImageContent)[] = [];
        if (textPart) parts.push({ type: "text", text: textPart });
        for (const img of images) parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
        return { role, content: parts };
      }
      return { role, content: textPart };
    }),
  ];

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 1024 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[admin/chat] Groq error", res.status, text);
    return saveAiMessage(`⚠️ Erro do modelo de IA (HTTP ${res.status}). Tenta novamente daqui a pouco.`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { role: string; content: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) return saveAiMessage("⚠️ A IA respondeu vazio.");

  // Suppress unused trigger lint
  void trigger;
  return saveAiMessage(reply);
}

async function saveAiMessage(content: string): Promise<StoredMessage> {
  const id = crypto.randomUUID();
  await db.insert(adminChatMessages).values({
    id,
    authorId: null,
    authorRole: "ai",
    authorName: "Luny",
    authorImage: null,
    content,
    attachments: null,
    replyTo: null,
  });
  const row = await db.select().from(adminChatMessages).where(eq(adminChatMessages.id, id)).get();
  return rowToMessage(row!);
}

// ——— Legacy single-shot /admin/chat (kept for backward compat) ———

interface LegacyChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

adminRouter.post("/chat", async (c) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GROQ_API_KEY not configured" }, 500);
  }

  const body = await c.req.json().catch(() => null);
  const incoming = Array.isArray(body?.messages) ? (body.messages as LegacyChatMessage[]) : null;
  if (!incoming || incoming.length === 0) {
    return c.json({ error: "messages array is required" }, 400);
  }

  const sanitized: LegacyChatMessage[] = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (sanitized.length === 0) {
    return c.json({ error: "no valid messages" }, 400);
  }

  const payload = {
    model: GROQ_TEXT_MODEL,
    messages: [{ role: "system" as const, content: CHAT_SYSTEM_PROMPT }, ...sanitized],
    temperature: 0.6,
    max_tokens: 1024,
  };

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[admin/chat] Groq error", res.status, text);
    return c.json({ error: "Upstream AI error", status: res.status }, 502);
  }

  const data = (await res.json()) as {
    choices?: { message?: { role: string; content: string } }[];
  };
  const message = data.choices?.[0]?.message;
  if (!message?.content) {
    return c.json({ error: "Empty response from AI" }, 502);
  }

  return c.json({ message: { role: "assistant", content: message.content } });
});

// ——————————————————————————————————————————————
// News / Newsletter broadcast
// ——————————————————————————————————————————————

// GET /admin/news/subscribers — count by locale + sample
adminRouter.get("/news/subscribers", async (c) => {
  const [total] = await db
    .select({ total: count() })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));

  const [pt] = await db
    .select({ total: count() })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.locale, "pt"),
        isNull(newsletterSubscribers.unsubscribedAt)
      )
    );

  const [en] = await db
    .select({ total: count() })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.locale, "en"),
        isNull(newsletterSubscribers.unsubscribedAt)
      )
    );

  return c.json({
    total: total.total,
    byLocale: { pt: pt.total, en: en.total },
  });
});

// POST /admin/news/broadcast — { subject, body, locale?, testEmail?, attachments? }
adminRouter.post("/news/broadcast", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    subject?: string;
    body?: string;
    locale?: "pt" | "en" | "all";
    testEmail?: string;
    attachments?: { name: string; content: string }[];
  };

  const subject = (body.subject ?? "").trim().slice(0, 200);
  const html = (body.body ?? "").trim();
  if (!subject || !html) {
    return c.json({ error: "subject e body são obrigatórios" }, 400);
  }

  // Sanitise attachments: name + base64 content only; cap total size at ~10 MB.
  const attachments = Array.isArray(body.attachments)
    ? body.attachments
        .filter((a) => a && typeof a.name === "string" && typeof a.content === "string")
        .slice(0, 10)
        .map((a) => ({ name: a.name.slice(0, 200), content: a.content }))
    : undefined;

  // Test mode — send a single email to the requesting admin.
  if (body.testEmail) {
    const result = await sendNewsletterBroadcast(
      [{ email: body.testEmail }],
      `[TESTE] ${subject}`,
      html,
      attachments
    );
    return c.json({ mode: "test", ...result });
  }

  const locale = body.locale ?? "all";
  const where =
    locale === "all"
      ? isNull(newsletterSubscribers.unsubscribedAt)
      : and(
          eq(newsletterSubscribers.locale, locale),
          isNull(newsletterSubscribers.unsubscribedAt)
        );

  const recipients = await db
    .select({ email: newsletterSubscribers.email, locale: newsletterSubscribers.locale })
    .from(newsletterSubscribers)
    .where(where);

  if (recipients.length === 0) {
    return c.json({ error: "Sem subscritores para o filtro selecionado" }, 400);
  }

  const result = await sendNewsletterBroadcast(recipients, subject, html, attachments);
  return c.json({ mode: "live", ...result });
});

// ——————————————————————————————————————————————
// Support Tickets
// ——————————————————————————————————————————————

// GET /admin/support/tickets — list
adminRouter.get("/support/tickets", async (c) => {
  const statusFilter = c.req.query("status");

  const rows = await db
    .select()
    .from(supportTickets)
    .where(
      statusFilter === "open" || statusFilter === "answered" || statusFilter === "closed"
        ? eq(supportTickets.status, statusFilter)
        : undefined
    )
    .orderBy(desc(supportTickets.createdAt))
    .limit(200);

  return c.json({ data: rows });
});

// GET /admin/support/tickets/:id — detail + messages
adminRouter.get("/support/tickets/:id", async (c) => {
  const id = c.req.param("id");
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id))
    .limit(1);

  if (!ticket) return c.json({ error: "Ticket não encontrado" }, 404);

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, id))
    .orderBy(asc(supportMessages.createdAt));

  // Mark as read when admin opens it.
  if (ticket.unread) {
    await db
      .update(supportTickets)
      .set({ unread: false })
      .where(eq(supportTickets.id, id));
  }

  return c.json({ ticket, messages });
});

// POST /admin/support/tickets/:id/reply — { body }
adminRouter.post("/support/tickets/:id/reply", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.header("x-user-id")!;
  const body = (await c.req.json().catch(() => ({}))) as { body?: string };
  const replyBody = (body.body ?? "").trim();
  if (!replyBody) return c.json({ error: "body é obrigatório" }, 400);

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id))
    .limit(1);
  if (!ticket) return c.json({ error: "Ticket não encontrado" }, 404);

  const [admin] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const adminName = admin?.name ?? "Equipa Lunark";

  const messageId = crypto.randomUUID();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  await db.insert(supportMessages).values({
    id: messageId,
    ticketId: id,
    authorRole: "admin",
    authorName: adminName,
    body: replyBody,
  });

  await db
    .update(supportTickets)
    .set({ status: "answered", unread: false, updatedAt: now })
    .where(eq(supportTickets.id, id));

  // Email the customer (Brevo). Non-blocking — if mail fails, the reply is still stored.
  void sendSupportReply({
    to: { email: ticket.senderEmail, name: ticket.senderName },
    subject: ticket.subject,
    adminName,
    body: replyBody,
  });

  return c.json({ success: true, id: messageId });
});

// POST /admin/support/tickets/:id/status — { status }
adminRouter.post("/support/tickets/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { status?: string };
  const status = body.status;
  if (status !== "open" && status !== "answered" && status !== "closed") {
    return c.json({ error: "status inválido" }, 400);
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  await db
    .update(supportTickets)
    .set({ status, updatedAt: now })
    .where(eq(supportTickets.id, id));

  return c.json({ success: true });
});

// ——————————————————————————————————————————————
// Newsletter — Subscriber list management (EyeWeb style)
// ——————————————————————————————————————————————

// GET /admin/news/subscribers/list?search=
// Returns the full list of subscribers joined with users (for the display name).
adminRouter.get("/news/subscribers/list", async (c) => {
  const search = (c.req.query("search") ?? "").trim().toLowerCase();

  const rows = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      locale: newsletterSubscribers.locale,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt,
      createdAt: newsletterSubscribers.createdAt,
      userName: users.name,
    })
    .from(newsletterSubscribers)
    .leftJoin(users, eq(users.email, newsletterSubscribers.email))
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(500);

  const filtered = search
    ? rows.filter(
        (r) =>
          r.email.toLowerCase().includes(search) ||
          (r.userName ?? "").toLowerCase().includes(search)
      )
    : rows;

  return c.json({ data: filtered });
});

// PATCH /admin/news/subscribers/:id — edit subscriber name and/or locale.
// Email is intentionally NOT editable here (it is the identity key for the
// user account). A name change touches BOTH the newsletter row (best effort)
// and the linked users table, and triggers an English notification email.
adminRouter.patch("/news/subscribers/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    reason?: string;
    locale?: "pt" | "en";
  };

  const [sub] = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);
  if (!sub) return c.json({ error: "subscritor não encontrado" }, 404);

  // Locale → newsletter row
  if (body.locale === "pt" || body.locale === "en") {
    try {
      await db
        .update(newsletterSubscribers)
        .set({ locale: body.locale })
        .where(eq(newsletterSubscribers.id, id));
    } catch {}
  }

  // Name → users row + notification email
  const newName = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (newName.length > 0) {
    if (reason.length === 0) {
      return c.json({ error: "É obrigatório indicar um motivo para alterar o nome." }, 400);
    }
    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, sub.email))
      .limit(1);
    if (u && u.name !== newName) {
      await db
        .update(users)
        .set({ name: newName, updatedAt: new Date().toISOString() })
        .where(eq(users.id, u.id));
      try { await sendAccountRenamedEmail(sub.email, u.name, newName, reason); } catch {}
    }
  }

  return c.json({ success: true });
});

// DELETE /admin/news/subscribers/:id — fully delete the user account (and its
// newsletter subscription). A reason is required so the user gets a clear
// explanation by email. The users.id cascade removes cart / wishlist / etc.
adminRouter.delete("/news/subscribers/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const reason = (body.reason ?? "").trim().slice(0, 500);
  if (reason.length === 0) {
    return c.json({ error: "É obrigatório indicar um motivo." }, 400);
  }

  const [sub] = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);
  if (!sub) return c.json({ error: "subscritor não encontrado" }, 404);

  // Send notification email BEFORE deleting so we still have the email value.
  try { await sendAccountDeletedEmail(sub.email, reason); } catch {}

  // Delete user account if it exists. Cascade FKs remove dependent rows
  // (cart, wishlist, orders.user_id → set null, etc.). Also drop the
  // newsletter row + any banned-email entry so the email can be reused
  // freshly in the future by a new account.
  await db.delete(users).where(eq(users.email, sub.email));
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  await db.delete(newsletterBannedEmails).where(eq(newsletterBannedEmails.email, sub.email));

  return c.json({ success: true });
});

// POST /admin/news/subscribers/:id/ban — full account ban.
// Reason is REQUIRED. Marks the user as banned (so login / register / Google
// sign-in are all refused) AND removes the newsletter subscription AND adds
// the email to the newsletter ban list. Sends an English notification email.
adminRouter.post("/news/subscribers/:id/ban", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const reason = (body.reason ?? "").trim().slice(0, 500);
  if (reason.length === 0) {
    return c.json({ error: "É obrigatório indicar um motivo." }, 400);
  }

  const [row] = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);

  if (!row) return c.json({ error: "subscritor não encontrado" }, 404);

  await db
    .insert(newsletterBannedEmails)
    .values({ email: row.email, reason })
    .onConflictDoNothing();

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));

  // Flip the user account into banned state if one exists.
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, row.email))
    .limit(1);
  if (target) {
    await db
      .update(users)
      .set({
        isBanned: true,
        bannedAt: new Date().toISOString(),
        banReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, target.id));
    try { invalidateUserCache(target.id); } catch {}
  }

  try { await sendAccountBannedEmail(row.email, reason); } catch {}

  return c.json({ success: true });
});

// GET /admin/news/banned — banned emails list
adminRouter.get("/news/banned", async (c) => {
  const search = (c.req.query("search") ?? "").trim().toLowerCase();

  const rows = await db
    .select()
    .from(newsletterBannedEmails)
    .orderBy(desc(newsletterBannedEmails.bannedAt))
    .limit(500);

  const filtered = search
    ? rows.filter((r) => r.email.toLowerCase().includes(search))
    : rows;

  return c.json({ data: filtered });
});

// POST /admin/news/banned — manually ban an email (also flips any user
// account matching that email into the banned state).
adminRouter.post("/news/banned", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; reason?: string };
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = (body.email ?? "").trim().toLowerCase();
  const reason = (body.reason ?? "").trim().slice(0, 500);
  if (!emailRe.test(email) || email.length > 200) {
    return c.json({ error: "email inválido" }, 400);
  }
  if (reason.length === 0) {
    return c.json({ error: "É obrigatório indicar um motivo." }, 400);
  }

  await db
    .insert(newsletterBannedEmails)
    .values({ email, reason })
    .onConflictDoNothing();

  // Also remove from active subscribers if present.
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));

  // Flip user account if it exists.
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (u) {
    await db
      .update(users)
      .set({
        isBanned: true,
        bannedAt: new Date().toISOString(),
        banReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, u.id));
    try { invalidateUserCache(u.id); } catch {}
  }

  try { await sendAccountBannedEmail(email, reason); } catch {}

  return c.json({ success: true });
});

// DELETE /admin/news/banned/:email — unban an email and restore the user
// account (if any). Also re-adds them to the active subscribers list so the
// unban is fully symmetric with the ban (which removed the subscription).
// Sends an English notification email.
adminRouter.delete("/news/banned/:email", async (c) => {
  const email = decodeURIComponent(c.req.param("email")).toLowerCase();
  await db.delete(newsletterBannedEmails).where(eq(newsletterBannedEmails.email, email));

  // Restore user account if it exists, and grab the locale for the subscription row.
  const [u] = await db
    .select({ id: users.id, locale: users.locale })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (u) {
    await db
      .update(users)
      .set({
        isBanned: false,
        bannedAt: null,
        banReason: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, u.id));
    // Bust the in-memory ban cache so the next API call from this user
    // is allowed through immediately (no 30s wait).
    try { invalidateUserCache(u.id); } catch {}
  }

  // Restore newsletter subscription (ban deletes the row; unban should put it back).
  await db
    .insert(newsletterSubscribers)
    .values({
      id: crypto.randomUUID(),
      email,
      locale: (u?.locale as "pt" | "en") ?? "pt",
    })
    .onConflictDoNothing();

  try { await sendAccountUnbannedEmail(email); } catch {}

  return c.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════
// PAINEL DE SEGURANÇA — Traffic monitor admin routes
// ═══════════════════════════════════════════════════════════════
import {
  trafficLogs,
  trafficSuspicious,
  trafficBlockedIps,
  trafficBlockedDevices,
  trafficDeviceIps,
  trafficVpnCache,
  trafficReports,
} from "../db/schema";
import { trafficService, isInfraIp } from "../lib/traffic-service";
import { gte, lt, inArray } from "drizzle-orm";

// Helper — start of today (UTC) as ISO string for createdAt comparisons.
function todayStartUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().replace("T", " ").slice(0, 19); // matches sqlite datetime('now')
}

// Helper — month-name in PT
const MONTH_NAMES_PT = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ───── GET /admin/traffic/stats ─────
adminRouter.get("/traffic/stats", async (c) => {
  const svc = trafficService();
  await svc.init();
  const start = todayStartUtc();

  const [{ n: reqToday } = { n: 0 }] = await db
    .select({ n: count() })
    .from(trafficLogs)
    .where(gte(trafficLogs.createdAt, start));

  const susp = await db
    .select({ ip: trafficSuspicious.ip })
    .from(trafficSuspicious)
    .where(gte(trafficSuspicious.createdAt, start));
  const suspiciousUnique = new Set(susp.map((r) => r.ip)).size;

  const [{ n: bIps } = { n: 0 }] = await db.select({ n: count() }).from(trafficBlockedIps);
  const [{ n: bDev } = { n: 0 }] = await db.select({ n: count() }).from(trafficBlockedDevices);

  return c.json({
    requests_today: reqToday,
    active_ips_5m: svc.onlineCount(),
    suspicious_today: suspiciousUnique,
    blocked_total: bIps + bDev,
  });
});

// ───── GET /admin/traffic/connections ─────
adminRouter.get("/traffic/connections", async (c) => {
  const svc = trafficService();
  await svc.init();
  const start = todayStartUtc();

  const rows = await db
    .select({
      ip: trafficLogs.ip,
      country: trafficLogs.country,
      city: trafficLogs.city,
      isVpn: trafficLogs.isVpn,
      vpnProvider: trafficLogs.vpnProvider,
      method: trafficLogs.method,
      createdAt: trafficLogs.createdAt,
      fingerprintHash: trafficLogs.fingerprintHash,
    })
    .from(trafficLogs)
    .where(gte(trafficLogs.createdAt, start))
    .orderBy(asc(trafficLogs.createdAt));

  type Conn = {
    fingerprint_hash: string;
    ips: string[];
    ip_details: { ip: string; is_vpn: boolean }[];
    country: string;
    city: string;
    is_vpn: boolean;
    vpn_provider: string;
    method: string;
    requests: number;
    online: boolean;
    is_admin: boolean;
    _ipsSet: Set<string>;
    _ipVpn: Map<string, boolean>;
    _ipLast: Map<string, string>;
    _lastSeen: string;
  };

  const seen = new Map<string, Conn>();
  for (const r of rows) {
    const ip = r.ip;
    const fp = r.fingerprintHash || "";
    if (!ip || ip === "127.0.0.1" || ip === "::1" || isInfraIp(ip)) continue;
    if (!fp) continue; // bots without fingerprint are skipped

    let conn = seen.get(fp);
    if (!conn) {
      conn = {
        fingerprint_hash: fp,
        ips: [],
        ip_details: [],
        country: r.country,
        city: r.city,
        is_vpn: r.isVpn,
        vpn_provider: r.vpnProvider,
        method: r.method,
        requests: 0,
        online: false,
        is_admin: false,
        _ipsSet: new Set(),
        _ipVpn: new Map(),
        _ipLast: new Map(),
        _lastSeen: "",
      };
      seen.set(fp, conn);
    }
    conn.requests += 1;
    if (!conn._ipsSet.has(ip)) {
      conn._ipsSet.add(ip);
      conn._ipVpn.set(ip, r.isVpn);
    } else if (r.isVpn) {
      conn._ipVpn.set(ip, true);
    }
    conn._ipLast.set(ip, r.createdAt);
    if (r.isVpn) conn.is_vpn = true;
    if (r.method === "PAGE") conn.method = "PAGE";
    conn._lastSeen = r.createdAt;
  }

  // Enrich with persistent IP history per fingerprint
  if (seen.size > 0) {
    const fps = Array.from(seen.keys());
    try {
      const hist = await db
        .select()
        .from(trafficDeviceIps)
        .where(inArray(trafficDeviceIps.fingerprintHash, fps))
        .orderBy(desc(trafficDeviceIps.lastSeenAt));
      for (const h of hist) {
        const conn = seen.get(h.fingerprintHash);
        if (!conn) continue;
        if (!conn._ipsSet.has(h.ip) && !isInfraIp(h.ip)) {
          conn._ipsSet.add(h.ip);
          conn._ipVpn.set(h.ip, h.isVpn);
          conn._ipLast.set(h.ip, h.lastSeenAt);
        }
        if (h.isVpn) conn._ipVpn.set(h.ip, true);
      }
    } catch {}
  }

  // ── Enrich each unique IP via geoLookup so the VPN column reflects the
  // current heuristic (rather than the value stored at log-insertion time,
  // which may pre-date the heuristic or have come from a stale cache).
  const allIps = new Set<string>();
  for (const c of seen.values()) for (const ip of c._ipsSet) allIps.add(ip);
  await Promise.all(
    Array.from(allIps).map(async (ip) => {
      try {
        const g = await svc.geoLookup(ip);
        if (!g.isVpn && !g.provider) return;
        for (const c of seen.values()) {
          if (!c._ipsSet.has(ip)) continue;
          if (g.isVpn) c._ipVpn.set(ip, true);
          if (g.isVpn && !c.vpn_provider) c.vpn_provider = g.provider;
        }
      } catch {}
    })
  );

  const now = Date.now();
  const out = Array.from(seen.values()).map((c) => {
    const ipList = Array.from(c._ipsSet).sort((a, b) => {
      const la = c._ipLast.get(a) ?? "";
      const lb = c._ipLast.get(b) ?? "";
      return lb.localeCompare(la);
    });
    const recent =
      c._lastSeen &&
      (() => {
        try {
          const t = Date.parse(c._lastSeen.replace(" ", "T") + "Z");
          return now - t < 120_000;
        } catch {
          return false;
        }
      })();
    const hb = svc.isOnlineFp(c.fingerprint_hash) ||
      Array.from(c._ipsSet).some((ip) => svc.isOnline(ip));
    return {
      fingerprint_hash: c.fingerprint_hash,
      ips: ipList,
      ip_details: ipList.map((ip) => ({ ip, is_vpn: !!c._ipVpn.get(ip) })),
      country: c.country,
      city: c.city,
      is_vpn: ipList.some((ip) => !!c._ipVpn.get(ip)),
      vpn_provider: c.vpn_provider,
      method: c.method,
      requests: c.requests,
      online: hb || !!recent,
      is_admin: svc.isAdminFp(c.fingerprint_hash),
    };
  });

  out.sort((a, b) => (a.online === b.online ? b.requests - a.requests : a.online ? -1 : 1));
  return c.json({ connections: out });
});

// ───── GET /admin/traffic/logs ─────
adminRouter.get("/traffic/logs", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 200);
  const offset = parseInt(c.req.query("offset") || "0") || 0;
  const ipQ = c.req.query("ip") || "";
  let rows;
  if (ipQ) {
    rows = await db
      .select()
      .from(trafficLogs)
      .where(eq(trafficLogs.ip, ipQ))
      .orderBy(desc(trafficLogs.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select()
      .from(trafficLogs)
      .orderBy(desc(trafficLogs.createdAt))
      .limit(limit)
      .offset(offset);
    rows = rows.filter(
      (l) => l.ip !== "127.0.0.1" && l.ip !== "::1" && !isInfraIp(l.ip)
    );
  }
  return c.json({ logs: rows, total: rows.length });
});

// ───── GET /admin/traffic/suspicious ─────
adminRouter.get("/traffic/suspicious", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 200);
  const offset = parseInt(c.req.query("offset") || "0") || 0;
  const rows = await db
    .select()
    .from(trafficSuspicious)
    .orderBy(desc(trafficSuspicious.createdAt))
    .limit(limit)
    .offset(offset);
  const filtered = rows.filter((e) => !isInfraIp(e.ip));
  return c.json({ events: filtered, total: filtered.length });
});

// ───── GET /admin/traffic/detailed-logs ─────
adminRouter.get("/traffic/detailed-logs", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "200") || 200, 500);
  const start = todayStartUtc();

  const logs = await db
    .select()
    .from(trafficLogs)
    .where(gte(trafficLogs.createdAt, start))
    .orderBy(desc(trafficLogs.createdAt))
    .limit(limit);

  const threats = await db
    .select()
    .from(trafficSuspicious)
    .where(gte(trafficSuspicious.createdAt, start))
    .orderBy(desc(trafficSuspicious.createdAt))
    .limit(limit);

  type Entry = {
    _type: "request" | "threat";
    id: string;
    ip: string;
    timestamp: string;
    method: string;
    path: string;
    status_code: number;
    user_agent: string;
    country: string;
    city: string;
    is_vpn: boolean;
    vpn_provider: string;
    response_time_ms: number;
    fingerprint_hash: string;
    event: string | null;
    severity: string | null;
    details: string | null;
    auto_blocked: boolean;
    is_admin: boolean;
  };

  const svc = trafficService();
  await svc.init();

  const entries: Entry[] = [];
  for (const l of logs) {
    if (isInfraIp(l.ip) || l.ip === "127.0.0.1" || l.ip === "::1") continue;
    // Skip server-originated requests with no fingerprint — only visits /
    // requests attributed to a real user device belong in detailed logs.
    if (!l.fingerprintHash) continue;
    // Skip admin-originated requests entirely. Admin devices send a 20-second
    // heartbeat plus every admin-panel page visit and request which pollutes
    // the detailed log feed with noise the admin did not consciously trigger.
    if (svc.isAdminFp(l.fingerprintHash) || svc.isAdminIp(l.ip)) continue;
    entries.push({
      _type: "request",
      id: `req_${l.id}`,
      ip: l.ip,
      timestamp: l.createdAt,
      method: l.method,
      path: l.path,
      status_code: l.statusCode,
      user_agent: l.userAgent,
      country: l.country,
      city: l.city,
      is_vpn: l.isVpn,
      vpn_provider: l.vpnProvider,
      response_time_ms: l.responseTimeMs,
      fingerprint_hash: l.fingerprintHash,
      event: null,
      severity: null,
      details: null,
      auto_blocked: false,
      is_admin: svc.isAdminFp(l.fingerprintHash) || svc.isAdminIp(l.ip),
    });
  }
  for (const t of threats) {
    if (isInfraIp(t.ip)) continue;
    if (!t.fingerprintHash) continue;
    // Skip threats attributed to admin devices/IPs — admins never generate threats.
    if (svc.isAdminFp(t.fingerprintHash) || svc.isAdminIp(t.ip)) continue;
    entries.push({
      _type: "threat",
      id: `thr_${t.id}`,
      ip: t.ip,
      timestamp: t.createdAt,
      method: "",
      path: t.path,
      status_code: 0,
      user_agent: "",
      country: t.country,
      city: t.city,
      is_vpn: t.isVpn,
      vpn_provider: "",
      response_time_ms: 0,
      fingerprint_hash: t.fingerprintHash,
      event: t.event,
      severity: t.severity,
      details: t.details,
      auto_blocked: t.autoBlocked,
      is_admin: false,
    });
  }
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const trimmed = entries.slice(0, limit);

  // Enrich entries without fingerprint by looking up trafficDeviceIps
  const missingIps = new Set(trimmed.filter((e) => e.ip && !e.fingerprint_hash).map((e) => e.ip));
  if (missingIps.size > 0) {
    try {
      const ipFp = await db
        .select({ ip: trafficDeviceIps.ip, fp: trafficDeviceIps.fingerprintHash })
        .from(trafficDeviceIps)
        .where(inArray(trafficDeviceIps.ip, Array.from(missingIps)))
        .orderBy(desc(trafficDeviceIps.lastSeenAt));
      const map = new Map<string, string>();
      for (const r of ipFp) if (!map.has(r.ip)) map.set(r.ip, r.fp);
      for (const e of trimmed) {
        if (!e.fingerprint_hash && map.has(e.ip)) e.fingerprint_hash = map.get(e.ip)!;
      }
    } catch {}
  }

  return c.json({ entries: trimmed, total: trimmed.length });
});

// ───── GET /admin/traffic/blocked ─────
adminRouter.get("/traffic/blocked", async (c) => {
  const blockedIpsRows = await db
    .select()
    .from(trafficBlockedIps)
    .orderBy(desc(trafficBlockedIps.createdAt));
  const blockedDevRows = await db
    .select()
    .from(trafficBlockedDevices)
    .orderBy(desc(trafficBlockedDevices.createdAt));

  const devices = blockedDevRows.map((d) => {
    let associatedIps: string[] = [];
    let components: Record<string, unknown> = {};
    try { associatedIps = JSON.parse(d.associatedIps || "[]"); } catch {}
    try { components = JSON.parse(d.components || "{}"); } catch {}
    return {
      id: d.id,
      fingerprint_hash: d.fingerprintHash,
      reason: d.reason,
      blocked_by: d.blockedBy,
      components,
      associated_ips: associatedIps,
      ip_details: associatedIps.map((ip) => ({ ip, is_vpn: false })),
      created_at: d.createdAt,
    };
  });

  // Enrich ip_details with VPN cache
  const allIps = new Set<string>();
  for (const d of devices) for (const ip of d.associated_ips) allIps.add(ip);
  if (allIps.size > 0) {
    try {
      const cache = await db
        .select({ ip: trafficVpnCache.ip, isVpn: trafficVpnCache.isVpn })
        .from(trafficVpnCache)
        .where(inArray(trafficVpnCache.ip, Array.from(allIps)));
      const map = new Map(cache.map((r) => [r.ip, r.isVpn]));
      for (const d of devices) {
        d.ip_details = d.associated_ips.map((ip) => ({ ip, is_vpn: !!map.get(ip) }));
      }
    } catch {}
  }

  const ips = blockedIpsRows.map((b) => ({
    id: b.id,
    ip: b.ip,
    reason: b.reason,
    blocked_by: b.blockedBy,
    request_count: b.requestCount,
    country: b.country,
    is_vpn: b.isVpn,
    log_snapshot: b.logSnapshot,
    created_at: b.createdAt,
  }));

  return c.json({ blocked: ips, blocked_devices: devices });
});

// ───── POST /admin/traffic/block-ip ─────
adminRouter.post("/traffic/block-ip", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { ip?: string; reason?: string };
  if (!body.ip) return c.json({ error: "ip required" }, 400);
  const svc = trafficService();
  await svc.init();
  if (svc.isAdminIp(body.ip)) {
    return c.json(
      { detail: `IP ${body.ip} pertence a um administrador e não pode ser bloqueado` },
      403
    );
  }
  await svc.blockIp(body.ip, body.reason || "Bloqueio manual", "admin");
  return c.json({ success: true, message: `IP ${body.ip} bloqueado` });
});

// ───── POST /admin/traffic/unblock-ip ─────
adminRouter.post("/traffic/unblock-ip", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { ip?: string };
  if (!body.ip) return c.json({ error: "ip required" }, 400);
  await trafficService().unblockIp(body.ip);
  return c.json({ success: true, message: `IP ${body.ip} desbloqueado` });
});

// ───── POST /admin/traffic/block-device ─────
adminRouter.post("/traffic/block-device", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    fingerprint_hash?: string;
    reason?: string;
  };
  if (!body.fingerprint_hash) return c.json({ error: "fingerprint_hash required" }, 400);
  const svc = trafficService();
  await svc.init();
  try {
    await svc.blockDevice(body.fingerprint_hash, body.reason ?? "", "admin");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "block failed";
    return c.json({ detail: msg }, 403);
  }
  return c.json({
    success: true,
    message: `Device ${body.fingerprint_hash.slice(0, 12)}... bloqueado`,
  });
});

// ───── POST /admin/traffic/unblock-device ─────
adminRouter.post("/traffic/unblock-device", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { fingerprint_hash?: string };
  if (!body.fingerprint_hash) return c.json({ error: "fingerprint_hash required" }, 400);
  await trafficService().unblockDevice(body.fingerprint_hash);
  return c.json({
    success: true,
    message: `Device ${body.fingerprint_hash.slice(0, 12)}... desbloqueado`,
  });
});

// ───── POST /admin/traffic/update-device-reason ─────
adminRouter.post("/traffic/update-device-reason", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    fingerprint_hash?: string;
    reason?: string;
  };
  if (!body.fingerprint_hash) return c.json({ error: "fingerprint_hash required" }, 400);
  await trafficService().updateDeviceReason(body.fingerprint_hash, body.reason ?? "");
  return c.json({ success: true });
});

// ───── GET /admin/traffic/chart-data ─────
adminRouter.get("/traffic/chart-data", async (c) => {
  const start = todayStartUtc();

  const logs = await db
    .select({
      createdAt: trafficLogs.createdAt,
      country: trafficLogs.country,
      isVpn: trafficLogs.isVpn,
      method: trafficLogs.method,
      ip: trafficLogs.ip,
    })
    .from(trafficLogs)
    .where(gte(trafficLogs.createdAt, start))
    .orderBy(asc(trafficLogs.createdAt))
    .limit(5000);

  const threats = await db
    .select({
      createdAt: trafficSuspicious.createdAt,
      event: trafficSuspicious.event,
      severity: trafficSuspicious.severity,
      ip: trafficSuspicious.ip,
    })
    .from(trafficSuspicious)
    .where(gte(trafficSuspicious.createdAt, start))
    .orderBy(asc(trafficSuspicious.createdAt))
    .limit(2000);

  const recentBlocks = await db
    .select({ id: trafficBlockedDevices.id })
    .from(trafficBlockedDevices)
    .orderBy(desc(trafficBlockedDevices.createdAt))
    .limit(30);

  const hourly = new Array(24).fill(0);
  for (const l of logs) {
    const h = parseInt(l.createdAt.slice(11, 13), 10);
    if (Number.isFinite(h)) hourly[h] += 1;
  }
  const threatsHourly = new Array(24).fill(0);
  for (const t of threats) {
    const h = parseInt(t.createdAt.slice(11, 13), 10);
    if (Number.isFinite(h)) threatsHourly[h] += 1;
  }
  const threatTypes = new Map<string, number>();
  for (const t of threats) {
    threatTypes.set(t.event, (threatTypes.get(t.event) ?? 0) + 1);
  }
  const countries = new Map<string, number>();
  for (const l of logs) {
    const k = l.country || "Desconhecido";
    countries.set(k, (countries.get(k) ?? 0) + 1);
  }
  let vpn = 0;
  for (const l of logs) if (l.isVpn) vpn += 1;
  const uniqueIps = new Set(logs.filter((l) => l.ip && !isInfraIp(l.ip)).map((l) => l.ip)).size;
  const methods = new Map<string, number>();
  for (const l of logs) methods.set(l.method, (methods.get(l.method) ?? 0) + 1);

  return c.json({
    hourly_requests: hourly.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, requests: v })),
    hourly_threats: threatsHourly.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, threats: v })),
    threat_distribution: Array.from(threatTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
    top_countries: Array.from(countries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, requests]) => ({ country, requests })),
    vpn_stats: { vpn, direct: logs.length - vpn },
    methods: Array.from(methods.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => ({ method, count })),
    unique_ips_today: uniqueIps,
    total_requests_today: logs.length,
    total_threats_today: threats.length,
    recent_blocks: recentBlocks.length,
  });
});

// ───── Reports — aggregate helper ─────
async function aggregatePeriod(periodStart: string, periodEnd: string) {
  const logs = await db
    .select()
    .from(trafficLogs)
    .where(and(gte(trafficLogs.createdAt, periodStart), lt(trafficLogs.createdAt, periodEnd)))
    .orderBy(asc(trafficLogs.createdAt))
    .limit(50_000);
  const threats = await db
    .select()
    .from(trafficSuspicious)
    .where(and(gte(trafficSuspicious.createdAt, periodStart), lt(trafficSuspicious.createdAt, periodEnd)))
    .orderBy(asc(trafficSuspicious.createdAt))
    .limit(50_000);
  const blocks = await db
    .select({ id: trafficBlockedDevices.id })
    .from(trafficBlockedDevices)
    .where(and(gte(trafficBlockedDevices.createdAt, periodStart), lt(trafficBlockedDevices.createdAt, periodEnd)))
    .limit(5_000);

  const hourly = new Array(24).fill(0);
  for (const l of logs) {
    const h = parseInt(l.createdAt.slice(11, 13), 10);
    if (Number.isFinite(h)) hourly[h] += 1;
  }
  const threatsHourly = new Array(24).fill(0);
  for (const t of threats) {
    const h = parseInt(t.createdAt.slice(11, 13), 10);
    if (Number.isFinite(h)) threatsHourly[h] += 1;
  }
  const threatTypes = new Map<string, number>();
  for (const t of threats) threatTypes.set(t.event, (threatTypes.get(t.event) ?? 0) + 1);
  const countries = new Map<string, number>();
  for (const l of logs) countries.set(l.country || "Desconhecido", (countries.get(l.country || "Desconhecido") ?? 0) + 1);
  let vpn = 0;
  for (const l of logs) if (l.isVpn) vpn += 1;
  const methods = new Map<string, number>();
  for (const l of logs) methods.set(l.method, (methods.get(l.method) ?? 0) + 1);
  const daily = new Map<string, number>();
  for (const l of logs) {
    const d = l.createdAt.slice(0, 10);
    daily.set(d, (daily.get(d) ?? 0) + 1);
  }
  const paths = new Map<string, number>();
  for (const l of logs) paths.set(l.path, (paths.get(l.path) ?? 0) + 1);
  const uniqueIps = new Set(logs.map((l) => l.ip)).size;

  return {
    hourly_requests: hourly.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, requests: v })),
    hourly_threats: threatsHourly.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, threats: v })),
    threat_distribution: Array.from(threatTypes.entries()).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    top_countries: Array.from(countries.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, requests]) => ({ country, requests })),
    vpn_stats: { vpn, direct: logs.length - vpn },
    methods: Array.from(methods.entries()).sort((a, b) => b[1] - a[1]).map(([method, count]) => ({ method, count })),
    unique_ips: uniqueIps,
    total_requests: logs.length,
    total_threats: threats.length,
    total_blocks: blocks.length,
    daily_requests: Array.from(daily.entries()).sort().map(([date, requests]) => ({ date, requests })),
    top_paths: Array.from(paths.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, count]) => ({ path, count })),
  };
}

function generateReportMarkdown(title: string, period: string, data: Awaited<ReturnType<typeof aggregatePeriod>>) {
  const lines: string[] = [
    `# ${title}`,
    `**Período:** ${period}`,
    `**Gerado em:** ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
    "",
    "---",
    "",
    "## Resumo",
    "",
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de Requests | ${data.total_requests} |`,
    `| IPs Únicos | ${data.unique_ips} |`,
    `| Total de Ameaças | ${data.total_threats} |`,
    `| Dispositivos Bloqueados | ${data.total_blocks} |`,
    `| Conexões VPN | ${data.vpn_stats.vpn} |`,
    `| Conexões Diretas | ${data.vpn_stats.direct} |`,
    "",
    "## Top Países",
    "",
    "| País | Requests |",
    "|------|----------|",
    ...data.top_countries.map((c) => `| ${c.country} | ${c.requests} |`),
    "",
    "## Distribuição de Ameaças",
    "",
    "| Tipo | Ocorrências |",
    "|------|-------------|",
    ...(data.threat_distribution.length
      ? data.threat_distribution.map((t) => `| ${t.type} | ${t.count} |`)
      : ["| Nenhuma ameaça registada | 0 |"]),
    "",
    "## Métodos HTTP",
    "",
    "| Método | Contagem |",
    "|--------|----------|",
    ...data.methods.map((m) => `| ${m.method} | ${m.count} |`),
    "",
    "## Top Endpoints",
    "",
    "| Path | Requests |",
    "|------|----------|",
    ...data.top_paths.map((p) => `| ${p.path} | ${p.count} |`),
    "",
    "## Requests por Dia",
    "",
    "| Data | Requests |",
    "|------|----------|",
    ...data.daily_requests.map((d) => `| ${d.date} | ${d.requests} |`),
    "",
    "---",
    "*Lunark Traffic Report — gerado automaticamente*",
  ];
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Automated reports maintenance
//
// Runs lazily (on every reports list query, throttled to once per UTC day) so
// that no Vercel cron / external scheduler is required. The logic:
//
//   1. Always upsert the current month's monthly report with the latest
//      aggregation of raw traffic_logs rows. This gives admins a live snapshot
//      of the in-progress month.
//
//   2. If the previous month exists and its report's title still says
//      "(A decorrer)", strip the suffix — the month is now closed.
//
//   3. If we're in year N and there is no yearly report for year N-1, build it
//      by aggregating the 12 monthly reports of N-1 (summing their stored
//      `data` JSON) and then DELETE all monthly reports of N-1. The yearly
//      report itself is permanent — only monthly reports recycle.
// ─────────────────────────────────────────────────────────────────────────────

let reportsMaintenanceDay = "";

async function runReportsMaintenance(): Promise<void> {
  const today = todayStartUtc().slice(0, 10);
  if (reportsMaintenanceDay === today) return;
  reportsMaintenanceDay = today;
  try {
    await maintainReports();
  } catch (err) {
    console.error("[runReportsMaintenance]", err);
  }
}

async function maintainReports(): Promise<void> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12

  // ─── 1. Upsert current month snapshot ──────────────────────────────────
  await upsertMonthlyReport(year, month, true);

  // ─── 2. Finalize previous month if needed ──────────────────────────────
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }
  const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const prevRow = await db
    .select()
    .from(trafficReports)
    .where(eq(trafficReports.period, prevPeriod))
    .get();
  if (prevRow && prevRow.title.includes("(A decorrer)")) {
    await db
      .update(trafficReports)
      .set({ title: prevRow.title.replace(" (A decorrer)", "") })
      .where(eq(trafficReports.period, prevPeriod));
  }

  // ─── 3. Year-end yearly report + monthly recycle ───────────────────────
  const yearlyPeriod = String(year - 1);
  const yearlyExisting = await db
    .select({ id: trafficReports.id })
    .from(trafficReports)
    .where(eq(trafficReports.period, yearlyPeriod))
    .get();
  if (!yearlyExisting) {
    await generateYearlyReport(year - 1);
  }
}

async function upsertMonthlyReport(year: number, month: number, inProgress: boolean): Promise<void> {
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString().replace("T", " ").slice(0, 19);
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString().replace("T", " ").slice(0, 19);
  const data = await aggregatePeriod(monthStart, monthEnd);
  const baseTitle = `Relatório ${MONTH_NAMES_PT[month]} ${year}`;
  const title = inProgress ? `${baseTitle} (A decorrer)` : baseTitle;
  const md = generateReportMarkdown(title, period, data);
  await db
    .insert(trafficReports)
    .values({ type: "monthly", period, title, markdown: md, data: JSON.stringify(data) })
    .onConflictDoUpdate({
      target: trafficReports.period,
      set: { title, markdown: md, data: JSON.stringify(data) },
    });
}

async function generateYearlyReport(year: number): Promise<void> {
  // Pull every monthly report for this year and merge their stored `data`.
  const months = await db
    .select()
    .from(trafficReports)
    .where(and(eq(trafficReports.type, "monthly"), like(trafficReports.period, `${year}-%`)));
  if (months.length === 0) return; // Nothing to aggregate — skip silently.

  let total_requests = 0;
  let total_threats = 0;
  let total_blocks = 0;
  let vpn = 0;
  let direct = 0;
  const dailyAgg = new Map<string, number>();
  const countriesAgg = new Map<string, number>();
  const threatTypesAgg = new Map<string, number>();
  const methodsAgg = new Map<string, number>();
  const pathsAgg = new Map<string, number>();
  const hourlyReq = new Array(24).fill(0);
  const hourlyThr = new Array(24).fill(0);
  let unique_ips_max = 0;

  for (const m of months) {
    let d: ReturnType<typeof emptyMonthData>;
    try { d = JSON.parse(m.data); } catch { continue; }
    total_requests += d.total_requests ?? 0;
    total_threats += d.total_threats ?? 0;
    total_blocks += d.total_blocks ?? 0;
    vpn += d.vpn_stats?.vpn ?? 0;
    direct += d.vpn_stats?.direct ?? 0;
    unique_ips_max = Math.max(unique_ips_max, d.unique_ips ?? 0);
    for (const x of d.daily_requests ?? []) dailyAgg.set(x.date, (dailyAgg.get(x.date) ?? 0) + x.requests);
    for (const x of d.top_countries ?? []) countriesAgg.set(x.country, (countriesAgg.get(x.country) ?? 0) + x.requests);
    for (const x of d.threat_distribution ?? []) threatTypesAgg.set(x.type, (threatTypesAgg.get(x.type) ?? 0) + x.count);
    for (const x of d.methods ?? []) methodsAgg.set(x.method, (methodsAgg.get(x.method) ?? 0) + x.count);
    for (const x of d.top_paths ?? []) pathsAgg.set(x.path, (pathsAgg.get(x.path) ?? 0) + x.count);
    for (const x of d.hourly_requests ?? []) {
      const h = parseInt(x.hour.slice(0, 2), 10);
      if (Number.isFinite(h)) hourlyReq[h] += x.requests;
    }
    for (const x of d.hourly_threats ?? []) {
      const h = parseInt(x.hour.slice(0, 2), 10);
      if (Number.isFinite(h)) hourlyThr[h] += x.threats;
    }
  }

  const data = {
    hourly_requests: hourlyReq.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, requests: v })),
    hourly_threats: hourlyThr.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, threats: v })),
    threat_distribution: Array.from(threatTypesAgg.entries()).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    top_countries: Array.from(countriesAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, requests]) => ({ country, requests })),
    vpn_stats: { vpn, direct },
    methods: Array.from(methodsAgg.entries()).sort((a, b) => b[1] - a[1]).map(([method, count]) => ({ method, count })),
    unique_ips: unique_ips_max,
    total_requests,
    total_threats,
    total_blocks,
    daily_requests: Array.from(dailyAgg.entries()).sort().map(([date, requests]) => ({ date, requests })),
    top_paths: Array.from(pathsAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, count]) => ({ path, count })),
  };

  const period = String(year);
  const title = `Relatório Anual ${year}`;
  const md = generateReportMarkdown(title, period, data);
  await db
    .insert(trafficReports)
    .values({ type: "yearly", period, title, markdown: md, data: JSON.stringify(data) })
    .onConflictDoNothing();

  // Recycle: monthly reports of the closed year are removed. Only the yearly
  // report survives, as the user specified.
  await db
    .delete(trafficReports)
    .where(and(eq(trafficReports.type, "monthly"), like(trafficReports.period, `${year}-%`)));
}

function emptyMonthData() {
  return {
    hourly_requests: [] as { hour: string; requests: number }[],
    hourly_threats: [] as { hour: string; threats: number }[],
    threat_distribution: [] as { type: string; count: number }[],
    top_countries: [] as { country: string; requests: number }[],
    vpn_stats: { vpn: 0, direct: 0 },
    methods: [] as { method: string; count: number }[],
    unique_ips: 0,
    total_requests: 0,
    total_threats: 0,
    total_blocks: 0,
    daily_requests: [] as { date: string; requests: number }[],
    top_paths: [] as { path: string; count: number }[],
  };
}

// ───── GET /admin/traffic/reports ─────
adminRouter.get("/traffic/reports", async (c) => {
  await runReportsMaintenance();
  const rows = await db
    .select({
      id: trafficReports.id,
      type: trafficReports.type,
      period: trafficReports.period,
      title: trafficReports.title,
      createdAt: trafficReports.createdAt,
    })
    .from(trafficReports)
    .orderBy(desc(trafficReports.period));
  return c.json({
    reports: rows.map((r) => ({
      id: r.id,
      type: r.type,
      period: r.period,
      title: r.title,
      created_at: r.createdAt,
    })),
  });
});

// ───── GET /admin/traffic/reports/:period ─────
adminRouter.get("/traffic/reports/:period", async (c) => {
  const period = c.req.param("period");
  const row = await db
    .select()
    .from(trafficReports)
    .where(eq(trafficReports.period, period))
    .limit(1)
    .get();
  if (!row) return c.json({ error: "Relatório não encontrado" }, 404);
  let data: unknown = {};
  try { data = JSON.parse(row.data || "{}"); } catch {}
  return c.json({
    id: row.id,
    type: row.type,
    period: row.period,
    title: row.title,
    markdown: row.markdown,
    data,
    created_at: row.createdAt,
  });
});

// ───── GET /admin/traffic/reports/:period/download ─────
adminRouter.get("/traffic/reports/:period/download", async (c) => {
  const period = c.req.param("period");
  const row = await db
    .select({ markdown: trafficReports.markdown })
    .from(trafficReports)
    .where(eq(trafficReports.period, period))
    .limit(1)
    .get();
  if (!row) return c.json({ error: "Relatório não encontrado" }, 404);
  const filename = `relatorio_${period.replace("-", "_")}.md`;
  return new Response(row.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});

// ───── POST /admin/traffic/reports/generate-current ─────
adminRouter.post("/traffic/reports/generate-current", async (c) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString().replace("T", " ").slice(0, 19);
  const monthEnd = now.toISOString().replace("T", " ").slice(0, 19);
  const title = `Relatório ${MONTH_NAMES_PT[month]} ${year}`;
  const data = await aggregatePeriod(monthStart, monthEnd);
  const md = generateReportMarkdown(`${title} (A decorrer)`, period, data);

  try {
    await db
      .insert(trafficReports)
      .values({
        type: "monthly",
        period,
        title,
        markdown: md,
        data: JSON.stringify(data),
      })
      .onConflictDoUpdate({
        target: trafficReports.period,
        set: { title, markdown: md, data: JSON.stringify(data) },
      });
  } catch (err) {
    return c.json({ ok: false, error: err instanceof Error ? err.message : "save failed" }, 500);
  }
  return c.json({ ok: true, period, title });
});

// ───── DELETE /admin/traffic/clear-old-logs ─────
adminRouter.delete("/traffic/clear-old-logs", async (c) => {
  const start = todayStartUtc();
  await db.delete(trafficLogs).where(lt(trafficLogs.createdAt, start));
  await db.delete(trafficSuspicious).where(lt(trafficSuspicious.createdAt, start));
  return c.json({ ok: true });
});

export { adminRouter };
