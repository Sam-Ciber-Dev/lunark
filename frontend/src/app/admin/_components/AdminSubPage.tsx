import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSubPageProps {
  label: string;
  icon: React.ElementType;
  gradient: string;
  children: React.ReactNode;
  /** Optional descriptive text below the title. */
  description?: string;
}

/**
 * Wrapper for admin sub-pages. Replaces the previous AdminShell wrapper on
 * sub-pages so the tabs grid is *not* shown there — only on /admin itself.
 * Provides a back button, the section header (icon + label), and a content card.
 */
export default function AdminSubPage({
  label,
  icon: Icon,
  gradient,
  children,
  description,
}: AdminSubPageProps) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      {/* Header row — Voltar (left) + centered title */}
      <div className="relative mb-7 flex min-h-[3rem] items-center">
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
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {label}
            </h1>
          </div>
        </div>
      </div>

      {description && (
        <p className="-mt-3 mb-6 text-center text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {/* Content card */}
      <div className="rounded-2xl border border-border bg-card p-6">{children}</div>
    </div>
  );
}
