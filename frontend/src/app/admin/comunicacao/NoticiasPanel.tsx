"use client";

import { useState } from "react";
import {
  Send,
  Mail,
  MessageCircle,
  Sparkles,
  Globe2,
  Check,
  X,
  Paperclip,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB per file (Brevo soft limit ~10 MB total)

interface BroadcastResult {
  mode: "test" | "live";
  attempted: number;
  delivered: number;
  failed: number;
  skipped: boolean;
}

interface Attachment {
  name: string;
  size: number;
  /** base64 (no data: prefix) */
  content: string;
}

interface Props {
  userId: string;
  adminEmail?: string;
}

/**
 * Notícias / Broadcast composer. Sends a newsletter to subscribers collected
 * via the footer "Mantém-te Atualizado" widget. Email is delivered via Brevo
 * by the backend (POST /admin/news/broadcast).
 */
export default function NoticiasPanel({ userId, adminEmail }: Props) {
  const [mode, setMode] = useState<"test" | "live">("test");
  const [localeFilter, setLocaleFilter] = useState<"all" | "pt" | "en">("all");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking same file

    const next: Attachment[] = [];
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`Ficheiro "${file.name}" excede 5 MB.`);
        continue;
      }
      const content = await fileToBase64(file);
      next.push({ name: file.name, size: file.size, content });
    }
    setAttachments((a) => [...a, ...next].slice(0, 10));
  }

  function removeAttachment(idx: number) {
    setAttachments((a) => a.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    setError(null);

    if (channel !== "email") {
      setError("Canal WhatsApp ainda não está disponível.");
      setPending(false);
      return;
    }

    const payload: Record<string, unknown> = {
      subject: subject.trim(),
      body: body.trim(),
    };
    if (attachments.length > 0) {
      payload.attachments = attachments.map((a) => ({ name: a.name, content: a.content }));
    }
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
          setAttachments([]);
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
    <div className="space-y-8">
      {/* ─── Form: Composer ─── */}
      <form onSubmit={submit} className="space-y-5">
        {/* ─── Canais de envio ─── */}
        <Section icon={Radio} title="Canais de envio" description="Selecione o canal através do qual a comunicação será entregue.">
          <div className="grid gap-2 sm:grid-cols-2">
            <ChannelCard
              icon={Mail}
              label="Email"
              status="Operacional via Brevo"
              statusTone="success"
              active={channel === "email"}
              onClick={() => setChannel("email")}
            />
            <ChannelCard
              icon={MessageCircle}
              label="WhatsApp"
              status="Em desenvolvimento"
              statusTone="muted"
              active={channel === "whatsapp"}
              disabled
              onClick={() => setChannel("whatsapp")}
            />
          </div>
        </Section>

        {/* ─── Tipo de Modo ─── */}
        <Section icon={SlidersHorizontal} title="Tipo de Modo" description="Escolha entre um envio de validação ou difundir para todos os subscritores.">
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeCard
              icon={Sparkles}
              label="Modo Teste"
              description="Envia apenas para o seu email de administrador."
              active={mode === "test"}
              onClick={() => setMode("test")}
            />
            <ModeCard
              icon={Globe2}
              label="Enviar Novidades"
              description="Difunde para todos os subscritores ativos."
              active={mode === "live"}
              onClick={() => setMode("live")}
            />
          </div>
        </Section>

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

        {/* Attachments */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Anexos</span>
            <span className="font-normal text-muted-foreground/80">
              {attachments.length}/10 · máx. 5 MB cada
            </span>
          </label>
          <label
            className={cn(
              "group flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 px-4 py-3 text-xs text-muted-foreground transition-all",
              "hover:border-primary/40 hover:bg-card/80 hover:text-foreground"
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Clique para escolher ficheiros (PDF, imagens, etc.)</span>
            <input type="file" multiple onChange={onPickFiles} className="hidden" />
          </label>
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {attachments.map((a, i) => (
                <li
                  key={`${a.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{a.name}</span>
                    <span className="flex-shrink-0 text-[10px] text-muted-foreground/80">
                      {formatBytes(a.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Remover anexo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
      <header className="mb-3 flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-rose-500/80 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function ChannelCard({
  icon: Icon,
  label,
  status,
  statusTone,
  active,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  statusTone: "success" | "muted";
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        active
          ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/30",
        disabled && "cursor-not-allowed opacity-60 hover:border-border"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          {active && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1.5 text-[11px]",
            statusTone === "success" ? "text-emerald-400/90" : "text-muted-foreground/80"
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              statusTone === "success" ? "bg-emerald-400" : "bg-muted-foreground/50"
            )}
          />
          {status}
        </p>
      </div>
    </button>
  );
}

function ModeCard({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        active
          ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          {active && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:<mime>;base64," prefix.
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
