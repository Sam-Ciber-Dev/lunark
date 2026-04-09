import { Hono } from "hono";
import { contactSchema } from "@lunark/shared";
import { rateLimit } from "../middleware/rate-limit";

const contactRouter = new Hono();

// Rate limit: 3 messages per 15 min
contactRouter.use("/", rateLimit({ limit: 3, windowMs: 15 * 60 * 1000 }));

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // In dev mode without a secret, skip verification
  if (!secret) return true;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// POST /contact
contactRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      400
    );
  }

  const { name, email, subject, message, turnstileToken } = parsed.data;

  // Verify Turnstile
  const valid = await verifyTurnstile(turnstileToken);
  if (!valid) {
    return c.json({ error: "Verificação de segurança falhou" }, 403);
  }

  // For now, just log the message (Brevo integration comes later)
  console.log("[Contact]", { name, email, subject, message: message.slice(0, 50) });

  return c.json({ success: true, message: "Mensagem enviada com sucesso" });
});

export { contactRouter };
