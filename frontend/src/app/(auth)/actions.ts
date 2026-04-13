"use server";

import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import honoApp from "@lunark/api/app";

async function callApi(path: string, body: Record<string, unknown>): Promise<Response> {
  return honoApp.fetch(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

// ── Session creation helper ──────────────────────────────────────────────────
async function createSessionCookie(user: {
  id: string; name: string; email: string; role: string; image: string | null;
}) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");

  const isSecure =
    process.env.NODE_ENV === "production" ||
    (process.env.VERCEL_URL ?? "").length > 0;
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      role: user.role ?? "customer",
    },
    secret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

// ── Auth actions ─────────────────────────────────────────────────────────────

// Login — validate credentials + create session
export async function loginAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  try {
    const res = await callApi("/auth/login", { email, password, turnstileToken });
    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return { error: (data.error as string) ?? "Incorrect email or password" };
    }

    const user = data as { id: string; name: string; email: string; role: string; image: string | null };
    await createSessionCookie(user);
    return { success: true };
  } catch (err) {
    console.error("loginAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Register — create account + create session
export async function registerAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  if (password !== confirmPassword) {
    return { error: "PASSWORDS_MISMATCH" };
  }

  try {
    const res = await callApi("/auth/register", { name, email, password, turnstileToken });
    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to create account" };
    }

    const user = data as { id: string; name: string; email: string; role: string; image: string | null };
    await createSessionCookie(user);
    return { success: true };
  } catch (err) {
    console.error("registerAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Google sign-in + create session
export async function googleSignInSessionAction(credential: string) {
  try {
    const res = await callApi("/auth/google", { credential, mode: "signin" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, string>;
      return { error: data.error ?? "No account found. Please create an account first." };
    }

    const user = await res.json() as {
      id: string; name: string; email: string; role: string; image: string | null;
    };

    if (!user.id) {
      return { error: "No account found" };
    }

    await createSessionCookie(user);
    return { success: true };
  } catch (err) {
    console.error("googleSignInSessionAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Google sign-up — get profile info for pre-filling form
export async function googleGetProfileAction(credential: string) {
  try {
    const res = await callApi("/auth/google", { credential, mode: "signup" });
    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to get Google profile" };
    }

    if (data.googleProfile) {
      return { profile: data.googleProfile as { name: string; email: string; image: string | null } };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("googleGetProfileAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Forgot password — send reset code
export async function forgotPasswordAction(email: string) {
  try {
    const res = await callApi("/auth/forgot-password", { email });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to send reset code" };
    }
    return { sent: true, email };
  } catch (err) {
    console.error("forgotPasswordAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Reset password — verify code + update password
export async function resetPasswordAction(email: string, code: string, newPassword: string) {
  try {
    const res = await callApi("/auth/reset-password", { email, code, newPassword });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to reset password" };
    }
    return { success: true };
  } catch (err) {
    console.error("resetPasswordAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}
