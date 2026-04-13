import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Lunark shipping options, delivery times, costs, and international shipping details.",
  openGraph: { title: "Shipping Info — Lunark", description: "Everything about our shipping options and delivery." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
