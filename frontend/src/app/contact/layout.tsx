import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Lunark — customer support, general inquiries, and business partnerships.",
  openGraph: { title: "Contact Us — Lunark", description: "Reach out to our team for any questions or support." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
