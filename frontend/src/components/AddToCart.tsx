"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/types/product";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AddToCartProps {
  productId: string;
  variants: ProductVariant[];
}

export function AddToCart({ productId, variants }: AddToCartProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (!selectedSize) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ productId, size: selectedSize, quantity: 1 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao adicionar");
      }

      setMessage({ type: "success", text: "Adicionado ao carrinho!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium">Tamanho</span>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              disabled={v.stock === 0}
              onClick={() => setSelectedSize(v.size)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                selectedSize === v.size
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground",
                v.stock === 0 && "cursor-not-allowed opacity-40"
              )}
            >
              {v.size}
              {v.stock === 0 && " — Esgotado"}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!selectedSize || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "A adicionar…" : "Adicionar ao carrinho"}
      </Button>

      {message && (
        <p
          className={cn(
            "text-sm",
            message.type === "success" ? "text-green-600" : "text-destructive"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
