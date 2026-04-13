import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Lunark's cookie policy — what cookies we use, why, and how to manage your preferences.",
  openGraph: { title: "Cookie Policy — Lunark", description: "Learn about the cookies we use and your options." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
