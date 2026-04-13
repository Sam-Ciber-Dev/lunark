import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Lunark — our mission, values, and the team behind modern accessible fashion.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Lunark", description: "Our story, mission, and values." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
