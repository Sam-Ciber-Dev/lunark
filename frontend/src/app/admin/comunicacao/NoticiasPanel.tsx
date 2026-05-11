"use client";

import { useEffect, useState } from "react";
import { Send, Mail, MessageCircle, Sparkles, Globe2, AlertTriangle, Users, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Channel {
  key: "email" | "whatsapp";
  label: string;
  enabled: boolean;
  description: string;
  icon: React.ElementType;
}

interface SubscriberStats {
  total: number;
  byLocale: { pt: number; en: number };
}

interface BroadcastResult {
  mode: "test" | "live";
  attempted: number;
  delivered: number;
  failed: number;
  skipped: boolean;
}

interface Props {
  userId: string;
  adminEmail?: string;
}

/**
 * Notícias / Broadcast composer. Sends a newsletter to subscribers collected
 * via the footer "Mantém-te Atualizado" widget. Email is delivered via Brevo
 * by the backend (POST /admin/news/broadcast). WhatsApp is intentionally
 * stubbed for now (no free providers).
 */
export default function NoticiasPanel({ userId, adminEmail }: Props) {
  const [mode, setMode] = useState<"test" | "live">("test");
  const [localeFilter, setLocaleFilter] = useState<"all" | "pt" | "en">("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<Channel[]>([
    {
      key: "email",
      label: "Email",
      enabled: true,
      description: "Via Brevo. Funcional.",
      icon: Mail,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      enabled: false,
      description: "Sem provider gratuito disponível — em estudo.",
      icon: MessageCircle,
    },
  ]);
  const [pending, setPending] = useState(false);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/news/subscribers`, {
      headers: { "x-user-id": userId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, [userId]);

  function toggleChannel(key: Channel["key"]) {
    setChannels((c) => c.map((ch) => (ch.key === key ? { ...ch, enabled: !ch.enabled } : ch)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    setError(null);

    const payload: Record<string, unknown> = {
      subject: subject.trim(),
      body: body.trim(),
    };
    if (mode === "test") {
      payload.testEmail = adminEmail ?? "";
      if (!payload.testEmail) {
        setError("Sem email de admin para teste.");
        setPending(false);
        return;
      }
    } else {
      payload.locale = localeFilter;
    }

    try {
      const res = await fetch(`${API_URL}/admin/news/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro desconhecido");
      } else {
        setResult(data as BroadcastResult);
        if (mode === "live") {
          setSubject("");
          setBody("");
        }
      }
    } catch {
      setError("Falha de rede");
    } finally {
      setPending(false);
    }
  }

  const charCount = subject.length;
  const maxSubject = 100;
  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Subscriber stats */}
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow">
            <Users className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscritores ativos
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats?.total ?? "—"}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                PT {stats?.byLocale.pt ?? 0} · EN {stats?.byLocale.en ?? 0}
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* Channel toggles */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Canais de envio
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const disabled = ch.key === "whatsapp";
            return (
              <button
                key={ch.key}
                type="button"
                disabled={disabled}
                onClick={() => toggleChannel(ch.key)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                  ch.enabled
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/30",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    ch.enabled
                      ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{ch.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{ch.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode (test vs live) */}
      <div className="grid grid-cols-2 gap-2">
        <ModeChip
          label="Modo Teste"
          description="Envia só para administradores"
          active={mode === "test"}
          onClick={() => setMode("test")}
          icon={Sparkles}
        />
        <ModeChip
          label="Enviar Novidades"
          description="Envia para todos os subscritores"
          active={mode === "live"}
          onClick={() => setMode("live")}
          icon={Globe2}
        />
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Assunto</span>
            <span className="font-normal tabular-nums">
              {charCount}/{maxSubject}
            </span>
          </label>
          <input
            type="text"
            value={subject}
            maxLength={maxSubject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto do comunicado"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Mensagem
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Escreva a sua mensagem."
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground/80">
            HTML básico suportado:{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;strong&gt;</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;em&gt;</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;br&gt;</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;p&gt;</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;ul&gt;</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;li&gt;</code>
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>
              Apenas o canal <strong>Email</strong> está operacional (Brevo). WhatsApp /
              SMS dependem de um provider gratuito ainda em estudo.
            </p>
          </div>
        </div>

        {/* Live mode → locale filter */}
        {mode === "live" && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Idioma dos destinatários
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["all", "pt", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocaleFilter(l)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    localeFilter === l
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {l === "all" ? "Todos" : l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3 text-xs",
              result.skipped
                ? "border-amber-500/40 bg-amber-500/5 text-amber-200"
                : result.failed === 0
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200"
                  : "border-rose-500/40 bg-rose-500/5 text-rose-200"
            )}
          >
            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>
              {result.skipped
                ? `Modo dev — BREVO_API_KEY não configurada (${result.attempted} destinatários ignorados).`
                : `Enviado para ${result.delivered}/${result.attempted} destinatários${
                    result.failed > 0 ? ` (${result.failed} falhas)` : ""
                  }.`}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-xs text-rose-200">
            <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSend || pending}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200",
            "bg-gradient-to-r from-primary to-rose-500 text-white shadow",
            "hover:shadow-lg active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
          )}
        >
          <Send className="h-4 w-4" />
          <span>
            {pending ? "A enviar…" : mode === "test" ? "Enviar Teste" : "Enviar Novidades"}
          </span>
        </button>
      </form>
    </div>
  );
}

function ModeChip({
  label,
  description,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        active
          ? "border-primary/60 bg-primary/10 shadow-sm"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
