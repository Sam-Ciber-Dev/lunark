"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const image = product.images[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
        {image ? (
          <img
            src={image.url}
            alt={image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {t.product.noImage}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {product.price.toFixed(2)} €
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {product.compareAtPrice.toFixed(2)} €
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
