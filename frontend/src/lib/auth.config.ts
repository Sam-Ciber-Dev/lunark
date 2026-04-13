import type { NextAuthConfig } from "next-auth";

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
      }
      if (trigger === "update" && updateData) {
        if (updateData.name !== undefined) token.name = updateData.name;
        if (updateData.image !== undefined) token.picture = updateData.image;
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
