import { HomeContent } from "./HomeContent";
import type { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Lunark",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Lunark",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function Home() {
  const featured = await getFeaturedProducts();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent featured={featured} />
    </>
  );
}
