import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Lunark uses cookies — types, purposes, third-party cookies, and your control options.",
  alternates: { canonical: "/cookie-policy" },
  openGraph: { title: "Cookie Policy — Lunark", description: "Understand how we use cookies and manage your preferences." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
