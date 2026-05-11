import type { NextAuthConfig } from "next-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
// How often (ms) to revalidate the user against the backend. 60s is short
// enough that an admin ban or account deletion forces a sign-out on the
// banned user's next request without flooding the API on every page load.
const BAN_CHECK_INTERVAL_MS = 60_000;

export const authConfig = {
  basePath: "/api/nextauth",
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role ?? "customer";
        token.name = user.name;
        token.picture = user.image;
        (token as { lastCheckAt?: number }).lastCheckAt = Date.now();
      }
      if (trigger === "update" && updateData) {
        if (updateData.name !== undefined) token.name = updateData.name;
        if (updateData.image !== undefined) token.picture = updateData.image;
      }
      // Periodic backend revalidation. If the user no longer exists or was
      // banned by an admin, returning null invalidates the JWT and the next
      // request triggers a redirect to /login.
      const lastCheckAt = (token as { lastCheckAt?: number }).lastCheckAt ?? 0;
      if (token.id && Date.now() - lastCheckAt > BAN_CHECK_INTERVAL_MS) {
        try {
          const res = await fetch(
            `${API_URL}/auth/account-status?userId=${encodeURIComponent(token.id as string)}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const data = (await res.json()) as {
              exists?: boolean;
              banned?: boolean;
              role?: string;
              name?: string;
              image?: string | null;
            };
            if (!data.exists || data.banned) return null;
            if (data.role) token.role = data.role;
            if (typeof data.name === "string") token.name = data.name;
            if (data.image !== undefined) token.picture = data.image;
            (token as { lastCheckAt?: number }).lastCheckAt = Date.now();
          }
        } catch {
          // Backend unreachable — keep the existing token instead of locking
          // the user out, mirroring how most apps handle transient API errors.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.name = token.name as string;
        session.user.image = (token.picture as string) ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;
