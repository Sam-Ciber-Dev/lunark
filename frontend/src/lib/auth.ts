import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/nextauth",
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        // If requires verification, we don't authenticate yet
        if (data.requiresVerification) return null;

        return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          image: data.image,
        };
      },
    }),
    Credentials({
      id: "verification-code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        type: { label: "Type", type: "text" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            code: credentials?.code,
            type: credentials?.type,
          }),
        });

        if (!res.ok) return null;

        const user = await res.json();
        if (!user.verified) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "google-verified",
      credentials: {
        credential: { label: "Google Credential", type: "text" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: credentials?.credential,
            mode: "signin",
          }),
        });

        if (!res.ok) return null;

        const user = await res.json();
        if (user.error) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
