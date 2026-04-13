"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`${API_URL}/admin/products`, {
      headers: { "x-user-id": session.user.id },
    })
      .then((r) => r.json())
      .then((d) => setProducts(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const deleteProduct = async (id: string) => {
    if (!session?.user) return;
    if (!confirm(t.adminProducts.confirmDelete)) return;

    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
      headers: { "x-user-id": session.user.id },
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t.adminProducts.title} ({products.length})</h2>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.adminProducts.newProduct}
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {t.adminProducts.noProducts}
        </p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.price.toFixed(2)} € · {product.variants?.length ?? 0} {t.adminProducts.variants}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {product.featured && <Badge variant="secondary">{t.adminProducts.featured}</Badge>}
                <Badge variant={product.active ? "default" : "destructive"}>
                  {product.active ? t.adminProducts.active : t.adminProducts.inactive}
                </Badge>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/products/${product.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
