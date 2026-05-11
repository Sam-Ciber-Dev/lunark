import { Hono } from "hono";
import { eq, gt, count, desc, sum, asc, and, isNull } from "drizzle-orm";
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
  supportTickets,
  supportMessages,
} from "../db/schema";
import { requireAdmin } from "../middleware/admin";
import { sendNewsletterBroadcast, sendSupportReply } from "../lib/email";

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

// POST /admin/news/broadcast — { subject, body, locale?, testEmail? }
adminRouter.post("/news/broadcast", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    subject?: string;
    body?: string;
    locale?: "pt" | "en" | "all";
    testEmail?: string;
  };

  const subject = (body.subject ?? "").trim().slice(0, 200);
  const html = (body.body ?? "").trim();
  if (!subject || !html) {
    return c.json({ error: "subject e body são obrigatórios" }, 400);
  }

  // Test mode — send a single email to the requesting admin.
  if (body.testEmail) {
    const result = await sendNewsletterBroadcast(
      [{ email: body.testEmail }],
      `[TESTE] ${subject}`,
      html
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

  const result = await sendNewsletterBroadcast(recipients, subject, html);
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

export { adminRouter };
