import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
        const res = await callApi("/auth/login", {
          email: credentials?.email,
          password: credentials?.password,
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
        const res = await callApi("/auth/verify-code", {
          email: credentials?.email,
          code: credentials?.code,
          type: credentials?.type,
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
        const res = await callApi("/auth/google", {
          credential: credentials?.credential,
          mode: "signin",
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
