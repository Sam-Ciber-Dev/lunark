"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

interface AdminOrder {
  id: string;
  userId: string;
  status: string;
  total: number;
  notes: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`${API_URL}/admin/orders`, {
      headers: { "x-user-id": session.user.id },
    })
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!session?.user) return;
    setUpdating(orderId);

    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch {}
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">
        Orders ({orders.length})
      </h2>

      {orders.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No orders.
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {order.user?.name ?? "User"}{" "}
                    <span className="text-sm text-muted-foreground">
                      ({order.user?.email})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("pt-PT")} ·{" "}
                    {order.total.toFixed(2)} €
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8)}...
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      order.status === "cancelled" ? "destructive" : "secondary"
                    }
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
