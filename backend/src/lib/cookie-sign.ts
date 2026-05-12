/**
 * HMAC-signed cookie helpers.
 *
 * Used to issue server-set HttpOnly cookies that the client cannot forge
 * (the value carries an HMAC tag computed with a server-only secret).
 * Anyone deleting the cookie in DevTools simply loses the negative state
 * — they cannot upgrade themselves to "not blocked" without the secret.
 *
 * Secret resolution order:
 *   1. process.env.DEVICE_COOKIE_SECRET (preferred — stable across restarts)
 *   2. process.env.AUTH_SECRET          (reuse NextAuth secret if shared)
 *   3. Random per-process buffer        (cookies invalidate on restart,
 *      but the backend re-issues them via /traffic/register-fingerprint
 *      so the block is re-asserted within one navigation)
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

let cachedSecret: Buffer | null = null;

function getSecret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const env =
    process.env.DEVICE_COOKIE_SECRET ||
    process.env.AUTH_SECRET ||
    "";
  cachedSecret = env ? Buffer.from(env, "utf8") : randomBytes(32);
  return cachedSecret;
}

function hmac(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

/** Returns `${value}.${tag}` — pass to Set-Cookie. */
export function signValue(value: string): string {
  return `${value}.${hmac(value)}`;
}

/** Verifies a signed value. Returns the bare value or null if tampered. */
export function verifySigned(signed: string | undefined | null): string | null {
  if (!signed || typeof signed !== "string") return null;
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  const tag = signed.slice(idx + 1);
  const expected = hmac(value);
  try {
    const a = Buffer.from(tag);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? value : null;
  } catch {
    return null;
  }
}

/** Tiny `Cookie:` header parser. */
export function parseCookieHeader(header: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export const DEVICE_COOKIE = "lk_dev";
export const BLOCK_COOKIE = "lk_blk";

/**
 * Build a Set-Cookie string. We don't use Hono's `setCookie` so we can
 * control every attribute exactly and add multiple cookies in one response.
 *
 * Cross-origin (Vercel frontend → Fly backend) requires SameSite=None;Secure
 * for the browser to both store the cookie and send it back. In dev
 * (localhost without HTTPS) we fall back to SameSite=Lax with no Secure
 * because Secure cookies are rejected on plain http://.
 */
export function buildSetCookie(
  name: string,
  value: string,
  opts: {
    maxAge?: number; // seconds; 0 = expire
    secure?: boolean;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
  } = {}
): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts: string[] = [`${name}=${value}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? (isProd ? "None" : "Lax")}`);
  if (opts.secure ?? isProd) parts.push("Secure");
  if (typeof opts.maxAge === "number") {
    parts.push(`Max-Age=${opts.maxAge}`);
    if (opts.maxAge === 0) {
      parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    }
  }
  return parts.join("; ");
}
