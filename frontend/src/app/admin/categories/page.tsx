"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async () => {
    if (!session?.user || !newName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      if (res.ok) {
        setNewName("");
        setNewDesc("");
        await fetchCategories();
      }
    } catch {}
    setCreating(false);
  };

  const saveEdit = async (id: string) => {
    if (!session?.user) return;

    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ name: editName, description: editDesc || null }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchCategories();
      }
    } catch {}
  };

  const deleteCategory = async (id: string) => {
    if (!session?.user) return;
    if (!confirm("Apagar esta categoria?")) return;

    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": session.user.id },
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">
        Categorias ({categories.length})
      </h2>

      {/* Create form */}
      <div className="mb-6 rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Nova categoria</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome"
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <Button onClick={createCategory} disabled={creating || !newName.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            Criar
          </Button>
        </div>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma categoria.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border bg-background px-3 py-1"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Descrição"
                    className="flex-1 rounded-md border bg-background px-3 py-1"
                  />
                  <button
                    onClick={() => saveEdit(cat.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                        setEditDesc(cat.description ?? "");
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
