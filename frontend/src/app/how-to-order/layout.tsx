import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Order",
  description: "Step-by-step guide to ordering at Lunark — browse, add to cart, checkout, and track your delivery.",
  alternates: { canonical: "/how-to-order" },
  openGraph: { title: "How to Order — Lunark", description: "A simple guide to placing your first order." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
