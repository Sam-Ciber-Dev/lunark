"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/product";

export function HomeContent({ featured }: { featured: Product[] }) {
  const { t } = useI18n();

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
        <div className="relative">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary animate-fade-in-up">
            {t.hero.badge}
          </p>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in-up animation-delay-200">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in-up animation-delay-300">
            <Button asChild size="lg" className="group px-8">
              <Link href="/shop">
                {t.hero.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.featured.title}
          </h2>
          <Link
            href="/shop"
            className="group flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
          >
            {t.featured.viewAll}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t.featured.empty}</p>
        )}
      </section>

      {/* Values */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Sparkles, title: t.values.quality.title, desc: t.values.quality.desc },
            { icon: Truck, title: t.values.shipping.title, desc: t.values.shipping.desc },
            { icon: ShieldCheck, title: t.values.returns.title, desc: t.values.returns.desc },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <item.icon className="mx-auto mb-4 h-6 w-6 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
