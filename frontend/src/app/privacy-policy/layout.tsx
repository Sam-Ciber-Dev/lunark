import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Lunark privacy policy — how we collect, use, and protect your personal data under GDPR.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: { title: "Privacy Policy — Lunark", description: "Your privacy matters. Read our GDPR-compliant privacy policy." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
