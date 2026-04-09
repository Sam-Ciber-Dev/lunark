"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (!session?.user) return;

    fetch(`${API_URL}/cart`, {
      headers: { "x-user-id": session.user.id },
    })
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status, router]);

  const updateQuantity = async (id: string, quantity: number) => {
    if (!session?.user) return;
    setActing(id);
    try {
      const res = await fetch(`${API_URL}/cart/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
      }
    } catch {}
    setActing(null);
  };

  const removeItem = async (id: string) => {
    if (!session?.user) return;
    setActing(id);
    try {
      const res = await fetch(`${API_URL}/cart/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": session.user.id },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {}
    setActing(null);
  };

  const createOrder = async () => {
    if (!session?.user) return;
    setActing("order");
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.push("/orders");
      }
    } catch {}
    setActing(null);
  };

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );

  if (loading || status === "loading") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">O teu carrinho está vazio</h1>
        <p className="text-muted-foreground">
          Explora a nossa loja e adiciona produtos ao carrinho.
        </p>
        <Button asChild>
          <Link href="/shop">Ir para a loja</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Carrinho</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            {/* Image */}
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {item.product?.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sem img
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/shop/${item.product?.slug ?? ""}`}
                className="font-medium hover:underline"
              >
                {item.product?.name ?? "Produto"}
              </Link>
              <p className="text-sm text-muted-foreground">
                Tamanho: {item.variant?.size ?? "—"}
              </p>
              <p className="text-sm font-semibold">
                {((item.product?.price ?? 0) * item.quantity).toFixed(2)} €
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={item.quantity <= 1 || acting === item.id}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="rounded-md border p-1 hover:bg-muted disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                disabled={item.quantity >= 10 || acting === item.id}
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="rounded-md border p-1 hover:bg-muted disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Remove */}
            <button
              disabled={acting === item.id}
              onClick={() => removeItem(item.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-lg border p-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{total.toFixed(2)} €</span>
        </div>
        <Button
          onClick={createOrder}
          disabled={acting === "order"}
          className="mt-4 w-full"
          size="lg"
        >
          {acting === "order" ? "A processar…" : "Finalizar encomenda"}
        </Button>
      </div>
    </section>
  );
}
