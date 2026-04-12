"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
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

// Step 1: Login — validate credentials + send verification code
export async function loginAction(
  _prevState: { error?: string; requiresVerification?: boolean; email?: string } | undefined,
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

    if (data.requiresVerification) {
      return { requiresVerification: true, email };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("loginAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Step 1: Register — create account + send verification code
export async function registerAction(
  _prevState: { error?: string; requiresVerification?: boolean; email?: string } | undefined,
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

    if (data.requiresVerification) {
      return { requiresVerification: true, email };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("registerAction failed:", err);
    return { error: `Server error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Step 2: Verify code — form action for useFormState
export async function verifyCodeAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const type = formData.get("type") as string;

  try {
    // redirect: false → Auth.js creates session but does NOT redirect/throw
    await signIn("verification-code", {
      email,
      code,
      type,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "INVALID_CODE" };
    }
    throw error;
  }

  // Session created successfully — now redirect via Next.js's own redirect()
  // which useFormState handles correctly
  redirect("/");
}

// Resend verification code
export async function resendCodeAction(email: string, type: "login" | "register") {
  try {
    const res = await callApi("/auth/resend-code", { email, type });
    return res.ok;
  } catch {
    return false;
  }
}

// Google sign-in (for existing users only)
export async function googleSignInAction(credential: string) {
  try {
    await signIn("google-verified", {
      credential,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "No account found. Please create an account first." };
    }
    throw error;
  }
  redirect("/");
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