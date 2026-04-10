"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  if (url.startsWith("/")) {
    const host = process.env.VERCEL_URL ?? "localhost:3000";
    const protocol = process.env.VERCEL ? "https" : "http";
    return `${protocol}://${host}${url}`;
  }
  return url;
}

const API_URL = getApiUrl();

// Step 1: Login — validate credentials + send verification code
export async function loginAction(
  _prevState: { error?: string; requiresVerification?: boolean; email?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("loginAction: non-JSON response", res.status, text.slice(0, 500));
      return { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      return { error: (data.error as string) ?? "Incorrect email or password" };
    }

    if (data.requiresVerification) {
      return { requiresVerification: true, email };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("loginAction fetch failed:", err, "API_URL:", API_URL);
    return { error: `Connection error: ${err instanceof Error ? err.message : "Unknown"}` };
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
    return { error: "Passwords do not match" };
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, turnstileToken }),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("registerAction: non-JSON response", res.status, text.slice(0, 500));
      return { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to create account" };
    }

    if (data.requiresVerification) {
      return { requiresVerification: true, email };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("registerAction fetch failed:", err, "API_URL:", API_URL);
    return { error: `Connection error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}

// Step 2: Verify code — complete sign-in
export async function verifyCodeAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const type = formData.get("type") as string;

  try {
    await signIn("verification-code", {
      email,
      code,
      type,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid or expired code" };
    }
    throw error;
  }
  redirect("/");
}

// Resend verification code
export async function resendCodeAction(email: string, type: "login" | "register") {
  try {
    const res = await fetch(`${API_URL}/auth/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type }),
    });
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
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, mode: "signup" }),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("googleGetProfileAction: non-JSON response", res.status, text.slice(0, 500));
      return { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      return { error: (data.error as string) ?? "Failed to get Google profile" };
    }

    if (data.googleProfile) {
      return { profile: data.googleProfile as { name: string; email: string; image: string | null } };
    }

    return { error: "Unexpected response" };
  } catch (err) {
    console.error("googleGetProfileAction fetch failed:", err, "API_URL:", API_URL);
    return { error: `Connection error: ${err instanceof Error ? err.message : "Unknown"}` };
  }
}