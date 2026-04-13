import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Track Your Order",
  description: "Track your Lunark order — methods, order status guide, and common tracking questions.",
  openGraph: { title: "Track Your Order — Lunark", description: "Real-time order tracking and delivery updates." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
