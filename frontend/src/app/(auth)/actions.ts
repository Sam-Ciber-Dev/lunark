"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Step 1: Login — validate credentials + send verification code
export async function loginAction(
  _prevState: { error?: string; requiresVerification?: boolean; email?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, turnstileToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Incorrect email or password" };
  }

  if (data.requiresVerification) {
    return { requiresVerification: true, email };
  }

  return { error: "Unexpected response" };
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

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, turnstileToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Failed to create account" };
  }

  if (data.requiresVerification) {
    return { requiresVerification: true, email };
  }

  return { error: "Unexpected response" };
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
  const res = await fetch(`${API_URL}/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, type }),
  });
  return res.ok;
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
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, mode: "signup" }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Failed to get Google profile" };
  }

  if (data.googleProfile) {
    return { profile: data.googleProfile as { name: string; email: string; image: string | null } };
  }

  return { error: "Unexpected response" };
}
