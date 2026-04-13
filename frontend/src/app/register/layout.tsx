import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Lunark account — get access to order tracking, wishlist, and exclusive rewards.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
