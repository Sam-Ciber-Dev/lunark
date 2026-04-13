import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press & Media",
  description: "Lunark press releases, media coverage, and brand assets. Contact our team for press inquiries.",
  alternates: { canonical: "/press" },
  openGraph: { title: "Press & Media — Lunark", description: "Latest news, press releases, and media resources." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
