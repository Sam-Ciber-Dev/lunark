import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/SessionProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com";

export const metadata: Metadata = {
  title: {
    default: "Lunark — Elevate Your Style",
    template: "%s | Lunark",
  },
  description:
    "Modern fashion store — curated collections designed for those who dare to stand out.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  keywords: [
    "fashion",
    "clothing",
    "online store",
    "modern fashion",
    "sustainable fashion",
    "Lunark",
    "roupa",
    "moda",
    "loja online",
    "streetwear",
    "women fashion",
    "men fashion",
  ],
  authors: [{ name: "Lunark" }],
  creator: "Lunark",
  publisher: "Lunark",
  formatDetection: {
    email: false,
    telephone: false,
  },
  other: {
    "theme-color": "#000000",
  },
  openGraph: {
    title: "Lunark — Elevate Your Style",
    description:
      "Modern fashion store — curated collections designed for those who dare to stand out.",
    siteName: "Lunark",
    locale: "en",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Lunark — Elevate Your Style",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lunark — Elevate Your Style",
    description:
      "Modern fashion store — curated collections designed for those who dare to stand out.",
    site: "@lunark",
    creator: "@lunark",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <head>
        {/* Pre-load Cloudflare Turnstile so the widget is ready instantly on auth pages */}
        <link
          rel="preconnect"
          href="https://challenges.cloudflare.com"
          crossOrigin="anonymous"
        />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased">
        <I18nProvider>
          <CurrencyProvider>
            <SessionProvider>
              <SiteChrome>{children}</SiteChrome>
            </SessionProvider>
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
