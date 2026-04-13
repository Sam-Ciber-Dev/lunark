"use client";

import { Package, ShoppingBag, Tag, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Stats {
  products: number;
  orders: number;
  users: number;
  categories: number;
}

const icons = {
  products: ShoppingBag,
  orders: Package,
  users: Users,
  categories: Tag,
} as const;

export default function DashboardContent({ stats }: { stats: Stats }) {
  const { t } = useI18n();

  const statCards = [
    { key: "products" as const, label: t.adminDashboard.products },
    { key: "orders" as const, label: t.adminDashboard.orders },
    { key: "users" as const, label: t.adminDashboard.users },
    { key: "categories" as const, label: t.adminDashboard.categories },
  ];

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">{t.adminDashboard.overview}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = icons[card.key];
          return (
            <div key={card.key} className="rounded-lg border p-6">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats[card.key]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
