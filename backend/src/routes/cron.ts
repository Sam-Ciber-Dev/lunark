import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { sendKeepAliveEmail } from "../lib/email";

export const cronRouter = new Hono();

// Constant-time comparison so the secret can't be guessed via timing.
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Scheduled keep-alive. Sends one email via Brevo so the free account never
 * gets deactivated for inactivity. Triggered monthly by an external scheduler
 * (GitHub Actions) or Vercel Cron. Protected by CRON_SECRET — accepts either
 * `Authorization: Bearer <secret>` or `?secret=<secret>`.
 */
cronRouter.get("/keep-alive", async (c) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return c.json({ error: "CRON_SECRET not configured" }, 500);
  }

  const authHeader = c.req.header("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const provided = bearer || c.req.query("secret") || "";

  if (!provided || !secretMatches(provided, expected)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const sent = await sendKeepAliveEmail();
  return c.json({ ok: true, sent });
});
