import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@/types/product";
import { AddToCart } from "@/components/AddToCart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.description ?? `${product.name} — Shop at Lunark`;
  const ogImage = product.images[0]?.url;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com"}/shop/${params.slug}`,
    },
    openGraph: {
      title: `${product.name} — Lunark`,
      description,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com"}/shop/${params.slug}`,
      ...(ogImage && { images: [{ url: ogImage, width: 800, height: 1067, alt: product.name }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: `${product.name} — Lunark`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunark.com";

  const variants = product.variants ?? [];
  const hasMultipleVariants = variants.length > 1;

  const productSchema: Record<string, unknown> = {
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((img) => img.url),
    url: `${siteUrl}/shop/${product.slug}`,
    sku: product.id,
    brand: { "@type": "Brand", name: "Lunark" },
    ...(product.color && { color: product.color }),
    ...(product.material && { material: product.material }),
    itemCondition: "https://schema.org/NewCondition",
    offers: hasMultipleVariants
      ? {
          "@type": "AggregateOffer",
          lowPrice: product.price.toFixed(2),
          highPrice: (product.compareAtPrice ?? product.price).toFixed(2),
          priceCurrency: "EUR",
          offerCount: variants.length,
          availability: variants.some((v) => v.stock > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          offers: variants.map((v) => ({
            "@type": "Offer",
            sku: v.id,
            name: `${product.name} — ${v.size}`,
            price: product.price.toFixed(2),
            priceCurrency: "EUR",
            availability: v.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${siteUrl}/shop/${product.slug}`,
            itemCondition: "https://schema.org/NewCondition",
          })),
        }
      : {
          "@type": "Offer",
          price: product.price.toFixed(2),
          priceCurrency: "EUR",
          availability: variants.some((v) => v.stock > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${siteUrl}/shop/${product.slug}`,
          itemCondition: "https://schema.org/NewCondition",
        },
  };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${siteUrl}/shop/${product.slug}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [productSchema, breadcrumbSchema],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {product.images.length > 0 ? (
            product.images.map((img) => (
              <div
                key={img.id}
                className="aspect-[3/4] overflow-hidden rounded-lg bg-card"
              >
                <img
                  src={img.url}
                  alt={img.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-card text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">
              {product.price.toFixed(2)} €
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.compareAtPrice.toFixed(2)} €
                </span>
              )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <AddToCart productId={product.id} variants={product.variants ?? []} />
        </div>
      </div>
    </section>
    </>
  );
}
