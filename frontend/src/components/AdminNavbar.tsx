"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { AlignJustify, ChevronDown, LogOut, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AdminStatus {
  id: string;
  name: string;
  online: boolean;
}

export function AdminNavbar() {
  const { data: session } = useSession();
  const { locale, setLocale } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminStatus[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
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

  const openStatusPanel = async () => {
    if (!statusOpen && session?.user?.id) {
      try {
        const res = await fetch(`${API_URL}/admin/online`, {
          headers: { "x-user-id": session.user.id },
        });
        if (res.ok) setAdmins(await res.json());
      } catch { /* ignore */ }
    }
    setStatusOpen((o) => !o);
  };

  return (
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

          {/* Online admins panel */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={openStatusPanel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary transition-colors"
              title="Estado dos administradores"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-md border border-border bg-popover shadow-lg z-50 py-1">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    Administradores
                  </p>
                </div>
                {admins.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado</p>
                ) : (
                  admins.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 px-3 py-2">
                      <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", a.online ? "bg-green-500" : "bg-muted-foreground/30")} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground">{a.online ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
