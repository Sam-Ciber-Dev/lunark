import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Join Lunark’s affiliate programme — earn up to 12% commission sharing fashion with your audience.",
  alternates: { canonical: "/affiliates" },
  openGraph: { title: "Affiliate Program — Lunark", description: "Earn commissions by promoting Lunark. Up to 12% per sale." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
