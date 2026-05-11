"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Inbox, Send, Mail, Filter, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Ticket {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  unread: boolean;
  createdAt: string;
  updatedAt: string;
  status: "open" | "answered" | "closed";
}

interface TicketMessage {
  id: string;
  ticketId: string;
  authorRole: "customer" | "admin";
  authorName: string;
  body: string;
  createdAt: string;
}

interface Props {
  userId: string;
}

/**
 * Apoio ao Cliente — Discord-style inbox of support tickets.
 * Reads from `/admin/support/tickets`, opens a thread on click,
 * and POSTs admin replies that also email the customer via Brevo.
 */
export default function SupportPanel({ userId }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "answered">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const url = new URL(`${API_URL}/admin/support/tickets`);
      if (filter !== "all") url.searchParams.set("status", filter);
      const res = await fetch(url.toString(), { headers: { "x-user-id": userId } });
      if (!res.ok) return;
      const data = (await res.json()) as { data: Ticket[] };
      setTickets(data.data);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const filtered = tickets.filter((t) => {
    if (
      search &&
      !`${t.senderName} ${t.senderEmail} ${t.subject} ${t.preview}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const active = filtered.find((t) => t.id === activeId) ?? null;

  function markRead(id: string) {
    setTickets((list) => list.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }

  return (
    <div className="grid h-[calc(100vh-18rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-[280px_1fr]">
      {/* Sidebar */}
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
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
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
                    onClick={() => {
                      setActiveId(t.id);
                      if (t.unread) markRead(t.id);
                    }}
                    className={cn(
                      "group block w-full border-b border-border/60 px-3 py-2.5 text-left transition-colors",
                      active?.id === t.id ? "bg-primary/5" : "hover:bg-foreground/[0.04]"
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-xs",
                          t.unread ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {t.senderName}
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

      {/* Detail */}
      <section className="flex flex-col bg-background">
        {active ? (
          <TicketDetail
            ticket={active}
            userId={userId}
            onReplied={async () => {
              await refresh();
            }}
            onStatusChange={async () => {
              await refresh();
            }}
          />
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
        Mensagens enviadas pelo formulário <code>/contact</code> aparecem aqui. Responde
        diretamente — a resposta é enviada por email ao remetente.
      </p>
    </div>
  );
}

function TicketDetail({
  ticket,
  userId,
  onReplied,
  onStatusChange,
}: {
  ticket: Ticket;
  userId: string;
  onReplied: () => void;
  onStatusChange: () => void;
}) {
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    setLoadingMessages(true);
    fetch(`${API_URL}/admin/support/tickets/${ticket.id}`, {
      headers: { "x-user-id": userId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { messages: TicketMessage[] } | null) => {
        if (data?.messages) setMessages(data.messages);
      })
      .finally(() => setLoadingMessages(false));
  }, [ticket.id, userId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/support/tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Falha ao enviar");
        return;
      }
      const text = reply.trim();
      setReply("");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          authorRole: "admin",
          authorName: "Eu",
          body: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      onReplied();
    } catch {
      setError("Falha de rede");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(status: "open" | "closed") {
    await fetch(`${API_URL}/admin/support/tickets/${ticket.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ status }),
    });
    onStatusChange();
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{ticket.subject}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {ticket.senderName} &lt;{ticket.senderEmail}&gt; ·{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {ticket.status !== "closed" ? (
            <button
              onClick={() => changeStatus("closed")}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-rose-500/50 hover:text-rose-300"
            >
              <XCircle className="h-3 w-3" />
              <span>Fechar</span>
            </button>
          ) : (
            <button
              onClick={() => changeStatus("open")}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Reabrir</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border p-3",
                m.authorRole === "admin"
                  ? "ml-8 border-primary/30 bg-primary/5"
                  : "mr-8 border-border bg-card/60"
              )}
            >
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold">
                  {m.authorRole === "admin" ? `${m.authorName} (admin)` : m.authorName}
                </span>
                <span className="text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="border-t border-border bg-card/40 px-3 py-2">
        {error && (
          <p className="mb-1.5 px-1 text-[11px] text-rose-300">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Responder a ${ticket.senderName}…`}
            className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={!reply.trim() || pending}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-white transition-all",
              "bg-gradient-to-br from-primary to-rose-500 shadow",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </>
  );
}
