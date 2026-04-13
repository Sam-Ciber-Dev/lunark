import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Lunark's terms of service — rules, policies, and legal information governing your use of our platform.",
  openGraph: { title: "Terms & Conditions — Lunark", description: "Our terms of service and usage policies." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
