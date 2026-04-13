import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Lunark returns policy — 30-day returns, free EU return labels, and hassle-free refund process.",
  alternates: { canonical: "/returns" },
  openGraph: { title: "Returns & Refunds — Lunark", description: "30-day returns with free EU shipping labels." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
