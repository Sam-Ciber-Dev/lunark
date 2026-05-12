/**
 * HMAC-signed API auth token.
 *
 * Replaces the previous "trust the x-user-id header" pattern. The frontend
 * (server-side only — never the browser) signs a short-lived token containing
 * the userId; the backend verifies the signature and timing-safe-compares
 * the HMAC tag before treating any request as authenticated.
 *
 * Token format: `<userId>.<expSeconds>.<base64url-hmac>`
 *
 * Secret resolution mirrors cookie-sign.ts so a single shared secret
 * (AUTH_SECRET) is enough in production. API_SHARED_SECRET takes precedence
 * when explicitly set.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

let cachedSecret: Buffer | null = null;

function getSecret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const env = process.env.API_SHARED_SECRET || process.env.AUTH_SECRET || "";
  if (!env && process.env.NODE_ENV === "production") {
    // Refuse to start serving auth-gated routes without a real secret.
    throw new Error(
      "API_SHARED_SECRET (or AUTH_SECRET) must be set in production",
    );
  }
  // Dev fallback — predictable but only used when no secret is configured.
  cachedSecret = Buffer.from(env || "lunark-dev-insecure-secret", "utf8");
  return cachedSecret;
}

function hmac(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

/** Issue a token for `userId` valid for `ttlSeconds`. */
export function signApiToken(
  userId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${userId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

/**
 * Verify a token. Returns the bare userId or null if missing/invalid/expired.
 * Also returns null if the token does not look like one of ours (so legacy
 * raw userIds being sent during a deploy transition simply fail closed).
 */
export function verifyApiToken(
  token: string | undefined | null,
): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, tag] = parts;
  if (!userId || !expStr || !tag) return null;

  const expected = hmac(`${userId}.${expStr}`);
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(tag);
    b = Buffer.from(expected);
  } catch {
    return null;
  }
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  return userId;
}
