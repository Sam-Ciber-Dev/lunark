import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Lunark — orders, payments, returns, intellectual property, and liability.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms & Conditions — Lunark", description: "Read our terms of service before shopping." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
