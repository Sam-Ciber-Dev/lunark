"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabbedTab {
  key: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface Props {
  /** Main section label shown centered in the header. */
  label: string;
  /** Icon for the main header (left of label). */
  icon: React.ElementType;
  /** Gradient class for the header icon plate. */
  gradient: string;
  /** Tabs to render as a pill subnav and below as content. */
  tabs: TabbedTab[];
  /** Query-string key used to track the active tab. Default: "tab". */
  paramKey?: string;
  /** When true, content area is rendered without the rounded card wrapper. */
  bare?: boolean;
  /** Optional description shown under the title. */
  description?: string;
}

/**
 * Tabbed admin sub-page. Same centered header pattern as `AdminSubPage`, plus
 * a pill-style sub-navigation (EyeWeb inspired) for switching between related
 * sub-functions of a top-level admin area (e.g. Comunicação → Notícias / Apoio
 * ao Cliente / Chat). The active tab is reflected in the URL via `?tab=...`.
 */
export default function AdminTabbedSubPage({
  label,
  icon: Icon,
  gradient,
  tabs,
  paramKey = "tab",
  bare = false,
  description,
}: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const requested = search.get(paramKey);
  const activeKey = useMemo(() => {
    if (requested && tabs.some((t) => t.key === requested)) return requested;
    return tabs[0]?.key;
  }, [requested, tabs]);

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  const setTab = useCallback(
    (key: string) => {
      const sp = new URLSearchParams(search.toString());
      sp.set(paramKey, key);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, search, paramKey]
  );

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      {/* Header row — Voltar (left) + centered title */}
      <div className="relative mb-5 flex min-h-[3rem] items-center">
        <Link
          href="/admin"
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all",
            "hover:-translate-x-0.5 hover:border-primary/40 hover:bg-card hover:text-foreground"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar</span>
        </Link>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-24">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-md",
                gradient
              )}
            >
              <Icon className="h-5 w-5 text-white drop-shadow" />
            </span>
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{label}</h1>
          </div>
        </div>
      </div>

      {description && (
        <p className="mb-5 text-center text-xs text-muted-foreground">{description}</p>
      )}

      {/* Pill sub-nav */}
      <div className="mb-6 flex justify-center">
        <div
          role="tablist"
          aria-label={label}
          className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 p-1.5 backdrop-blur"
        >
          {tabs.map((tab) => {
            const isActive = tab.key === active?.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.key)}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ease-out",
                  isActive
                    ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow-md"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                <TabIcon
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active content */}
      {bare ? (
        active?.content
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">{active?.content}</div>
      )}
    </div>
  );
}
