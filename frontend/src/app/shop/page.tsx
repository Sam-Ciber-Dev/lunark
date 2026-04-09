import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loja" };

export default function ShopPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Loja</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </section>
  );
}
