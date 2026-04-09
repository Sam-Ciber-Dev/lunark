import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
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
