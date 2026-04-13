import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Lunark size guide — women’s and men’s clothing and shoe size charts in EU, UK, and US sizes.",
  alternates: { canonical: "/size-guide" },
  openGraph: { title: "Size Guide — Lunark", description: "Find your perfect fit with our comprehensive size charts." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
