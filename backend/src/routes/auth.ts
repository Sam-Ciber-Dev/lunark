import { Hono } from "hono";
import bcryptjs from "bcryptjs";
const { hash, compare } = bcryptjs;
import { OAuth2Client } from "google-auth-library";
import { eq, and, gt, lt, desc } from "drizzle-orm";
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
auth.use("/forgot-password", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }));
auth.use("/reset-password", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }));

// ——— Helpers ———

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyTurnstileToken(token: string): Promise<{ ok: boolean; codes?: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.log("[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification");
    return { ok: true };
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    console.log("[turnstile] Cloudflare response:", JSON.stringify(data));
    if (data.success) return { ok: true };
    return { ok: false, codes: data["error-codes"] ?? ["unknown"] };
  } catch (err) {
    console.error("[turnstile] Fetch failed:", err);
    return { ok: false, codes: ["fetch-error"] };
  }
}

async function sendVerificationEmail(email: string, code: string, type: "login" | "register" | "password_reset"): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }
  const subject = type === "login" ? "Lunark — Your Login Code" : type === "password_reset" ? "Lunark — Password Reset Code" : "Lunark — Verify Your Email";
  const description = type === "login" ? "Your login verification code" : type === "password_reset" ? "Your password reset code" : "Your email verification code";
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#f5f5f5;border-radius:8px;">
      <h1 style="color:#c9a96e;font-size:24px;text-align:center;margin-bottom:8px;">LUNARK</h1>
      <p style="text-align:center;color:#8a8a8a;font-size:14px;margin-bottom:24px;">${description}</p>
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

// POST /auth/register — Validate + send verification code (do NOT create user yet)
auth.post("/register", async (c) => {
  // Lazy cleanup: delete codes older than 1 hour (used or expired) to keep the table small
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  db.delete(verificationCodes).where(lt(verificationCodes.createdAt, oneHourAgo)).run();

  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid data", details: parsed.error.flatten() }, 400);
  }

  const { name, email, password, turnstileToken } = parsed.data as {
    name: string; email: string; password: string; turnstileToken?: string;
  };
  const googleImage: string | null = (body as Record<string, unknown>).googleImage as string ?? null;
  const googleCredential: string | null = (body as Record<string, unknown>).googleCredential as string ?? null;

  // If a Google credential is provided, verify it and create the user directly (no OTP needed)
  if (googleCredential) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return c.json({ error: "Google Sign-Up not configured" }, 500);
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken: googleCredential, audience: clientId });
      const gp = ticket.getPayload();
      if (!gp?.email || gp.email.toLowerCase() !== email.toLowerCase()) {
        return c.json({ error: "Google token email mismatch" }, 400);
      }
    } catch {
      return c.json({ error: "Invalid Google token" }, 400);
    }

    const existingGoogle = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (existingGoogle) return c.json({ error: "This email is already registered" }, 409);

    const passwordHash = await hash(password, 12);
    const id = crypto.randomUUID();
    const isAdminEmail = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    await db.insert(users).values({
      id, name, email, passwordHash,
      image: googleImage,
      emailVerified: true,
      role: isAdminEmail ? "admin" : "customer",
    });
    const assignedRole = isAdminEmail ? "admin" : "customer";
    return c.json({ id, name, email, role: assignedRole, image: googleImage, success: true });
  }

  // Verify Turnstile
  if (turnstileToken) {
    const result = await verifyTurnstileToken(turnstileToken);
    if (!result.ok) return c.json({ error: "Captcha verification failed", codes: result.codes }, 400);
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

  // Invalidate previous unused register codes for this email
  await db
    .update(verificationCodes)
    .set({ used: true })
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.type, "register"),
        eq(verificationCodes.used, false)
      )
    );

  // Hash password and store pending user data + verification code
  const passwordHash = await hash(password, 12);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type: "register",
    expiresAt,
    pendingName: name,
    pendingPasswordHash: passwordHash,
    pendingImage: googleImage,
  });

  // Send the code via Brevo (in dev without API key, code is logged to console)
  const sent = await sendVerificationEmail(email, code, "register");
  if (!sent && process.env.BREVO_API_KEY) {
    return c.json({ error: "Failed to send verification email" }, 502);
  }

  return c.json({ requiresVerification: true, email });
});

