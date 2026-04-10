"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const image = product.images[0];

  useEffect(() => {
    if (!session?.user) return;
    fetch(`${API_URL}/wishlist/check/${product.id}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setWishlisted(d.inWishlist); })
      .catch(() => {});
  }, [session, product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) { router.push("/login"); return; }
    try {
      if (wishlisted) {
        await fetch(`${API_URL}/wishlist/${product.id}`, { method: "DELETE", credentials: "include" });
        setWishlisted(false);
      } else {
        await fetch(`${API_URL}/wishlist`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ productId: product.id }) });
        setWishlisted(true);
      }
    } catch { /* ignore */ }
  };

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <Link href={`/shop/${product.slug}`} className="group relative">
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
        {discount && (
          <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          aria-label={t.product.addToWishlist}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight transition-colors group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{format(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">{format(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
