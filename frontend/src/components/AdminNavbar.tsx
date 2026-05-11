"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, LogOut, User, Users, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AdminStatus {
  id: string;
  name: string;
  online: boolean;
  image?: string | null;
}

export function AdminNavbar() {
  const { data: session } = useSession();
  const { locale, setLocale } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminStatus[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click (panel is handled separately)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Heartbeat ping every 30s
  useEffect(() => {
    if (!session?.user?.id) return;
    const ping = () =>
      fetch(`${API_URL}/admin/ping`, {
        method: "POST",
        headers: { "x-user-id": session.user.id },
      }).catch(() => {});
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  const fetchAdmins = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingAdmins(true);
    // Always inject current user first so the panel is never empty
    const me = session.user;
    const meEntry: AdminStatus = {
      id: me.id,
      name: me.name ?? "Eu",
      online: true,
      image: (me as { image?: string | null }).image ?? null,
    };
    try {
      const res = await fetch(`${API_URL}/admin/online`, {
        headers: { "x-user-id": me.id },
      });
      if (res.ok) {
        const data: AdminStatus[] = await res.json();
        const others = data.filter((a) => a.id !== me.id);
        setAdmins([meEntry, ...others]);
      } else {
        setAdmins([meEntry]);
      }
    } catch {
      setAdmins([meEntry]);
    } finally {
      setLoadingAdmins(false);
    }
  }, [session?.user]);

  // Refresh while panel is open
  useEffect(() => {
    if (!panelOpen) return;
    fetchAdmins();
    const id = setInterval(fetchAdmins, 15_000);
    return () => clearInterval(id);
  }, [panelOpen, fetchAdmins]);

  // Close panel with Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 lg:px-8">

          {/* Logo */}
          <Link href="/" className="text-base font-bold tracking-[0.2em] uppercase text-primary">
            Lunark
          </Link>

          <div className="flex items-center gap-1">

            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setLangOpen((o) => !o)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={locale === "en" ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/pt.png"}
                  alt={locale}
                  className="h-4 w-5 object-cover rounded-[2px]"
                />
                <span className="hidden sm:inline text-xs font-medium uppercase">{locale === "en" ? "EN" : "PT"}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-md border border-border bg-popover shadow-lg z-50 py-1">
                  {(["en", "pt"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLocale(l); setLangOpen(false); }}
                      className={cn(
                        "group flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:text-primary",
                        locale === l ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l === "en" ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/pt.png"}
                        alt={l}
                        className={cn("h-3.5 w-4 object-cover rounded-[2px] ring-1 transition-all", locale === l ? "ring-primary" : "ring-transparent group-hover:ring-primary/60")}
                      />
                      <span className="uppercase">{l === "en" ? (locale === "en" ? "English" : "Inglês") : (locale === "en" ? "Portuguese" : "Português")}</span>
                      {locale === l && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="hidden sm:inline text-xs font-medium max-w-[120px] truncate">
                  {session?.user?.name}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover shadow-lg z-50 py-1">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-xs font-medium truncate">{session?.user?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:opacity-80 transition-opacity"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Members panel trigger */}
            <button
              onClick={() => setPanelOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary transition-colors"
              title={locale === "pt" ? "Membros" : "Members"}
              aria-label={locale === "pt" ? "Abrir painel de membros" : "Open members panel"}
            >
              <Users className="h-4 w-4" />
            </button>

          </div>
        </div>
      </header>

      {/* ─── Discord-style side panel ─── */}
      <MembersPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        admins={admins}
        loading={loadingAdmins}
        locale={locale}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Side panel                                                      */
/* ─────────────────────────────────────────────────────────────── */
function MembersPanel({
  open,
  onClose,
  admins,
  loading,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  admins: AdminStatus[];
  loading: boolean;
  locale: "pt" | "en";
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={locale === "pt" ? "Membros" : "Members"}
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex w-[88vw] max-w-sm flex-col border-l border-border bg-card shadow-2xl",
          "transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">
              {locale === "pt" ? "Membros" : "Members"}
            </h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {admins.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={locale === "pt" ? "Fechar" : "Close"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && admins.length === 0 ? (
            <ul className="space-y-2 px-3 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg p-2">
                  <span className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <span className="block h-2 w-1/3 animate-pulse rounded bg-muted/70" />
                  </span>
                </li>
              ))}
            </ul>
          ) : admins.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              {locale === "pt" ? "Sem administradores." : "No administrators."}
            </p>
          ) : (
            <>
              {/* Online section */}
              <MemberSection
                title={locale === "pt" ? "Online" : "Online"}
                count={admins.filter((a) => a.online).length}
                members={admins.filter((a) => a.online)}
                locale={locale}
              />
              {/* Offline section */}
              <MemberSection
                title={locale === "pt" ? "Offline" : "Offline"}
                count={admins.filter((a) => !a.online).length}
                members={admins.filter((a) => !a.online)}
                locale={locale}
                muted
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function MemberSection({
  title,
  count,
  members,
  locale,
  muted,
}: {
  title: string;
  count: number;
  members: AdminStatus[];
  locale: "pt" | "en";
  muted?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} — {count}
      </p>
      <ul>
        {members.map((m) => (
          <li
            key={m.id}
            className="group flex items-center gap-3 px-3 py-1.5 transition-colors hover:bg-accent/60"
          >
            <div className="relative flex-shrink-0">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt=""
                  className={cn(
                    "h-9 w-9 rounded-full object-cover ring-2",
                    m.online ? "ring-emerald-500/60" : "ring-transparent",
                    muted && "opacity-60"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground ring-2",
                    m.online ? "ring-emerald-500/60" : "ring-transparent",
                    muted && "opacity-60"
                  )}
                >
                  {m.name?.slice(0, 1) ?? "?"}
                </div>
              )}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                  m.online ? "bg-emerald-500" : "bg-zinc-500"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", muted && "text-muted-foreground")}>
                {m.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {locale === "pt" ? "Administrador" : "Administrator"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                m.online
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-zinc-500/15 text-zinc-400"
              )}
            >
              {m.online ? (locale === "pt" ? "Online" : "Online") : "Offline"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
