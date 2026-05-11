"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, Trash2, X, Pencil, Copy, RotateCcw, MoreVertical, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

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
  email: string;
}

const LUNY_MEMBER: Member = {
  id: "__luny__",
  name: "Luny",
  image: null,
  email: "ai@lunark",
};

export default function ChatAdminClient({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [mentionPopover, setMentionPopover] = useState<{ member: Member; anchor: { x: number; y: number } } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTsRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);

  /* ─── Load members once ─── */
  useEffect(() => {
    fetch(`${API_URL}/admin/chat/members`, { headers: { "x-user-id": userId } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMembers(d?.data ?? []))
      .catch(() => {});
  }, [userId]);

  /* ─── Polling loop ─── */
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
          for (const m of data.data) {
            if (!ids.has(m.id)) merged.push(m);
          }
          return merged;
        });
      } catch {
        /* ignore network errors silently */
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchMessages(false);
    const id = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchMessages]);

  /* ─── Auto-scroll on new messages (if user is near bottom) ─── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

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
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ content: text, attachments: pendingAttachments }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
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
      stickToBottomRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
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
        next.push({ name: f.name, mime: f.type || "application/octet-stream", size: f.size, dataUrl });
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
          m.id === id ? { ...m, content: "", attachments: [], deletedAt: new Date().toISOString() } : m
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
      const key = normalizeMention(m.name);
      if (key) map.set(key, m);
    }
    return map;
  }, [members]);

  /* ─── Render ─── */
  const grouped = groupMessages(messages);

  return (
    <div
      className="flex h-[calc(100vh-22rem)] min-h-[520px] flex-col"
      onClick={() => setMenuFor(null)}
    >
      {messages.length > 0 && (
        <div className="mb-3 flex items-center justify-end">
          <button
            disabled
            title="Apenas administradores com permissão podem limpar."
            className="flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground/60"
          >
            <Trash2 className="h-3 w-3" />
            Histórico partilhado
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto rounded-xl border border-border bg-background/40 p-4"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
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
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-border bg-card/60 p-2">
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
                onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-end gap-2"
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
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          title="Anexar ficheiro"
          aria-label="Anexar ficheiro"
        >
          <Paperclip className="h-4 w-4" />
        </button>

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
          disabled={sending}
          placeholder="Escreve uma mensagem… (usa @luny para falar com a IA)"
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
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

      {/* Mention mini-profile popover */}
      {mentionPopover && (
        <MentionPopover
          member={mentionPopover.member}
          anchor={mentionPopover.anchor}
          onClose={() => setMentionPopover(null)}
        />
      )}
    </div>
  );
}

/* ─── Helpers ─── */

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
      new Date(m.createdAt).getTime() - new Date(last.messages[last.messages.length - 1].createdAt).getTime() <
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
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20">
        <Send className="h-5 w-5 text-violet-400" />
      </div>
      <p className="text-sm font-semibold">Sem mensagens</p>
      <p className="mt-1 text-xs text-muted-foreground">Envia a primeira mensagem para começar a conversa.</p>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        Experimenta escrever{" "}
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">@luny ola!</span>{" "}
        para falar com a IA.
      </p>
    </div>
  );
}

/* ─── Message group renderer ─── */

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
  const { group } = props;
  const isAi = group.authorRole === "ai";
  const time = new Date(group.messages[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="group/grp flex gap-3">
      <Avatar name={group.authorName} image={group.authorImage} ai={isAi} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-sm font-semibold", isAi && "text-violet-400")}>{group.authorName}</span>
          {isAi && <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">IA</span>}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <div className="mt-0.5 space-y-1">
          {group.messages.map((m) => (
            <MessageRow key={m.id} m={m} {...props} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  m,
  currentUserId,
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
}: { m: ChatMessage } & Omit<MessageGroupProps, "group">) {
  const isOwn = m.authorId === currentUserId;
  const isDeleted = !!m.deletedAt;
  const isEditing = editingId === m.id;
  const menuOpen = menuFor === m.id;

  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary/40 bg-background p-2">
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

  return (
    <div
      className="group/msg relative flex items-start gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-w-0 flex-1">
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

      {/* Hover menu trigger */}
      {!isDeleted && (
        <div className="relative opacity-0 transition-opacity group-hover/msg:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuFor(menuOpen ? null : m.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label="Opções"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-40 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
              {isOwn && (
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
              {isOwn && (
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
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-accent"
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

function Avatar({ name, image, ai }: { name: string; image: string | null; ai: boolean }) {
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
  return (
    <div
      className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase text-white",
        ai
          ? "bg-gradient-to-br from-indigo-500 to-violet-600"
          : "bg-gradient-to-br from-zinc-600 to-zinc-800"
      )}
    >
      {ai ? "AI" : name.slice(0, 1)}
    </div>
  );
}

/* ─── Mention rendering ─── */

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
            member.id === "__luny__"
              ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
              : "bg-primary/15 text-primary hover:bg-primary/25"
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

/* ─── Mention popover ─── */

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

  const isAi = member.id === "__luny__";
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
            ? "bg-gradient-to-r from-indigo-500 to-violet-600"
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
        ) : (
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-4 border-popover text-sm font-bold uppercase text-white",
              isAi
                ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                : "bg-gradient-to-br from-zinc-600 to-zinc-800"
            )}
          >
            {isAi ? "AI" : member.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-2 text-center">
        <p className="text-sm font-semibold">{member.name}</p>
        <p className="text-[11px] text-muted-foreground">{isAi ? "Assistente IA" : "Administrador"}</p>
        {!isAi && (
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
