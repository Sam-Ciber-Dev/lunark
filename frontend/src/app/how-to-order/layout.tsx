import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Order",
  description: "Step-by-step guide to ordering from Lunark — browse, add to cart, checkout, and delivery.",
  openGraph: { title: "How to Order — Lunark", description: "Simple 4-step ordering process at Lunark." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
