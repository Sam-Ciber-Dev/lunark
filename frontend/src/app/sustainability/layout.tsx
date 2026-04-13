import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Lunark’s sustainability commitment — ethical sourcing, carbon-neutral shipping, eco-friendly packaging, and our roadmap to 2030.",
  alternates: { canonical: "/sustainability" },
  openGraph: { title: "Sustainability — Lunark", description: "Fashion that looks good and does good. Our sustainability mission." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
