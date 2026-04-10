"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  COLORS, MATERIALS, DESIGN_TYPES, STYLES, LENGTHS, SLEEVE_LENGTHS,
  FIT_TYPES, DETAILS, FABRIC_ELASTICITY, ALL_SIZES, SORT_OPTIONS,
} from "@lunark/shared";
import type { Product, Pagination, Category } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type FilterKey = "category" | "gender" | "color" | "material" | "designType" | "style" | "length" | "sleeveLength" | "fit" | "details" | "fabricElasticity" | "size" | "ageGroup";

const filterConfigs: { key: FilterKey; options: readonly string[]; i18nKey: string }[] = [
  { key: "color", options: COLORS, i18nKey: "colors" },
  { key: "size", options: ALL_SIZES, i18nKey: "" },
  { key: "material", options: MATERIALS, i18nKey: "materials" },
  { key: "designType", options: DESIGN_TYPES, i18nKey: "designTypes" },
  { key: "style", options: STYLES, i18nKey: "styles" },
  { key: "length", options: LENGTHS, i18nKey: "lengths" },
  { key: "sleeveLength", options: SLEEVE_LENGTHS, i18nKey: "sleeveLengths" },
  { key: "fit", options: FIT_TYPES, i18nKey: "fitTypes" },
  { key: "details", options: DETAILS, i18nKey: "detailValues" },
  { key: "fabricElasticity", options: FABRIC_ELASTICITY, i18nKey: "fabricElasticities" },
];

export function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>("color");

  // Active filters from URL
  const activeFilters: Record<string, string> = {};
  searchParams.forEach((v, k) => { activeFilters[k] = v; });
  const sort = activeFilters.sort ?? "recommended";

  const buildUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    return `/shop?${params.toString()}`;
  }, [searchParams]);

  const setFilter = (key: string, value: string | null) => {
    router.push(buildUrl({ [key]: value, page: null }));
  };

  const clearAllFilters = () => {
    router.push("/shop");
  };

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = searchParams.toString();
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_URL}/products?${query}`),
          fetch(`${API_URL}/categories${activeFilters.gender ? `?gender=${activeFilters.gender}` : ""}`),
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(data.data ?? []);
          setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.data ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = Object.keys(activeFilters).filter((k) => k !== "page" && k !== "sort" && k !== "q").length;
  const searchQuery = activeFilters.q;
  const genderLabel = activeFilters.gender ? (t.genders as Record<string, string>)[activeFilters.gender] ?? activeFilters.gender : null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {genderLabel ?? t.nav.shop}
          </h1>
          {searchQuery && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t.shop.searchResults} &quot;{searchQuery}&quot;
            </p>
          )}
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t.shop.productsFound.replace("{count}", String(pagination.total))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(!filtersOpen)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t.filters.title}
            {activeCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeCount}</span>}
          </Button>
          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setFilter("sort", e.target.value === "recommended" ? null : e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{(t.sort as Record<string, string>)[opt] ?? opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {Object.entries(activeFilters)
            .filter(([k]) => k !== "page" && k !== "sort" && k !== "q")
            .map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilter(key, null)}
                className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary transition-colors"
              >
                <span className="text-muted-foreground">{(t.filters as Record<string, string>)[key] ?? key}:</span>
                <span>{getTranslatedValue(t, key, value)}</span>
                <X className="h-3 w-3 ml-1" />
              </button>
            ))}
          <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">{t.filters.clearAll}</button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Filter sidebar - desktop always visible, mobile overlay */}
        <aside className={`${filtersOpen ? "fixed inset-0 z-50 bg-background overflow-y-auto p-4 lg:static lg:inset-auto lg:bg-transparent lg:p-0" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-semibold">{t.filters.title}</h2>
            <button onClick={() => setFiltersOpen(false)}><X className="h-5 w-5" /></button>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <FilterSection title={t.filters.category} expanded={expandedFilter === "category"} onToggle={() => setExpandedFilter(expandedFilter === "category" ? null : "category")}>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setFilter("category", activeFilters.category === cat.slug ? null : cat.slug); setFiltersOpen(false); }}
                    className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${activeFilters.category === cat.slug ? "text-primary font-medium bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Dynamic filters */}
          {filterConfigs.map(({ key, options, i18nKey }) => (
            <FilterSection key={key} title={(t.filters as Record<string, string>)[key] ?? key} expanded={expandedFilter === key} onToggle={() => setExpandedFilter(expandedFilter === key ? null : key)}>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const isActive = activeFilters[key] === opt;
                  const label = i18nKey ? ((t as unknown as Record<string, Record<string, string>>)[i18nKey]?.[opt] ?? opt) : opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => { setFilter(key, isActive ? null : opt); setFiltersOpen(false); }}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${isActive ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
                    >
                      {key === "color" && <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: opt === "multicolor" ? undefined : opt }} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </FilterSection>
          ))}

          {/* Sale filter */}
          <div className="border-b border-border/40 py-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activeFilters.onSale === "true"}
                onChange={(e) => setFilter("onSale", e.target.checked ? "true" : null)}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">{t.nav.sale}</span>
            </label>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-muted-foreground">{t.shop.noProducts}</p>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {pagination.page > 1 && (
                <Button variant="outline" size="sm" onClick={() => setFilter("page", String(pagination.page - 1))}>
                  {t.shop.prevPage}
                </Button>
              )}
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {t.shop.pageOf.replace("{page}", String(pagination.page)).replace("{total}", String(pagination.totalPages))}
              </span>
              {pagination.page < pagination.totalPages && (
                <Button variant="outline" size="sm" onClick={() => setFilter("page", String(pagination.page + 1))}>
                  {t.shop.nextPage}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterSection({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-3 text-sm font-medium hover:text-primary transition-colors">
        {title}
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}

function getTranslatedValue(t: ReturnType<typeof useI18n>["t"], key: string, value: string): string {
  const map: Record<string, string> = {
    color: "colors", material: "materials", designType: "designTypes", style: "styles",
    length: "lengths", sleeveLength: "sleeveLengths", fit: "fitTypes",
    details: "detailValues", fabricElasticity: "fabricElasticities", gender: "genders",
    ageGroup: "ageGroups",
  };
  const i18nKey = map[key];
  if (i18nKey) return (t as unknown as Record<string, Record<string, string>>)[i18nKey]?.[value] ?? value;
  return value;
}
