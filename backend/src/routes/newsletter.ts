import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { newsletterSubscribers, newsletterBannedEmails } from "../db/schema";
import { rateLimit } from "../middleware/rate-limit";

const newsletterRouter = new Hono();

// Rate limit: 5 subscribes per 15 min per IP
newsletterRouter.use("/subscribe", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }));

// POST /newsletter/subscribe — { email, locale? }
newsletterRouter.post("/subscribe", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    email?: string;
    locale?: string;
  };

  const email = (body.email ?? "").trim().toLowerCase();
  const locale = body.locale === "en" ? "en" : "pt";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return c.json({ error: "Email inválido" }, 400);
  }

  // Banned check — silently refuse with a generic 403 to avoid leaking state.
  const [banned] = await db
    .select({ email: newsletterBannedEmails.email })
    .from(newsletterBannedEmails)
    .where(eq(newsletterBannedEmails.email, email))
    .limit(1);
  if (banned) {
    return c.json({ error: "Não foi possível subscrever este email" }, 403);
  }

  const [existing] = await db
    .select({ id: newsletterSubscribers.id, unsubscribedAt: newsletterSubscribers.unsubscribedAt })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    if (existing.unsubscribedAt) {
      // Re-subscribe: clear opt-out flag.
      await db
        .update(newsletterSubscribers)
        .set({ unsubscribedAt: null, locale })
        .where(eq(newsletterSubscribers.id, existing.id));
    }
    return c.json({ success: true, alreadySubscribed: true });
  }

  await db.insert(newsletterSubscribers).values({
    id: crypto.randomUUID(),
    email,
    locale,
  });

  return c.json({ success: true });
});

export { newsletterRouter };
