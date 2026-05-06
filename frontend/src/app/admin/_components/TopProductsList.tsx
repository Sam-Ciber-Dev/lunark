"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface TopProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  count: number;
}

export default function TopProductsList({
  userId,
  endpoint,
  emptyLabel,
}: {
  userId: string;
  endpoint: string;
  emptyLabel: string;
}) {
  const [items, setItems] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}${endpoint}`, { headers: { "x-user-id": userId } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId, endpoint]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <Link
          key={item.productId}
          href="/admin/products"
          className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
        >
          <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{idx + 1}</span>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
          <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {item.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
