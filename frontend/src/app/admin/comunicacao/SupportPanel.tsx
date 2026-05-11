"use client";

import { useState } from "react";
import { Search, Inbox, Paperclip, Send, Mail, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  email: string;
  name: string;
  subject: string;
  preview: string;
  unread: boolean;
  receivedAt: string;
  status: "open" | "answered" | "closed";
}

const MOCK_TICKETS: Ticket[] = [];

/**
 * Apoio ao Cliente — Discord-style inbox of support emails.
 *
 * Left column: list of tickets (one per sender / thread). Right column: open
 * ticket view with full message, attachments, and reply composer.
 *
 * Backend wiring will be added in Phase B: a new `support_tickets` table fed
 * either by the existing contact form on the website or by an IMAP poller.
 */
export default function SupportPanel() {
  const [tickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "answered">("all");
  const [search, setSearch] = useState("");

  const filtered = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (
      search &&
      !`${t.name} ${t.email} ${t.subject} ${t.preview}`.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const active = filtered.find((t) => t.id === activeId) ?? null;

  return (
    <div className="grid h-[calc(100vh-18rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-[280px_1fr]">
      {/* Sidebar: ticket list */}
      <aside className="flex flex-col border-r border-border bg-card/40">
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary/60"
            />
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {(["all", "open", "answered"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium uppercase tracking-wider transition-colors",
                  filter === k
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {k === "all" ? "Todos" : k === "open" ? "Abertos" : "Respondidos"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
              <Inbox className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs font-medium">Sem mensagens</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Os pedidos de suporte aparecem aqui.
              </p>
            </div>
          ) : (
            <ul>
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveId(t.id)}
                    className={cn(
                      "group block w-full border-b border-border/60 px-3 py-2.5 text-left transition-colors",
                      active?.id === t.id
                        ? "bg-primary/5"
                        : "hover:bg-foreground/[0.04]"
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-xs",
                          t.unread ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {t.name}
                      </span>
                      {t.unread && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "truncate text-xs",
                        t.unread ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {t.subject}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                      {t.preview}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Detail / composer */}
      <section className="flex flex-col bg-background">
        {active ? (
          <TicketDetail ticket={active} />
        ) : (
          <EmptyDetail />
        )}
      </section>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <Mail className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium">Caixa de Apoio ao Cliente</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Quando alguém enviar um email para o nosso endereço de suporte (ou usar o formulário de
        contacto), a conversa aparece aqui — estilo Discord, com anexos e resposta inline.
      </p>
      <div className="mt-4 rounded-lg border border-border bg-card/60 px-4 py-3 text-left text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">Próximos passos (Fase B):</p>
        <ul className="mt-2 space-y-1 [&>li]:flex [&>li]:items-start [&>li]:gap-1.5">
          <li>
            <span className="text-primary">•</span> Tabela <code>support_tickets</code> + envio via
            Brevo
          </li>
          <li>
            <span className="text-primary">•</span> Formulário <code>/contact</code> a criar tickets
            automaticamente
          </li>
          <li>
            <span className="text-primary">•</span> Anexos (descarga + preview)
          </li>
          <li>
            <span className="text-primary">•</span> Resposta inline com tracking de threads
          </li>
        </ul>
      </div>
    </div>
  );
}

function TicketDetail({ ticket }: { ticket: Ticket }) {
  const [reply, setReply] = useState("");
  return (
    <>
      <div className="border-b border-border bg-card/40 px-5 py-3">
        <h2 className="text-sm font-semibold">{ticket.subject}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {ticket.name} &lt;{ticket.email}&gt; · {new Date(ticket.receivedAt).toLocaleString()}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <article className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.preview}</article>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setReply("");
        }}
        className="border-t border-border bg-card/40 px-3 py-2"
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
            title="Anexar"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            rows={1}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Responder a ${ticket.name}…`}
            className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={!reply.trim()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-white transition-all",
              "bg-gradient-to-br from-primary to-rose-500 shadow",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
}
