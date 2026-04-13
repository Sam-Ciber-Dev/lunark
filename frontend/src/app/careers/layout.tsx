import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Lunark team — open positions in engineering, design, marketing, and more. Remote-first culture.",
  alternates: { canonical: "/careers" },
  openGraph: { title: "Careers — Lunark", description: "Build the future of fashion with us. See open positions." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
