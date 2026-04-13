import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Lunark shipping details — EU and international delivery times, costs, and tracking information.",
  alternates: { canonical: "/shipping-info" },
  openGraph: { title: "Shipping Information — Lunark", description: "Fast EU delivery and worldwide shipping options." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
