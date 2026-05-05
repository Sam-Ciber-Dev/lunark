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

/* ─── Tab IDs ─── */
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
          href={`/admin/products`}
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
        <div key={label} className="rounded-lg border border-border bg-card p-4">
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

/* ─── Main dashboard ─── */
export default function AdminDashboard({ userId }: { userId: string }) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("insert-product");

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "insert-product", label: locale === "pt" ? "Inserir Produto" : "Add Product", icon: Plus },
    { id: "most-carted", label: locale === "pt" ? "Mais no Carrinho" : "Most Carted", icon: ShoppingCart },
    { id: "most-wishlisted", label: locale === "pt" ? "Mais Desejados" : "Most Wishlisted", icon: Heart },
    { id: "most-ordered", label: locale === "pt" ? "Mais Comprados" : "Most Ordered", icon: TrendingUp },
    { id: "news", label: locale === "pt" ? "Notícias" : "News", icon: Newspaper },
    { id: "support", label: locale === "pt" ? "Apoio ao Cliente" : "Support", icon: Headphones },
    { id: "visits", label: locale === "pt" ? "Visitas" : "Visits", icon: BarChart2 },
    { id: "security", label: locale === "pt" ? "Segurança" : "Security", icon: ShieldCheck },
    { id: "chat", label: "Chat Admin", icon: MessageSquare },
  ];

  return (
    <div>
      {/* Overview stats */}
      <div className="mb-6">
        <h1 className="mb-4 text-xl font-semibold">
          {locale === "pt" ? "Painel de Administração" : "Admin Panel"}
        </h1>
        <StatsOverview userId={userId} />
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
              activeTab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-border bg-card p-6">

        {activeTab === "insert-product" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {locale === "pt" ? "Inserir Produto" : "Add Product"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "pt"
                    ? "Cria um novo produto no catálogo"
                    : "Create a new product in the catalogue"}
                </p>
              </div>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                {locale === "pt" ? "Novo Produto" : "New Product"}
              </Link>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border bg-card">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {locale === "pt" ? "Gerir produtos" : "Manage products"}
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {locale === "pt"
                  ? "Cria, edita e remove produtos do catálogo da loja"
                  : "Create, edit and remove products from the store catalogue"}
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/admin/products/new"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {locale === "pt" ? "Criar produto" : "Create product"}
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {locale === "pt" ? "Ver todos" : "View all"}
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "most-carted" && (
          <div>
            <h2 className="mb-4 text-base font-semibold">
              {locale === "pt" ? "Produtos mais adicionados ao carrinho" : "Most added to cart"}
            </h2>
            <TopProductsList userId={userId} endpoint="/admin/stats/most-carted" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
          </div>
        )}

        {activeTab === "most-wishlisted" && (
          <div>
            <h2 className="mb-4 text-base font-semibold">
              {locale === "pt" ? "Produtos mais desejados" : "Most wishlisted products"}
            </h2>
            <TopProductsList userId={userId} endpoint="/admin/stats/most-wishlisted" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
          </div>
        )}

        {activeTab === "most-ordered" && (
          <div>
            <h2 className="mb-4 text-base font-semibold">
              {locale === "pt" ? "Produtos mais comprados" : "Most purchased products"}
            </h2>
            <TopProductsList userId={userId} endpoint="/admin/stats/most-ordered" emptyLabel={locale === "pt" ? "Sem dados suficientes" : "Not enough data"} />
          </div>
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
