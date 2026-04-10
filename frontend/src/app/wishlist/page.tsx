"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import type { WishlistItem } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const { format } = useCurrency();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { setLoading(false); return; }
    fetch(`${API_URL}/wishlist`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setItems(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status]);

  const removeItem = async (productId: string) => {
    try {
      await fetch(`${API_URL}/wishlist/${productId}`, { method: "DELETE", credentials: "include" });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch { /* ignore */ }
  };

  if (status === "loading" || loading) {
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">{t.wishlist.title}</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-card" />
              <div className="mt-3 h-4 w-3/4 rounded bg-card" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.wishlist.title}</h1>
        <p className="text-muted-foreground mb-6">{t.wishlist.loginRequired}</p>
        <Button asChild><Link href="/login">{t.auth.login}</Link></Button>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.wishlist.title}</h1>
        <p className="text-muted-foreground mb-6">{t.wishlist.empty}</p>
        <Button asChild><Link href="/shop">{t.wishlist.startBrowsing}</Link></Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t.wishlist.title}</h1>
        <span className="text-sm text-muted-foreground">{t.wishlist.itemCount.replace("{count}", String(items.length))}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-6">
        {items.map((item) => {
          const image = item.product.images?.[0];
          const discount = item.product.compareAtPrice && item.product.compareAtPrice > item.product.price
            ? Math.round((1 - item.product.price / item.product.compareAtPrice) * 100)
            : null;

          return (
            <div key={item.id} className="group relative">
              <Link href={`/shop/${item.product.slug}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
                  {image ? (
                    <img src={image.url} alt={image.alt ?? item.product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                  {discount && <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>}
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{format(item.product.price)}</span>
                    {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
                      <span className="text-xs text-muted-foreground line-through">{format(item.product.compareAtPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => removeItem(item.productId)}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 transition-colors"
                aria-label={t.wishlist.remove}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
