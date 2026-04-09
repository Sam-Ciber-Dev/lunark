import { auth } from "@/lib/auth";
import { Package, ShoppingBag, Tag, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Stats {
  products: number;
  orders: number;
  users: number;
  categories: number;
}

async function getStats(userId: string): Promise<Stats> {
  try {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: { "x-user-id": userId },
      cache: "no-store",
    });
    if (!res.ok) return { products: 0, orders: 0, users: 0, categories: 0 };
    return res.json();
  } catch {
    return { products: 0, orders: 0, users: 0, categories: 0 };
  }
}

const statCards = [
  { key: "products" as const, label: "Produtos", icon: ShoppingBag },
  { key: "orders" as const, label: "Encomendas", icon: Package },
  { key: "users" as const, label: "Utilizadores", icon: Users },
  { key: "categories" as const, label: "Categorias", icon: Tag },
];

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getStats(session!.user.id);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Visão geral</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-lg border p-6"
            >
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
