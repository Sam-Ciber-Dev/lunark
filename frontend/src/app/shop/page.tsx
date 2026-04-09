import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import type { Product, Pagination, Category } from "@/types/product";

export const metadata: Metadata = { title: "Shop" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getProducts(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  try {
    const res = await fetch(`${API_URL}/products?${query.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok)
      return {
        data: [] as Product[],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    return res.json() as Promise<{ data: Product[]; pagination: Pagination }>;
  } catch {
    return {
      data: [] as Product[],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const search =
    typeof searchParams.q === "string" ? searchParams.q : undefined;
  const page =
    typeof searchParams.page === "string" ? searchParams.page : "1";

  const [{ data: products, pagination }, categories] = await Promise.all([
    getProducts({ category, search, page }),
    getCategories(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Shop</h1>

      {/* Category filters */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link href="/shop">
          <Button variant={!category ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
            <Button
              variant={category === cat.slug ? "default" : "outline"}
              size="sm"
            >
              {cat.name}
            </Button>
          </Link>
        ))}
      </div>

      {search && (
        <p className="mb-6 text-sm text-muted-foreground">
          Results for &quot;{search}&quot; ({pagination.total})
        </p>
      )}

      {/* Products grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          No products found.
        </p>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {pagination.page > 1 && (
            <Link
              href={`/shop?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(search ? { q: search } : {}),
                page: String(pagination.page - 1),
              }).toString()}`}
            >
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <Link
              href={`/shop?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(search ? { q: search } : {}),
                page: String(pagination.page + 1),
              }).toString()}`}
            >
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
