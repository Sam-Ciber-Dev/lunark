import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    "/shipping-info",
    "/returns",
    "/how-to-order",
    "/how-to-track",
    "/size-guide",
    "/payment-methods",
    "/bonus-points",
    "/careers",
    "/sustainability",
    "/press",
    "/affiliates",
    "/login",
    "/register",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : path === "/shop" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.6,
  }));

  // Fetch product slugs for dynamic pages
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products: { slug: string }[] = data.data ?? [];
      productEntries = products.map((p) => ({
        url: `${BASE_URL}/shop/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {}

  return [...staticEntries, ...productEntries];
}
