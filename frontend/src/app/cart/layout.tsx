import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your shopping cart at Lunark.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
