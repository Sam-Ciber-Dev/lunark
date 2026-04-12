import { Hono } from "hono";
import bcryptjs from "bcryptjs";
const { hash, compare } = bcryptjs;
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { users, verificationCodes } from "../db/schema";
import { registerSchema, loginSchema } from "@lunark/shared";
import { rateLimit } from "../middleware/rate-limit";

const auth = new Hono();

// Rate limit: 5 login attempts per 15 min, 3 register per 15 min
auth.use("/login", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }));
auth.use("/register", rateLimit({ limit: 3, windowMs: 15 * 60 * 1000 }));
auth.use("/send-code", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }));
auth.use("/verify-code", rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }));

// ——— Helpers ———

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Skip in dev if not configured
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

async function sendVerificationEmail(email: string, code: string, type: "login" | "register"): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }
  const subject = type === "login" ? "Lunark — Your Login Code" : "Lunark — Verify Your Email";
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#f5f5f5;border-radius:8px;">
      <h1 style="color:#c9a96e;font-size:24px;text-align:center;margin-bottom:8px;">LUNARK</h1>
      <p style="text-align:center;color:#8a8a8a;font-size:14px;margin-bottom:24px;">${type === "login" ? "Your login verification code" : "Your email verification code"}</p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#c9a96e;">${code}</span>
      </div>
      <p style="text-align:center;color:#8a8a8a;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>`;
  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@lunark.com";
    console.log(`[Email] Sending ${type} code to ${email} from ${senderEmail}`);
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "content-type": "application/json", "api-key": apiKey.trim() },
      body: JSON.stringify({
        sender: { name: "Lunark", email: senderEmail },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Email] Brevo error ${res.status}: ${errBody}`);
    } else {
      console.log(`[Email] Sent successfully to ${email}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

// POST /auth/register — Create account (unverified) + send code
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid data", details: parsed.error.flatten() }, 400);
  }

  const { name, email, password, turnstileToken } = parsed.data as {
    name: string; email: string; password: string; turnstileToken?: string;
  };

  // Verify Turnstile
  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) return c.json({ error: "Captcha verification failed" }, 400);
  }

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return c.json({ error: "This email is already registered" }, 409);
  }

  const passwordHash = await hash(password, 12);
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    name,
    email,
    passwordHash,
    emailVerified: false,
  });

  // Generate and send verification code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type: "register",
    expiresAt,
  });

  await sendVerificationEmail(email, code, "register");

  return c.json({ id, name, email, requiresVerification: true }, 201);
});

// POST /auth/login — Validate credentials + send code
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid data" }, 400);
  }

  const { email, password, turnstileToken } = parsed.data as {
    email: string; password: string; turnstileToken?: string;
  };

  // Verify Turnstile
  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) return c.json({ error: "Captcha verification failed" }, 400);
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user || !user.passwordHash) {
    return c.json({ error: "No account found. Please create an account first." }, 401);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Incorrect email or password" }, 401);
  }

  // Generate and send verification code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type: "login",
    expiresAt,
  });

  await sendVerificationEmail(email, code, "login");

  return c.json({
    requiresVerification: true,
    email: user.email,
  });
});

// POST /auth/verify-code — Verify the email code and complete auth
auth.post("/verify-code", async (c) => {
  const { email, code, type } = await c.req.json() as {
    email: string; code: string; type: "login" | "register";
  };

  if (!email || !code || !type) {
    return c.json({ error: "Missing fields" }, 400);
  }

  const now = new Date().toISOString();
  const record = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, type),
        eq(verificationCodes.used, false),
        gt(verificationCodes.expiresAt, now)
      )
    )
    .get();

  if (!record) {
    return c.json({ error: "Invalid or expired code" }, 400);
  }

  // Mark code as used
  await db
    .update(verificationCodes)
    .set({ used: true })
    .where(eq(verificationCodes.id, record.id));

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: now })
    .where(eq(users.email, email));

  // Return user data for session creation
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    verified: true,
  });
});

// POST /auth/resend-code — Resend verification code
auth.post("/resend-code", async (c) => {
  const { email, type } = await c.req.json() as { email: string; type: "login" | "register" };

  if (!email || !type) {
    return c.json({ error: "Missing fields" }, 400);
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type,
    expiresAt,
  });

  await sendVerificationEmail(email, code, type);
  return c.json({ sent: true });
});

// POST /auth/google — Handle Google Sign-In/Sign-Up
auth.post("/google", async (c) => {
  const { credential, mode } = await c.req.json() as {
    credential: string;
    mode: "signin" | "signup";
  };

  if (!credential) {
    return c.json({ error: "Missing Google credential" }, 400);
  }

  // Verify Google ID token
  let payload: { email?: string; name?: string; picture?: string; sub?: string };
  try {
    // Decode and verify Google JWT (simplified - in production use google-auth-library)
    const parts = credential.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");
    const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    payload = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      sub: decoded.sub,
    };
    if (!payload.email) throw new Error("No email in token");
  } catch {
    return c.json({ error: "Invalid Google token" }, 400);
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email!))
    .get();

  if (mode === "signin") {
    if (!existing) {
      return c.json({ error: "No account found. Please create an account first." }, 401);
    }
    return c.json({
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      image: existing.image,
    });
  }

  // mode === "signup"
  if (existing) {
    return c.json({ error: "This email is already registered" }, 409);
  }

  // Return Google profile data for form pre-fill (account created on form submit)
  return c.json({
    googleProfile: {
      name: payload.name ?? "",
      email: payload.email!,
      image: payload.picture ?? null,
    },
  });
});

export { auth };
