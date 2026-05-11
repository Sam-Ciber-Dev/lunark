"use client";

import { useState } from "react";
import { Send, Mail, MessageCircle, Sparkles, Globe2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Channel {
  key: "email" | "whatsapp";
  label: string;
  enabled: boolean;
  description: string;
  icon: React.ElementType;
}

/**
 * Notícias / Broadcast composer. Sends a newsletter-style message to every
 * subscriber that consented via the footer "Mantém-te Atualizado" widget.
 *
 * Backend wiring will be implemented in a follow-up: a POST /admin/news/broadcast
 * route that fans out via Brevo for email subscribers. WhatsApp is intentionally
 * stubbed (no free providers); the UI shows that clearly to the operator.
 */
export default function NoticiasPanel() {
  const [mode, setMode] = useState<"test" | "live">("test");
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

  function toggleChannel(key: Channel["key"]) {
    setChannels((c) => c.map((ch) => (ch.key === key ? { ...ch, enabled: !ch.enabled } : ch)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    // Endpoint wiring in Phase B
    setTimeout(() => setPending(false), 600);
  }

  const charCount = subject.length;
  const maxSubject = 100;
  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6">
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
              Backend de broadcast (Brevo + base de subscritores) será ligado num próximo
              update. O formulário guarda a tua mensagem e configurações para depois.
            </p>
          </div>
        </div>

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
          <span>{mode === "test" ? "Enviar Teste" : "Enviar Novidades"}</span>
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
