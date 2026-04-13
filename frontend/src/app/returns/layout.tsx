import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Lunark's 30-day return policy — how to return items, refund process, and non-returnable items.",
  openGraph: { title: "Returns & Refunds — Lunark", description: "Easy 30-day returns with free EU return labels." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