// POST /auth/login — Validate credentials + send verification code (do NOT create session yet)
auth.post("/login", async (c) => {
  // Lazy cleanup: delete codes older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  db.delete(verificationCodes).where(lt(verificationCodes.createdAt, oneHourAgo)).run();

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
    const result = await verifyTurnstileToken(turnstileToken);
    if (!result.ok) return c.json({ error: "Captcha verification failed", codes: result.codes }, 400);
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user || !user.passwordHash) {
    return c.json({ error: "NO_ACCOUNT" }, 401);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "WRONG_CREDENTIALS" }, 401);
  }

  // Credentials valid — emit a one-time login code
  await db
    .update(verificationCodes)
    .set({ used: true })
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.type, "login"),
        eq(verificationCodes.used, false)
      )
    );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type: "login",
    expiresAt,
  });

  const sent = await sendVerificationEmail(email, code, "login");
  if (!sent && process.env.BREVO_API_KEY) {
    return c.json({ error: "Failed to send verification email" }, 502);
  }

  return c.json({ requiresVerification: true, email });
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

  if (type === "register") {
    // Create user NOW (only after successful verification)
    const id = crypto.randomUUID();
    const isAdminEmail = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    await db.insert(users).values({
      id,
      name: record.pendingName ?? "User",
      email,
      passwordHash: record.pendingPasswordHash,
      image: record.pendingImage ?? null,
      emailVerified: true,
      role: isAdminEmail ? "admin" : "customer",
    });

    return c.json({
      id,
      name: record.pendingName ?? "User",
      email,
      role: isAdminEmail ? "admin" : "customer",
      image: record.pendingImage ?? null,
      verified: true,
    });
  }

  // Login flow — mark email as verified and auto-promote if admin email
  const isAdminEmailLogin = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  await db
    .update(users)
    .set({
      emailVerified: true,
      updatedAt: now,
      ...(isAdminEmailLogin ? { role: "admin" } : {}),
    })
    .where(eq(users.email, email));

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
  const { email, type } = await c.req.json() as { email: string; type: "login" | "register" | "password_reset" };

  if (!email || !type) {
    return c.json({ error: "Missing fields" }, 400);
  }

  // For register, carry over the pending name + password hash from the latest record
  // so the verify step can still create the user.
  let pendingName: string | null = null;
  let pendingPasswordHash: string | null = null;
  if (type === "register") {
    const latest = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.type, "register")
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .get();
    if (!latest?.pendingPasswordHash) {
      return c.json({ error: "No pending registration found" }, 400);
    }
    pendingName = latest.pendingName ?? null;
    pendingPasswordHash = latest.pendingPasswordHash;
  }

  // Invalidate previous unused codes of the same type
  await db
    .update(verificationCodes)
    .set({ used: true })
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.type, type),
        eq(verificationCodes.used, false)
      )
    );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type,
    expiresAt,
    pendingName,
    pendingPasswordHash,
  });

  const sent = await sendVerificationEmail(email, code, type);
  if (!sent && process.env.BREVO_API_KEY) {
    return c.json({ error: "Failed to send verification email" }, 502);
  }
  return c.json({ sent: true });
});

// POST /auth/forgot-password — Send password reset code
auth.post("/forgot-password", async (c) => {
  const { email } = await c.req.json() as { email: string };

  if (!email) {
    return c.json({ error: "Missing email" }, 400);
  }

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return c.json({ error: "NO_ACCOUNT" }, 404);
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(verificationCodes).values({
    id: crypto.randomUUID(),
    email,
    code,
    type: "password_reset",
    expiresAt,
  });

  await sendVerificationEmail(email, code, "password_reset");
  return c.json({ sent: true, email });
});

// POST /auth/reset-password — Verify code + update password
auth.post("/reset-password", async (c) => {
  const { email, code, newPassword } = await c.req.json() as {
    email: string; code: string; newPassword: string;
  };

  if (!email || !code || !newPassword) {
    return c.json({ error: "Missing fields" }, 400);
  }

  if (newPassword.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  const now = new Date().toISOString();
  const record = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, "password_reset"),
        eq(verificationCodes.used, false),
        gt(verificationCodes.expiresAt, now)
      )
    )
    .get();

  if (!record) {
    return c.json({ error: "INVALID_CODE" }, 400);
  }

  // Mark code as used
  await db
    .update(verificationCodes)
    .set({ used: true })
    .where(eq(verificationCodes.id, record.id));

  // Update password
  const passwordHash = await hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: now })
    .where(eq(users.email, email));

  return c.json({ success: true });
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

  // Verify Google ID token using google-auth-library (validates signature + expiry + audience)
  let payload: { email?: string; name?: string; picture?: string; sub?: string };
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID not configured");
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const p = ticket.getPayload();
    if (!p?.email) throw new Error("No email in token");
    payload = { email: p.email, name: p.name, picture: p.picture, sub: p.sub };
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
    // Auto-promote to admin if this is the designated admin email
    const isAdminEmail = process.env.ADMIN_EMAIL && existing.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    if (isAdminEmail && existing.role !== "admin") {
      await db.update(users).set({ role: "admin", updatedAt: new Date().toISOString() }).where(eq(users.id, existing.id));
      existing.role = "admin";
    }
    // Sync Google picture to DB whenever the user signs in with Google
    const googlePicture = payload.picture ?? null;
    if (googlePicture && existing.image !== googlePicture) {
      await db
        .update(users)
        .set({ image: googlePicture, updatedAt: new Date().toISOString() })
        .where(eq(users.id, existing.id));
    }
    return c.json({
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      image: googlePicture ?? existing.image,
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
