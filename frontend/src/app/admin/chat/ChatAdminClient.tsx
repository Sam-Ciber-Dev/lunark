"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  FileText,
  Menu,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const POLL_INTERVAL_MS = 3000;
const MEMBERS_POLL_MS = 15000;
const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const AI_MENTION_RE = /@(?:luny|eye)\b/i;

interface Attachment {
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

interface ChatMessage {
  id: string;
  authorId: string | null;
  authorRole: "admin" | "ai";
  authorName: string;
  authorImage: string | null;
  content: string;
  attachments: Attachment[];
  replyTo: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  image: string | null;
  email?: string;
  online?: boolean;
  isAi?: boolean;
}

const LUNY_MEMBER: Member = {
  id: "__luny__",
  name: "Luny",
  image: null,
  email: "ai@lunark",
  online: true,
  isAi: true,
};

interface Props {
  userId: string;
  userName: string;
}

export default function ChatAdminClient({ userId, userName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [mentionPopover, setMentionPopover] = useState<{
    member: Member;
    anchor: { x: number; y: number };
  } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastTsRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);

  /* ─── Load members (admins + Luny) ─── */
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/online`, { headers: { "x-user-id": userId } });
      if (!res.ok) return;
      const data = (await res.json()) as Array<{
        id: string;
        name: string;
        image?: string | null;
        online: boolean;
        role?: string;
      }>;
      const list: Member[] = data.map((a) => ({
        id: a.id,
        name: a.name,
        image: a.image ?? null,
        online: a.online,
        isAi: a.id === "__luny__" || a.role === "ai",
      }));
      if (!list.some((m) => m.isAi)) list.push(LUNY_MEMBER);
      setMembers(list);
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    fetchMembers();
    const id = setInterval(fetchMembers, MEMBERS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchMembers]);

  /* ─── Polling messages ─── */
  const fetchMessages = useCallback(
    async (incremental: boolean) => {
      const qs = incremental && lastTsRef.current ? `?since=${encodeURIComponent(lastTsRef.current)}` : "";
      try {
        const res = await fetch(`${API_URL}/admin/chat/messages${qs}`, {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { data: ChatMessage[] };
        if (!data.data) return;

        if (data.data.length > 0) {
          lastTsRef.current = data.data[data.data.length - 1].createdAt;
        }

        setMessages((prev) => {
          if (!incremental) return data.data;
          if (data.data.length === 0) return prev;
          const ids = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of data.data) if (!ids.has(m.id)) merged.push(m);
          return merged;
        });
      } catch {
        /* silent */
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchMessages(false);
    const id = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchMessages]);

  /* ─── Auto-scroll on new messages ─── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, aiThinking]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  /* ─── Send message ─── */
  async function send() {
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || sending) return;
    const willTriggerAi = AI_MENTION_RE.test(text);
    setSending(true);
    setError(null);
    if (willTriggerAi) setAiThinking(true);
    try {
      const res = await fetch(`${API_URL}/admin/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ content: text, attachments: pendingAttachments }),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let parsed: { error?: string } | null = null;
        try {
          parsed = raw ? (JSON.parse(raw) as { error?: string }) : null;
        } catch {
          /* not JSON */
        }
        const detail = parsed?.error ?? (raw ? raw.slice(0, 200) : `HTTP ${res.status}`);
        throw new Error(detail);
      }
      const data = (await res.json()) as { data: ChatMessage[] };
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        for (const m of data.data) if (!ids.has(m.id)) merged.push(m);
        return merged;
      });
      if (data.data.length > 0) lastTsRef.current = data.data[data.data.length - 1].createdAt;
      setInput("");
      setPendingAttachments([]);
      setMentionQuery(null);
      stickToBottomRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
      setAiThinking(false);
    }
  }

  /* ─── Clear history ─── */
  async function clearHistory() {
    try {
      const res = await fetch(`${API_URL}/admin/chat/messages`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`);
      }
      setMessages([]);
      lastTsRef.current = null;
      setConfirmClear(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível limpar.");
      setConfirmClear(false);
    }
  }

  /* ─── File handling ─── */
  async function onPickFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const next: Attachment[] = [...pendingAttachments];
    for (const f of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) {
        setError(`Máximo ${MAX_ATTACHMENTS} ficheiros por mensagem.`);
        break;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`"${f.name}" excede 5 MB.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataURL(f);
        next.push({
          name: f.name,
          mime: f.type || "application/octet-stream",
          size: f.size,
          dataUrl,
        });
      } catch {
        setError(`Falha a ler "${f.name}".`);
      }
    }
    setPendingAttachments(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ─── Edit / Delete ─── */
  async function saveEdit(id: string) {
    const content = editingDraft.trim();
    if (!content) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/chat/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { data: ChatMessage };
      setMessages((prev) => prev.map((m) => (m.id === id ? data.data : m)));
      setEditingId(null);
    } catch {
      setError("Não foi possível editar.");
    }
  }

  async function unsend(id: string) {
    try {
      const res = await fetch(`${API_URL}/admin/chat/messages/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, content: "", attachments: [], deletedAt: new Date().toISOString() }
            : m
        )
      );
    } catch {
      setError("Não foi possível anular envio.");
    }
  }

  /* ─── Mention lookup ─── */
  const membersByName = useMemo(() => {
    const map = new Map<string, Member>();
    map.set("luny", LUNY_MEMBER);
    map.set("eye", LUNY_MEMBER);
    for (const m of members) {
      if (m.isAi) {
        map.set("luny", m);
        map.set("eye", m);
      }
      const key = normalizeMention(m.name);
      if (key) map.set(key, m);
    }
    return map;
  }, [members]);

  /* ─── Mention autocomplete extraction ─── */
  function updateMentionQuery(value: string, caret: number) {
    let i = caret - 1;
    while (i >= 0) {
      const ch = value[i];
      if (ch === "@") {
        if (i === 0 || /\s/.test(value[i - 1])) {
          setMentionQuery(value.slice(i + 1, caret));
          setMentionIndex(0);
          return;
        }
        break;
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    setMentionQuery(null);
  }

  const mentionMatches = useMemo<Member[]>(() => {
    if (mentionQuery === null) return [];
    const q = normalizeMention(mentionQuery);
    const all: Member[] = [...members];
    if (!all.some((m) => m.isAi)) all.unshift(LUNY_MEMBER);
    all.sort((a, b) => {
      if (a.isAi && !b.isAi) return -1;
      if (!a.isAi && b.isAi) return 1;
      if (!!b.online !== !!a.online) return b.online ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    if (!q) return all.slice(0, 8);
    return all.filter((m) => normalizeMention(m.name).includes(q)).slice(0, 8);
  }, [members, mentionQuery]);

  function applyMention(member: Member) {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? input.length;
    let start = caret - 1;
    while (start >= 0 && input[start] !== "@") start--;
    if (start < 0) return;
    const mentionToken = `@${member.isAi ? "luny" : normalizeMention(member.name) || member.name}`;
    const before = input.slice(0, start);
    const after = input.slice(caret);
    const newValue = `${before}${mentionToken} ${after}`;
    setInput(newValue);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = (before + mentionToken + " ").length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  /* ─── Render ─── */
  const grouped = groupMessages(messages);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-background"
      onClick={() => setMenuFor(null)}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-rose-500 shadow">
              <MessageSquare className="h-4 w-4 text-white" />
            </span>
            <h1 className="text-base font-semibold tracking-tight">Chat Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={messages.length === 0}
            title="Limpar histórico"
            aria-label="Limpar histórico"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMembersPanelOpen((o) => !o)}
            title="Membros"
            aria-label="Membros"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────── */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {grouped.map((g) => (
              <MessageGroup
                key={g.id}
                group={g}
                currentUserId={userId}
                membersByName={membersByName}
                onMention={(member, e) =>
                  setMentionPopover({ member, anchor: { x: e.clientX, y: e.clientY } })
                }
                editingId={editingId}
                editingDraft={editingDraft}
                setEditingDraft={setEditingDraft}
                onStartEdit={(m) => {
                  setEditingId(m.id);
                  setEditingDraft(m.content);
                  setMenuFor(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={saveEdit}
                onCopy={(m) => {
                  navigator.clipboard.writeText(m.content).catch(() => {});
                  setMenuFor(null);
                }}
                onUnsend={(m) => {
                  unsend(m.id);
                  setMenuFor(null);
                }}
                menuFor={menuFor}
                setMenuFor={setMenuFor}
              />
            ))}
            {aiThinking && <TypingIndicator />}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-4 max-w-4xl rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* ── Composer ────────────────────────────────────────── */}
      <div className="relative border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-8">
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <MentionDropdown
            matches={mentionMatches}
            activeIndex={mentionIndex}
            setActiveIndex={setMentionIndex}
            onPick={applyMention}
          />
        )}

        {pendingAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingAttachments.map((a, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                {a.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.dataUrl} alt={a.name} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="max-w-[160px] truncate">{a.name}</span>
                <button
                  onClick={() =>
                    setPendingAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mx-auto flex max-w-4xl items-end gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            title="Anexar ficheiro"
            aria-label="Anexar ficheiro"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              updateMentionQuery(
                e.target.value,
                e.target.selectionStart ?? e.target.value.length
              );
            }}
            onKeyDown={(e) => {
              if (mentionQuery !== null && mentionMatches.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => (i + 1) % mentionMatches.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex(
                    (i) => (i - 1 + mentionMatches.length) % mentionMatches.length
                  );
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  applyMention(mentionMatches[mentionIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionQuery(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            onClick={(e) => {
              const ta = e.currentTarget;
              updateMentionQuery(ta.value, ta.selectionStart ?? ta.value.length);
            }}
            rows={1}
            disabled={sending}
            placeholder="Escreve uma mensagem ou @luny para chamar a IA…"
            className="min-h-[2.75rem] flex-1 resize-none rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all",
              "bg-gradient-to-br from-primary to-rose-500 text-white shadow",
              "hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            )}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <p className="mx-auto mt-1.5 max-w-4xl text-center text-[10px] text-muted-foreground/60">
          A escrever como <span className="font-semibold">{userName}</span>
        </p>
      </div>

      {/* ── Mention mini-profile popover ─────────────────── */}
      {mentionPopover && (
        <MentionPopover
          member={mentionPopover.member}
          anchor={mentionPopover.anchor}
          onClose={() => setMentionPopover(null)}
        />
      )}

      {/* ── Clear-history confirm ─────────────────────────── */}
      {confirmClear && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-150 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <h3 className="text-base font-semibold">Limpar histórico</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Vais apagar <strong className="text-foreground">todas</strong> as mensagens
              deste chat partilhado. Esta ação é irreversível.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={clearHistory}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
              >
                Apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Members side panel (chat-local) ──────────────── */}
      <MembersSidePanel
        open={membersPanelOpen}
        onClose={() => setMembersPanelOpen(false)}
        members={members}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Helpers                                                  */
/* ───────────────────────────────────────────────────────── */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function normalizeMention(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

interface MessageGroup {
  id: string;
  authorId: string | null;
  authorRole: "admin" | "ai";
  authorName: string;
  authorImage: string | null;
  messages: ChatMessage[];
}

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    const sameAuthor =
      last &&
      last.authorRole === m.authorRole &&
      last.authorId === m.authorId &&
      new Date(m.createdAt).getTime() -
        new Date(last.messages[last.messages.length - 1].createdAt).getTime() <
        5 * 60 * 1000;
    if (sameAuthor) {
      last.messages.push(m);
    } else {
      groups.push({
        id: m.id,
        authorId: m.authorId,
        authorRole: m.authorRole,
        authorName: m.authorName,
        authorImage: m.authorImage,
        messages: [m],
      });
    }
  }
  return groups;
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20">
        <MessageSquare className="h-6 w-6 text-primary" />
      </div>
      <p className="text-base font-semibold">Sem mensagens</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Envia a primeira mensagem para começar a conversa.
      </p>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        Experimenta escrever{" "}
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">@luny ola!</span>{" "}
        para falar com a IA.
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <AvatarPlate name="Luny" image={null} ai />
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="text-xs font-semibold text-primary">Luny</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Message group                                            */
/* ───────────────────────────────────────────────────────── */

interface MessageGroupProps {
  group: MessageGroup;
  currentUserId: string;
  membersByName: Map<string, Member>;
  onMention: (m: Member, e: React.MouseEvent) => void;
  editingId: string | null;
  editingDraft: string;
  setEditingDraft: (s: string) => void;
  onStartEdit: (m: ChatMessage) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onCopy: (m: ChatMessage) => void;
  onUnsend: (m: ChatMessage) => void;
  menuFor: string | null;
  setMenuFor: (id: string | null) => void;
}

function MessageGroup(props: MessageGroupProps) {
  const { group, currentUserId } = props;
  const isAi = group.authorRole === "ai";
  const isOwn = !isAi && group.authorId === currentUserId;
  const time = new Date(group.messages[0].createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <AvatarPlate name={group.authorName} image={group.authorImage} ai={isAi} />
      <div className={cn("flex min-w-0 max-w-[80%] flex-col gap-1", isOwn && "items-end")}>
        <div className={cn("flex items-baseline gap-2", isOwn && "flex-row-reverse")}>
          <span
            className={cn(
              "text-xs font-semibold",
              isAi ? "text-primary" : "text-foreground"
            )}
          >
            {group.authorName}
          </span>
          {isAi && (
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              IA
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <div className="flex w-full flex-col gap-1">
          {group.messages.map((m) => (
            <MessageRow key={m.id} m={m} isOwn={isOwn} isAi={isAi} {...props} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  m,
  isOwn,
  isAi,
  currentUserId: _currentUserId,
  membersByName,
  onMention,
  editingId,
  editingDraft,
  setEditingDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onCopy,
  onUnsend,
  menuFor,
  setMenuFor,
}: { m: ChatMessage; isOwn: boolean; isAi: boolean } & Omit<MessageGroupProps, "group">) {
  void _currentUserId;
  const isDeleted = !!m.deletedAt;
  const isEditing = editingId === m.id;
  const menuOpen = menuFor === m.id;

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-background p-2">
        <textarea
          autoFocus
          value={editingDraft}
          onChange={(e) => setEditingDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancelEdit();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSaveEdit(m.id);
            }
          }}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-primary/60"
        />
        <div className="mt-2 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onCancelEdit}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSaveEdit(m.id)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground hover:opacity-90"
          >
            <Check className="h-3 w-3" />
            Guardar
          </button>
        </div>
      </div>
    );
  }

  const bubbleColor = isAi
    ? "border-primary/30 bg-primary/5 text-foreground"
    : isOwn
    ? "border-primary/40 bg-primary/10 text-foreground"
    : "border-border bg-card text-foreground";

  const cornerRound = isOwn ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm";

  return (
    <div
      className={cn("group/msg relative flex items-start gap-2", isOwn && "flex-row-reverse")}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("min-w-0", cornerRound, "border px-3 py-2", bubbleColor)}>
        {isDeleted ? (
          <p className="text-sm italic text-muted-foreground">
            <RotateCcw className="mr-1 inline h-3 w-3" />
            Mensagem anulada
          </p>
        ) : (
          <>
            {m.content && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {renderWithMentions(m.content, membersByName, onMention)}
                {m.editedAt && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">(editado)</span>
                )}
              </p>
            )}
            {m.attachments.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {m.attachments.map((a, i) => (
                  <AttachmentView key={i} a={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline 3-dot menu — left of own, right of others */}
      {!isDeleted && (
        <div className="relative self-center opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuFor(menuOpen ? null : m.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label="Opções"
            title="Opções"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div
              className={cn(
                "absolute top-8 z-40 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl",
                isOwn ? "left-0" : "right-0"
              )}
            >
              {isOwn && !isAi && (
                <button
                  onClick={() => onStartEdit(m)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-accent"
                >
                  <span>Editar</span>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onCopy(m)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-accent"
              >
                <span>Copiar</span>
                <Copy className="h-3.5 w-3.5" />
              </button>
              {isOwn && !isAi && (
                <button
                  onClick={() => onUnsend(m)}
                  className="flex w-full items-center justify-between border-t border-border px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
                >
                  <span>Anular envio</span>
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttachmentView({ a }: { a: Attachment }) {
  if (a.mime.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={a.dataUrl}
        alt={a.name}
        className="max-h-64 max-w-xs rounded-lg border border-border object-cover"
      />
    );
  }
  return (
    <a
      href={a.dataUrl}
      download={a.name}
      className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs hover:bg-accent"
    >
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="max-w-[200px] truncate">{a.name}</span>
      <span className="text-muted-foreground">{formatBytes(a.size)}</span>
    </a>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AvatarPlate({ name, image, ai }: { name: string; image: string | null; ai: boolean }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-transparent"
      />
    );
  }
  if (ai) {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-500 text-white shadow">
        <Bot className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-xs font-semibold uppercase text-white">
      {name.slice(0, 1)}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Mention rendering                                        */
/* ───────────────────────────────────────────────────────── */

const MENTION_RE = /@([A-Za-z0-9_\u00C0-\u024F]+)/g;

function renderWithMentions(
  text: string,
  membersByName: Map<string, Member>,
  onMention: (m: Member, e: React.MouseEvent) => void
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let i = 0;
  const re = new RegExp(MENTION_RE.source, MENTION_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIdx) out.push(text.slice(lastIdx, start));
    const raw = match[1];
    const key = normalizeMention(raw);
    const member = membersByName.get(key);
    if (member) {
      out.push(
        <button
          key={`m-${i++}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMention(member, e);
          }}
          className={cn(
            "rounded px-1 py-0.5 align-baseline text-[0.95em] font-medium transition-colors",
            member.isAi
              ? "bg-primary/20 text-primary hover:bg-primary/30"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          @{member.name}
        </button>
      );
    } else {
      out.push(`@${raw}`);
    }
    lastIdx = start + match[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

/* ───────────────────────────────────────────────────────── */
/*  Mention autocomplete dropdown                            */
/* ───────────────────────────────────────────────────────── */

function MentionDropdown({
  matches,
  activeIndex,
  setActiveIndex,
  onPick,
}: {
  matches: Member[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onPick: (m: Member) => void;
}) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl sm:left-8 sm:right-8">
      <ul className="max-h-72 overflow-y-auto py-1">
        {matches.map((m, idx) => {
          const active = idx === activeIndex;
          return (
            <li key={m.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(m);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                  active ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <div className="relative">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : m.isAi ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-500 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-[10px] font-semibold uppercase text-white">
                      {m.name.slice(0, 1)}
                    </div>
                  )}
                  {!m.isAi && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-popover",
                        m.online ? "bg-emerald-500" : "bg-zinc-500"
                      )}
                    />
                  )}
                </div>
                <span className="flex-1 truncate">{m.name}</span>
                {m.isAi && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    IA
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Mention mini-profile popover                             */
/* ───────────────────────────────────────────────────────── */

function MentionPopover({
  member,
  anchor,
  onClose,
}: {
  member: Member;
  anchor: { x: number; y: number };
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const isAi = !!member.isAi;
  const style: React.CSSProperties = {
    left: Math.min(anchor.x, typeof window !== "undefined" ? window.innerWidth - 280 : anchor.x),
    top: Math.max(anchor.y + 12, 12),
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150 fixed z-[70] w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
    >
      <div
        className={cn(
          "h-14 w-full",
          isAi
            ? "bg-gradient-to-r from-primary to-rose-500"
            : "bg-gradient-to-r from-zinc-500 to-zinc-700"
        )}
      />
      <div className="-mt-7 flex justify-center">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt=""
            className="h-14 w-14 rounded-full border-4 border-popover object-cover"
          />
        ) : isAi ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-popover bg-gradient-to-br from-primary to-rose-500 text-white shadow">
            <Bot className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-popover bg-gradient-to-br from-zinc-600 to-zinc-800 text-sm font-bold uppercase text-white">
            {member.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-2 text-center">
        <p className="text-sm font-semibold">{member.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {isAi ? "Assistente IA" : "Administrador"}
        </p>
        {!isAi && member.email && (
          <p className="mt-2 truncate text-[11px] text-muted-foreground">{member.email}</p>
        )}
        {isAi && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Menciona <span className="font-mono">@luny</span> para falar comigo.
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Members side panel (chat-local)                          */
/* ───────────────────────────────────────────────────────── */

function MembersSidePanel({
  open,
  onClose,
  members,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
}) {
  const ai = members.filter((m) => m.isAi);
  const onlineAdmins = members.filter((m) => !m.isAi && m.online);
  const offlineAdmins = members.filter((m) => !m.isAi && !m.online);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Membros"
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex w-[88vw] max-w-sm flex-col border-l border-border bg-card shadow-2xl",
          "transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Menu className="h-4 w-4 text-muted-foreground" />
            Membros
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {members.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <MembersSection title="IA" list={ai} />
          <MembersSection title={`Online — ${onlineAdmins.length}`} list={onlineAdmins} />
          <MembersSection title={`Offline — ${offlineAdmins.length}`} list={offlineAdmins} muted />
        </div>
      </aside>
    </>
  );
}

function MembersSection({
  title,
  list,
  muted,
}: {
  title: string;
  list: Member[];
  muted?: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul>
        {list.map((m) => (
          <li
            key={m.id}
            className={cn(
              "group flex items-center gap-3 px-3 py-1.5 transition-colors hover:bg-accent/60",
              muted && "opacity-70"
            )}
          >
            <div className="relative flex-shrink-0">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : m.isAi ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-500 text-white shadow">
                  <Bot className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-xs font-semibold uppercase text-white">
                  {m.name.slice(0, 1)}
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
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {m.isAi ? "Assistente IA" : "Administrador"}
              </p>
            </div>
            {m.isAi && (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                IA
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
