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
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — Lunark`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {product.images.length > 0 ? (
            product.images.map((img) => (
              <div
                key={img.id}
                className="aspect-[3/4] overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={img.url}
                  alt={img.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-muted text-muted-foreground">
              Sem imagem
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
  );
}
