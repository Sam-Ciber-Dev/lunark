import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bonus Points",
  description: "Lunark rewards programme — earn points on every purchase, unlock tiers, and redeem exclusive discounts.",
  alternates: { canonical: "/bonus-points" },
  openGraph: { title: "Bonus Points — Lunark", description: "Earn points, level up, and redeem rewards at Lunark." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
