/**
 * Server-only HMAC signer for the API auth token.
 *
 * Mirrors backend/src/lib/api-token.ts. The Next.js API proxy
 * (src/app/api/[[...route]]/route.ts) calls signApiToken() with the
 * verified NextAuth session userId before forwarding to the Hono backend,
 * so the backend can rely on the signature (HMAC over userId + exp).
 *
 * NEVER import this from a client component — the secret must not leak
 * into the browser bundle.
 */
import "server-only";
import { createHmac } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour — proxy mints a fresh token per request

let cachedSecret: Buffer | null = null;

function getSecret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const env = process.env.API_SHARED_SECRET || process.env.AUTH_SECRET || "";
  if (!env && process.env.NODE_ENV === "production") {
    throw new Error(
      "API_SHARED_SECRET (or AUTH_SECRET) must be set in production",
    );
  }
  cachedSecret = Buffer.from(env || "lunark-dev-insecure-secret", "utf8");
  return cachedSecret;
}

export function signApiToken(
  userId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${userId}.${exp}`;
  const tag = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${tag}`;
}
