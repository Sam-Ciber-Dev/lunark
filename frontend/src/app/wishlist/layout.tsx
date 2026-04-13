import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved items at Lunark.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/wishlist" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
