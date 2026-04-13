import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Lunark's privacy policy — how we collect, use, and protect your personal data under GDPR.",
  openGraph: { title: "Privacy Policy — Lunark", description: "How we handle and protect your personal data." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
