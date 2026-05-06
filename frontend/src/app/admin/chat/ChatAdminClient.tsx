"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const STORAGE_KEY = "lunark_admin_chat_history_v1";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export default function ChatAdminClient({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text, ts: Date.now() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/admin/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { message: { role: "assistant"; content: string } };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message.content, ts: Date.now() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="flex h-[calc(100vh-22rem)] min-h-[480px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Powered by Groq · llama-3.3-70b</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Limpar histórico
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-background/40 p-4"
      >
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium">Olá, admin.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pergunta-me qualquer coisa sobre a tua loja.
            </p>
          </div>
        )}

        {messages.map((m, idx) => (
          <Message key={idx} message={m} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
            </span>
            A pensar…
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          disabled={loading}
          placeholder="Escreve uma mensagem… (Enter para enviar, Shift+Enter para nova linha)"
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all",
            "bg-gradient-to-br from-indigo-500 to-violet-600 text-white",
            "hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
          )}
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-violet-400"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary/15 text-foreground"
            : "rounded-tl-sm border border-border bg-card text-foreground"
        )}
      >
        <pre className="whitespace-pre-wrap break-words font-sans">{message.content}</pre>
      </div>
    </div>
  );
}
