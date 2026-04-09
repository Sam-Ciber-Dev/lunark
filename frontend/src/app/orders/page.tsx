import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/product";

export const metadata: Metadata = { title: "Encomendas" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  shipped: "Enviada",
  delivered: "Entregue",
  cancelled: "Cancelada",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orders: Order[] = [];
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { "x-user-id": session.user.id },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      orders = data.data ?? [];
    }
  } catch {}

  if (orders.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Sem encomendas</h1>
        <p className="text-muted-foreground">
          Ainda não fizeste nenhuma encomenda.
        </p>
        <Button asChild>
          <Link href="/shop">Explorar loja</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">As minhas encomendas</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("pt-PT")}
                </p>
                <p className="font-semibold">{order.total.toFixed(2)} €</p>
              </div>
              <Badge
                variant={
                  order.status === "cancelled" ? "destructive" : "secondary"
                }
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
