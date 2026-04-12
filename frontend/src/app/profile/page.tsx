"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { User, Trash2, Package, MessageSquare, LogOut, Pencil, Check, X } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "messages">("profile");
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: string; status: string; total: number; createdAt: string }>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user) {
      setName(session.user.name ?? "");
      setImage(session.user.image ?? null);
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`${API_URL}/profile/${session.user.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.createdAt) setCreatedAt(data.createdAt); })
      .catch(() => {});
  }, [session?.user?.id]);

  const loadOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { "x-user-id": session.user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data ?? data ?? []);
      }
    } catch { /* ignore */ }
    setLoadingOrders(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
  }, [activeTab, loadOrders]);

  const saveProfile = async (updates: { name?: string; image?: string | null }) => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile/${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setSaved(true);
        await updateSession({ name: updated.name, image: updated.image });
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleNameSave = () => {
    if (name.trim().length < 2) return;
    setEditingName(false);
    saveProfile({ name: name.trim() });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File too large. Max 2MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG or WEBP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      saveProfile({ image: dataUrl });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setImage(null);
    saveProfile({ image: null });
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tabs = [
    { key: "profile" as const, label: t.profile.tabs.profile, icon: User },
    { key: "orders" as const, label: t.profile.tabs.orders, icon: Package },
    { key: "messages" as const, label: t.profile.tabs.messages, icon: MessageSquare },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-center mb-8">{t.profile.title}</h1>

      {/* Tab nav */}
      <div className="flex border-b border-border mb-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 rounded-md bg-green-500/10 px-4 py-2 text-sm text-green-400 flex items-center gap-2">
          <Check className="h-4 w-4" /> {t.profile.saved}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {image ? (
                <img src={image} alt="" className="h-24 w-24 rounded-full object-cover border-2 border-primary/50" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center border-2 border-primary/50">
                  <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
                </div>
              )}
              {/* Edit button - top left */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -top-1 -left-1 h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {/* Delete button - top right */}
              {image && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-red-500 border border-red-400 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t.profile.info}</h2>

            {/* Name */}
            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">{t.profile.name}</label>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-b border-border text-sm text-foreground outline-none focus:border-primary flex-1"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); if (e.key === "Escape") setEditingName(false); }}
                    />
                    <button onClick={handleNameSave} className="text-green-400 hover:text-green-300"><Check className="h-4 w-4" /></button>
                    <button onClick={() => { setEditingName(false); setName(session.user.name ?? ""); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <p className="text-sm mt-1">{session.user.name}</p>
                )}
              </div>
              {!editingName && (
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="rounded-md border border-border bg-card px-4 py-3">
              <label className="text-xs text-muted-foreground">{t.profile.email}</label>
              <p className="text-sm mt-1">{session.user.email}</p>
            </div>

            {/* Member since */}
            <div className="rounded-md border border-border bg-card px-4 py-3">
              <label className="text-xs text-muted-foreground">{t.profile.memberSince}</label>
              <p className="text-sm mt-1">
                {createdAt
                  ? new Date(createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" /> {t.nav.signOut}
          </button>
        </div>
      )}

      {/* Orders tab */}
      {activeTab === "orders" && (
        <div>
          {loadingOrders ? (
            <p className="text-center text-muted-foreground py-8">{t.common.loading}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t.profile.noOrders}</p>
              <Link href="/shop" className="mt-4 inline-block text-sm text-primary hover:underline">
                {t.nav.shop}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">€{order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t.profile.noMessages}</p>
          <Link href="/contact" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t.nav.contact}
          </Link>
        </div>
      )}
    </section>
  );
}
