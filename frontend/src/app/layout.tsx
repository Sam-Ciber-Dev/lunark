import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Lunark — Moda com Estilo",
    template: "%s | Lunark",
  },
  description:
    "Loja online de roupa moderna e acessível. Descobre as últimas tendências na Lunark.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Lunark — Moda com Estilo",
    description:
      "Loja online de roupa moderna e acessível. Descobre as últimas tendências na Lunark.",
    siteName: "Lunark",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
