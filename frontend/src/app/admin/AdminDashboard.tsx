"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* ─── Types ─── */
interface TopProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  count: number;
}

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

/* ─── Placeholder panel ─── */
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
        <TrendingUp className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">Em breve</p>
    </div>
  );
}

/* ─── Top products list ─── */
function TopProductsList({ userId, endpoint, emptyLabel }: { userId: string; endpoint: string; emptyLabel: string }) {
  const [items, setItems] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}${endpoint}`, { headers: { "x-user-id": userId } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId, endpoint]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <Link
          key={item.productId}
          href="/admin/products"
          className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
        >
          <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{idx + 1}</span>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
          <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {item.count}
          </span>
        </Link>
      ))}
    </div>
  );
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

/* ─── Tab icon card ─── */
interface TabCardProps {
  id: TabId;
  label: string;
  icon: React.ElementType;
  gradient: string;
  active: boolean;
  onClick: () => void;
}

function TabCard({ label, icon: Icon, gradient, active, onClick }: TabCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]",
        active
          ? "border-primary/50 bg-card shadow-[0_0_20px_rgba(var(--primary)/0.15)]"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200",
          gradient,
          active ? "shadow-lg" : "group-hover:shadow-md"
        )}
      >
        <Icon className="h-7 w-7 text-white drop-shadow" />
      </div>
      {/* Label */}
      <span
        className={cn(
          "text-xs font-semibold tracking-wide transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── Main dashboard ─── */
export default function AdminDashboard({ userId }: { userId: string }) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("insert-product");

  const tabs: { id: TabId; label: string; icon: React.ElementType; gradient: string }[] = [
    {
      id: "insert-product",
      label: locale === "pt" ? "Inserir Produto" : "Add Product",
      icon: Plus,
      gradient: "bg-gradient-to-br from-amber-500/80 to-yellow-600/80",
    },
    {
      id: "most-carted",
      label: locale === "pt" ? "Mais no Carrinho" : "Most Carted",
      icon: ShoppingCart,
      gradient: "bg-gradient-to-br from-emerald-500/80 to-teal-600/80",
    },
    {
      id: "most-wishlisted",
      label: locale === "pt" ? "Mais Desejados" : "Most Wishlisted",
      icon: Heart,
      gradient: "bg-gradient-to-br from-rose-500/80 to-pink-600/80",
    },
    {
      id: "most-ordered",
      label: locale === "pt" ? "Mais Comprados" : "Most Ordered",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-violet-500/80 to-purple-600/80",
    },
    {
      id: "news",
      label: locale === "pt" ? "Notícias" : "News",
      icon: Newspaper,
      gradient: "bg-gradient-to-br from-sky-500/80 to-blue-600/80",
    },
    {
      id: "support",
      label: locale === "pt" ? "Apoio ao Cliente" : "Support",
      icon: Headphones,
      gradient: "bg-gradient-to-br from-orange-500/80 to-amber-600/80",
    },
    {
      id: "visits",
      label: locale === "pt" ? "Visitas" : "Visits",
      icon: BarChart2,
      gradient: "bg-gradient-to-br from-cyan-500/80 to-teal-600/80",
    },
    {
      id: "security",
      label: locale === "pt" ? "Segurança" : "Security",
      icon: ShieldCheck,
      gradient: "bg-gradient-to-br from-red-500/80 to-rose-700/80",
    },
    {
      id: "chat",
      label: "Chat Admin",
      icon: MessageSquare,
      gradient: "bg-gradient-to-br from-indigo-500/80 to-violet-600/80",
    },
  ];

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div>
      {/* Overview stats */}
      <div className="mb-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">
          {locale === "pt" ? "Painel de Administração" : "Admin Panel"}
        </h1>
        <StatsOverview userId={userId} />
      </div>

      {/* Tab cards grid */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {tabs.map((tab) => (
          <TabCard
            key={tab.id}
            {...tab}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Active tab content */}
      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Content header */}
        {activeTabData && (
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", activeTabData.gradient)}>
              <activeTabData.icon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold">{activeTabData.label}</h2>
          </div>
        )}

        {activeTab === "insert-product" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              {locale === "pt"
                ? "Cria, edita e remove produtos do catálogo da loja"
                : "Create, edit and remove products from the store catalogue"}
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                {locale === "pt" ? "Criar produto" : "Create product"}
              </Link>
              <Link
                href="/admin/products"
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:bg-accent active:scale-[0.97]"
              >
                {locale === "pt" ? "Ver todos" : "View all"}
              </Link>
            </div>
          </div>
        )}

        {activeTab === "most-carted" && (
          <TopProductsList userId={userId} endpoint="/admin/stats/most-carted" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
        )}

        {activeTab === "most-wishlisted" && (
          <TopProductsList userId={userId} endpoint="/admin/stats/most-wishlisted" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
        )}

        {activeTab === "most-ordered" && (
          <TopProductsList userId={userId} endpoint="/admin/stats/most-ordered" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
        )}

        {activeTab === "news" && <ComingSoon label={locale === "pt" ? "Notícias" : "News"} />}
        {activeTab === "support" && <ComingSoon label={locale === "pt" ? "Apoio ao Cliente" : "Customer Support"} />}
        {activeTab === "visits" && <ComingSoon label={locale === "pt" ? "Visitas ao Website" : "Website Visits"} />}
        {activeTab === "security" && <ComingSoon label={locale === "pt" ? "Segurança" : "Security"} />}
        {activeTab === "chat" && <ComingSoon label="Chat Admin" />}
      </div>
    </div>
  );
}

