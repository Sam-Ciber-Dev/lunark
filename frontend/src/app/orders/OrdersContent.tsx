"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { Order } from "@/types/product";

export default function OrdersContent({ orders }: { orders: Order[] }) {
  const { t, locale } = useI18n();

  const statusLabels: Record<string, string> = {
    pending: t.ordersPage.pending,
    confirmed: t.ordersPage.confirmed,
    shipped: t.ordersPage.shipped,
    delivered: t.ordersPage.delivered,
    cancelled: t.ordersPage.cancelled,
  };

  if (orders.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t.ordersPage.noOrders}</h1>
        <Button asChild>
          <Link href="/shop">{t.ordersPage.exploreShop}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{t.ordersPage.title}</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-border/40 bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString(locale === "pt" ? "pt-PT" : "en-US")}
                </p>
                <p className="font-semibold">{order.total.toFixed(2)} €</p>
              </div>
              <Badge
                variant={
                  order.status === "cancelled" ? "destructive" : "secondary"
                }
              >
                {statusLabels[order.status] ?? order.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
