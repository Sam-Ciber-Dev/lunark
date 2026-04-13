import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Track Your Order",
  description: "Track your Lunark order — email updates, account tracking, carrier links, and delivery statuses explained.",
  alternates: { canonical: "/how-to-track" },
  openGraph: { title: "Track Your Order — Lunark", description: "Follow your package from dispatch to delivery." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
