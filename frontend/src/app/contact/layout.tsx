import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Lunark — customer support, business inquiries, and feedback.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact — Lunark", description: "Reach our team for support, inquiries, or feedback." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
