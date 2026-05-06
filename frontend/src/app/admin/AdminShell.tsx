"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

type TabId =
  | "insert-product"
  | "most-carted"
  | "most-wishlisted"
  | "most-ordered"
  | "news"
  | "support"
  | "visits"
  | "security"
  | "chat";

interface TabDef {
  id: TabId;
  href: string;
  icon: React.ElementType;
  gradient: string;
  matchPrefix?: string;
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
        <div key={label} className="rounded-xl border border-border bg-card p-4">
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

/* ─── Tab card ─── */
function TabCard({
  href,
  label,
  icon: Icon,
  gradient,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]",
        active
          ? "border-primary/50 bg-card shadow-[0_0_20px_rgba(var(--primary)/0.15)]"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200",
          gradient,
          active ? "shadow-lg" : "group-hover:shadow-md"
        )}
      >
        <Icon className="h-7 w-7 text-white drop-shadow" />
      </div>
      <span
        className={cn(
          "text-xs font-semibold tracking-wide transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── Shell ─── */
export default function AdminShell({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { locale } = useI18n();
  const pathname = usePathname() ?? "";

  const tabs: (TabDef & { label: string })[] = [
    {
      id: "insert-product",
      href: "/admin/products/new",
      label: locale === "pt" ? "Inserir Produto" : "Add Product",
      icon: Plus,
      gradient: "bg-gradient-to-br from-amber-500/80 to-yellow-600/80",
      matchPrefix: "/admin/products",
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

  const isActive = (tab: TabDef) => {
    if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix);
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  };

  const activeTab = tabs.find(isActive);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">
          {locale === "pt" ? "Painel de Administração" : "Admin Panel"}
        </h1>
        <StatsOverview userId={userId} />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {tabs.map((tab) => (
          <TabCard
            key={tab.id}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            gradient={tab.gradient}
            active={isActive(tab)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {activeTab && (
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", activeTab.gradient)}>
              <activeTab.icon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold">{activeTab.label}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
