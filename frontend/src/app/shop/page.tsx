import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopContent } from "./ShopContent";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse the full Lunark collection — clothing, accessories, and more. Filter by category, size, colour, and price.",
  openGraph: {
    title: "Shop — Lunark",
    description:
      "Explore curated collections designed for those who dare to stand out.",
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopSkeleton() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="mb-6 h-8 w-48 rounded bg-card animate-pulse" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] rounded-lg bg-card" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-card" />
              <div className="h-4 w-1/2 rounded bg-card" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
