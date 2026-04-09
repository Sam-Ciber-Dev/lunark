"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { Product, Category } from "@/types/product";
import { PRODUCT_SIZES } from "@lunark/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface VariantInput {
  size: string;
  stock: number;
}

interface ImageInput {
  url: string;
  alt: string;
}

export default function EditProductPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [images, setImages] = useState<ImageInput[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    Promise.all([
      fetch(`${API_URL}/admin/products`, {
        headers: { "x-user-id": session.user.id },
      }).then((r) => r.json()),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
    ])
      .then(([productsData, catsData]) => {
        setCategories(catsData.data ?? []);
        const product: Product | undefined = (productsData.data ?? []).find(
          (p: Product) => p.id === productId
        );
        if (product) {
          setName(product.name);
          setDescription(product.description ?? "");
          setPrice(String(product.price));
          setCompareAtPrice(
            product.compareAtPrice ? String(product.compareAtPrice) : ""
          );
          setCategoryId(product.categoryId ?? "");
          setActive(product.active);
          setFeatured(product.featured);
          setVariants(
            (product.variants ?? []).map((v) => ({
              size: v.size,
              stock: v.stock,
            }))
          );
          setImages(
            product.images.map((img) => ({
              url: img.url,
              alt: img.alt ?? "",
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session, productId]);

  const addVariant = () => {
    const usedSizes = new Set(variants.map((v) => v.size));
    const nextSize = PRODUCT_SIZES.find((s) => !usedSizes.has(s)) ?? "M";
    setVariants([...variants, { size: nextSize, stock: 10 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addImage = () => {
    setImages([...images, { url: "", alt: "" }]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({
          name,
          description: description || null,
          price: parseFloat(price),
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          categoryId: categoryId || null,
          active,
          featured,
          variants,
          images: images.filter((img) => img.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao atualizar produto");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Editar produto</h2>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border bg-background px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border bg-background px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Preço (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-md border bg-background px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Preço anterior (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="w-full rounded-md border bg-background px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border bg-background px-4 py-2"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Destaque
          </label>
        </div>

        {/* Variants */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Variantes (tamanhos)</label>
            <button
              type="button"
              onClick={addVariant}
              className="text-sm text-primary hover:underline"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={v.size}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i].size = e.target.value;
                    setVariants(updated);
                  }}
                  className="rounded-md border bg-background px-3 py-2"
                >
                  {PRODUCT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i].stock = parseInt(e.target.value) || 0;
                    setVariants(updated);
                  }}
                  placeholder="Stock"
                  className="w-24 rounded-md border bg-background px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Imagens (URL)</label>
            <button
              type="button"
              onClick={addImage}
              className="text-sm text-primary hover:underline"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={img.url}
                  onChange={(e) => {
                    const updated = [...images];
                    updated[i].url = e.target.value;
                    setImages(updated);
                  }}
                  placeholder="https://..."
                  className="flex-1 rounded-md border bg-background px-3 py-2"
                />
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => {
                    const updated = [...images];
                    updated[i].alt = e.target.value;
                    setImages(updated);
                  }}
                  placeholder="Alt text"
                  className="w-32 rounded-md border bg-background px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "A guardar…" : "Guardar alterações"}
        </Button>
      </form>
    </div>
  );
}
