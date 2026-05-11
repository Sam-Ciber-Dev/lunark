"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  Globe,
  Heart,
  Headphones,
  MessageSquare,
  Newspaper,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Stats {
  products: number;
  orders: number;
  users: number;
  categories: number;
}

interface TabDef {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
}

/* ─── Stats overview ─── */
function StatsOverview({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/stats`, { headers: { "x-user-id": userId } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, [userId]);

  const cards = [
    { label: "Produtos", value: stats?.products ?? "—", icon: ShoppingBag },
    { label: "Encomendas", value: stats?.orders ?? "—", icon: Package },
    { label: "Utilizadores", value: stats?.users ?? "—", icon: Globe },
    { label: "Categorias", value: stats?.categories ?? "—", icon: BarChart2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab card (animated, professional) ─── */
function TabCard({
  href,
  label,
  icon: Icon,
  gradient,
  index,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        "group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5",
        "transition-all duration-300 ease-out will-change-transform",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]",
        "active:scale-[0.97] active:duration-75",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
      )}
    >
      {/* Gradient glow on hover */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30",
          gradient
        )}
      />

      {/* Arrow indicator */}
      <ArrowUpRight
        aria-hidden
        className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100"
      />

      {/* Icon bubble */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
          gradient,
          "shadow-md group-hover:shadow-xl group-hover:scale-105"
        )}
      >
        <Icon className="h-7 w-7 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />
      </div>

      <span className="text-center text-xs font-semibold tracking-wide text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
        {label}
      </span>
    </Link>
  );
}

/* ─── Shell (hub view at /admin) ─── */
export default function AdminShell({ userId }: { userId: string }) {
  const { locale } = useI18n();

  const tabs: TabDef[] = [
    {
      id: "insert-product",
      href: "/admin/products/new",
      label: locale === "pt" ? "Inserir Produto" : "Add Product",
      icon: Plus,
      gradient: "bg-gradient-to-br from-amber-500/80 to-yellow-600/80",
    },
    {
      id: "most-carted",
      href: "/admin/stats/most-carted",
      label: locale === "pt" ? "Mais no Carrinho" : "Most Carted",
      icon: ShoppingCart,
      gradient: "bg-gradient-to-br from-emerald-500/80 to-teal-600/80",
    },
    {
      id: "most-wishlisted",
      href: "/admin/stats/most-wishlisted",
      label: locale === "pt" ? "Mais Desejados" : "Most Wishlisted",
      icon: Heart,
      gradient: "bg-gradient-to-br from-rose-500/80 to-pink-600/80",
    },
    {
      id: "most-ordered",
      href: "/admin/stats/most-ordered",
      label: locale === "pt" ? "Mais Comprados" : "Most Ordered",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-violet-500/80 to-purple-600/80",
    },
    {
      id: "news",
      href: "/admin/news",
      label: locale === "pt" ? "Notícias" : "News",
      icon: Newspaper,
      gradient: "bg-gradient-to-br from-sky-500/80 to-blue-600/80",
    },
    {
      id: "support",
      href: "/admin/support",
      label: locale === "pt" ? "Apoio ao Cliente" : "Support",
      icon: Headphones,
      gradient: "bg-gradient-to-br from-orange-500/80 to-amber-600/80",
    },
    {
      id: "visits",
      href: "/admin/visits",
      label: locale === "pt" ? "Visitas" : "Visits",
      icon: BarChart2,
      gradient: "bg-gradient-to-br from-cyan-500/80 to-teal-600/80",
    },
    {
      id: "security",
      href: "/admin/security",
      label: locale === "pt" ? "Segurança" : "Security",
      icon: ShieldCheck,
      gradient: "bg-gradient-to-br from-red-500/80 to-rose-700/80",
    },
    {
      id: "chat",
      href: "/admin/chat",
      label: "Chat Admin",
      icon: MessageSquare,
      gradient: "bg-gradient-to-br from-indigo-500/80 to-violet-600/80",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          {locale === "pt" ? "Painel de Administração" : "Admin Panel"}
        </h1>
        <p className="mb-4 text-xs text-muted-foreground">
          {locale === "pt"
            ? "Escolhe uma das áreas para gerir a tua loja."
            : "Pick an area to manage your store."}
        </p>
        <StatsOverview userId={userId} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tabs.map((tab, i) => (
          <TabCard
            key={tab.id}
            index={i}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            gradient={tab.gradient}
          />
        ))}
      </div>
    </div>
  );
}
