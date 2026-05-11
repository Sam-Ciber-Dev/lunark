"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MailOpen,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Ban,
  ShieldX,
  Plus,
  Loader2,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Subscriber {
  id: string;
  email: string;
  locale: "pt" | "en";
  unsubscribedAt: string | null;
  createdAt: string;
  userName: string | null;
}

interface BannedEmail {
  email: string;
  reason: string | null;
  bannedAt: string;
}

interface Props {
  userId: string;
}

/**
 * EyeWeb-inspired "Gestor de E-Mails" — manages newsletter subscribers and a
 * separate banned-emails list (anti-spam / opt-out enforcement). Hosted as a
 * tab in the Comunicação subnav.
 */
export default function SubscritoresPanel({ userId }: Props) {
  const [view, setView] = useState<"subscribers" | "banned">("subscribers");
  const [search, setSearch] = useState("");

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [banned, setBanned] = useState<BannedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Subscriber | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Subscriber | null>(null);
  const [confirmBan, setConfirmBan] = useState<Subscriber | null>(null);
  const [manualBanOpen, setManualBanOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b] = await Promise.all([
        fetch(`${API_URL}/admin/news/subscribers/list`, { headers: { "x-user-id": userId } }),
        fetch(`${API_URL}/admin/news/banned`, { headers: { "x-user-id": userId } }),
      ]);
      if (s.ok) {
        const data = (await s.json()) as { data: Subscriber[] };
        setSubscribers(data.data);
      }
      if (b.ok) {
        const data = (await b.json()) as { data: BannedEmail[] };
        setBanned(data.data);
      }
    } catch {
      setError("Falha de rede");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredSubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) || (s.userName ?? "").toLowerCase().includes(q)
    );
  }, [subscribers, search]);

  const filteredBanned = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return banned;
    return banned.filter((b) => b.email.toLowerCase().includes(q));
  }, [banned, search]);

  async function saveEdit(name: string, reason: string, locale: "pt" | "en") {
    if (!editTarget) return;
    setPending(true);
    try {
      const res = await fetch(`${API_URL}/admin/news/subscribers/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name, reason, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Falha ao atualizar");
      } else {
        setEditTarget(null);
        await refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function doDelete(reason: string) {
    if (!confirmDelete) return;
    setPending(true);
    try {
      const res = await fetch(`${API_URL}/admin/news/subscribers/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Falha ao remover");
      } else {
        setConfirmDelete(null);
        await refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function doBan(reason: string) {
    if (!confirmBan) return;
    setPending(true);
    try {
      await fetch(`${API_URL}/admin/news/subscribers/${confirmBan.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ reason }),
      });
      setConfirmBan(null);
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function manualBan(email: string, reason: string) {
    setPending(true);
    try {
      const res = await fetch(`${API_URL}/admin/news/banned`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ email, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Falha ao banir");
      } else {
        setManualBanOpen(false);
        await refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function unban(email: string) {
    setPending(true);
    try {
      await fetch(`${API_URL}/admin/news/banned/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      await refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header strip: counter + subnav */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 p-3">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Users className="h-3.5 w-3.5" />
          <span className="tabular-nums">{subscribers.length}</span>
          <span className="font-normal">subscritor{subscribers.length === 1 ? "" : "es"}</span>
        </div>

        <div role="tablist" className="flex gap-1 rounded-xl border border-border bg-background p-1">
          {(
            [
              { key: "subscribers", label: "Subscritores", icon: MailOpen },
              { key: "banned", label: "Contas Banidas", icon: ShieldX },
            ] as const
          ).map((t) => {
            const Active = t.icon;
            const isActive = view === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-primary to-rose-500 text-white shadow"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                <Active className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === "subscribers" ? "Procurar email ou nome…" : "Procurar email…"}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {view === "banned" && (
            <button
              onClick={() => setManualBanOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-rose-500/50 hover:text-rose-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Banir email</span>
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="border-b border-border bg-card/60 px-4 py-3">
          <h3 className="text-sm font-semibold">
            {view === "subscribers" ? "Lista de Subscritores" : "Lista de Contas Banidas"}
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-4 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : view === "subscribers" ? (
          <SubscribersTable
            rows={filteredSubs}
            onEdit={(r) => setEditTarget(r)}
            onDelete={(r) => setConfirmDelete(r)}
            onBan={(r) => setConfirmBan(r)}
          />
        ) : (
          <BannedTable rows={filteredBanned} onUnban={unban} />
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          subscriber={editTarget}
          pending={pending}
          onClose={() => setEditTarget(null)}
          onSave={saveEdit}
        />
      )}
      {confirmDelete && (
        <DeleteAccountModal
          subscriber={confirmDelete}
          pending={pending}
          onClose={() => setConfirmDelete(null)}
          onConfirm={doDelete}
        />
      )}
      {confirmBan && (
        <BanModal
          subscriber={confirmBan}
          pending={pending}
          onClose={() => setConfirmBan(null)}
          onConfirm={doBan}
        />
      )}
      {manualBanOpen && (
        <ManualBanModal
          pending={pending}
          onClose={() => setManualBanOpen(false)}
          onConfirm={manualBan}
        />
      )}
    </div>
  );
}

// ──────────────────────────── tables ────────────────────────────

function SubscribersTable({
  rows,
  onEdit,
  onDelete,
  onBan,
}: {
  rows: Subscriber[];
  onEdit: (r: Subscriber) => void;
  onDelete: (r: Subscriber) => void;
  onBan: (r: Subscriber) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <MailOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Sem subscritores</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Quando alguém subscrever pelo footer, aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-card/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 text-left font-semibold">#</th>
            <th className="px-4 py-2.5 text-left font-semibold">Email</th>
            <th className="px-4 py-2.5 text-left font-semibold">Nome</th>
            <th className="px-4 py-2.5 text-left font-semibold">Idioma</th>
            <th className="px-4 py-2.5 text-left font-semibold">Registado em</th>
            <th className="px-4 py-2.5 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              className="border-b border-border/60 transition-colors hover:bg-foreground/[0.03]"
            >
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
              <td className="px-4 py-2.5 font-medium">{r.email}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.userName ?? "—"}</td>
              <td className="px-4 py-2.5">
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {r.locale}
                </span>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {new Date(r.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <IconButton title="Editar" onClick={() => onEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton tone="danger" title="Remover" onClick={() => onDelete(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton tone="warning" title="Banir" onClick={() => onBan(r)}>
                    <Ban className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BannedTable({
  rows,
  onUnban,
}: {
  rows: BannedEmail[];
  onUnban: (email: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldX className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Sem contas banidas</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Emails que banires aparecem aqui e ficam impedidos de subscrever.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-card/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 text-left font-semibold">#</th>
            <th className="px-4 py-2.5 text-left font-semibold">Email</th>
            <th className="px-4 py-2.5 text-left font-semibold">Motivo</th>
            <th className="px-4 py-2.5 text-left font-semibold">Banido em</th>
            <th className="px-4 py-2.5 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.email}
              className="border-b border-border/60 transition-colors hover:bg-foreground/[0.03]"
            >
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
              <td className="px-4 py-2.5 font-medium">{r.email}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.reason ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {new Date(r.bannedAt).toLocaleString()}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onUnban(r.email)}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                  >
                    Reverter
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────── helpers / modals ────────────────────────────

function IconButton({
  children,
  onClick,
  title,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "default" | "danger" | "warning";
}) {
  const tones: Record<string, string> = {
    default: "hover:border-primary/40 hover:text-foreground",
    danger: "hover:border-rose-500/50 hover:text-rose-300",
    warning: "hover:border-amber-500/50 hover:text-amber-300",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors",
        tones[tone]
      )}
    >
      {children}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditModal({
  subscriber,
  pending,
  onClose,
  onSave,
}: {
  subscriber: Subscriber;
  pending: boolean;
  onClose: () => void;
  onSave: (name: string, reason: string, locale: "pt" | "en") => void;
}) {
  const [name, setName] = useState(subscriber.userName ?? "");
  const [reason, setReason] = useState("");
  const [locale, setLocale] = useState<"pt" | "en">(subscriber.locale);
  const noAccount = subscriber.userName === null;
  const canSubmit = !noAccount && name.trim().length > 0 && reason.trim().length > 0;

  return (
    <ModalShell title="Editar Subscritor" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSave(name.trim(), reason.trim(), locale);
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <div className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {subscriber.email}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">O email é a chave da conta e não pode ser alterado aqui.</p>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nome do utilizador
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={noAccount ? "Sem conta associada" : "Nome a apresentar"}
            disabled={noAccount}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:opacity-50"
            required
          />
          {noAccount && (
            <p className="mt-1 text-[10px] text-amber-300">Este subscritor não tem conta associada — não é possível alterar o nome.</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Motivo da alteração
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: pedido do utilizador, correção de typo…"
            disabled={noAccount}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:opacity-50"
            required
          />
          <p className="mt-1 text-[10px] text-muted-foreground">O utilizador receberá um email em inglês com este motivo.</p>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Idioma preferido
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["pt", "en"] as const).map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition-colors",
                  locale === l
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-lg disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteAccountModal({
  subscriber,
  pending,
  onClose,
  onConfirm,
}: {
  subscriber: Subscriber;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length > 0;
  return (
    <ModalShell title="Eliminar conta" onClose={onClose}>
      <p className="mb-3 text-xs text-muted-foreground">
        A conta de <strong>{subscriber.email}</strong> será <strong>permanentemente removida</strong> da base de dados, juntamente com todo o histórico (carrinho, wishlist, sessão). O utilizador receberá um email em inglês com o motivo.
      </p>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Motivo (obrigatório)
      </label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex: pedido do utilizador, violação de termos…"
        className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={() => canSubmit && onConfirm(reason.trim())}
          disabled={pending || !canSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-lg disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Eliminar
        </button>
      </div>
    </ModalShell>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  tone,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "danger" | "warning";
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <p className="mb-4 text-xs text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-lg disabled:opacity-50",
            tone === "danger"
              ? "bg-gradient-to-r from-rose-500 to-rose-600"
              : "bg-gradient-to-r from-amber-500 to-orange-600"
          )}
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function BanModal({
  subscriber,
  pending,
  onClose,
  onConfirm,
}: {
  subscriber: Subscriber;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length > 0;
  return (
    <ModalShell title="Banir conta" onClose={onClose}>
      <p className="mb-3 text-xs text-muted-foreground">
        A conta <strong>{subscriber.email}</strong> ficará banida: não poderá iniciar sessão (formulário ou Google), nem registar uma nova conta com este email. A subscrição da newsletter é também removida. O utilizador será automaticamente terminado da sessão atual e receberá um email em inglês com o motivo.
      </p>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Motivo (obrigatório)
      </label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex: spam, abuso, violação de termos…"
        className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={() => canSubmit && onConfirm(reason.trim())}
          disabled={pending || !canSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-lg disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Banir
        </button>
      </div>
    </ModalShell>
  );
}

function ManualBanModal({
  pending,
  onClose,
  onConfirm,
}: {
  pending: boolean;
  onClose: () => void;
  onConfirm: (email: string, reason: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const canSubmit = email.trim().length > 0 && reason.trim().length > 0;
  return (
    <ModalShell title="Banir Email" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onConfirm(email.trim(), reason.trim());
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Motivo (obrigatório)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: spam, abuso, violação de termos…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-lg disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Banir
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
