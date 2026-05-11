"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, RefreshCw, X } from "lucide-react";
import {
  trafficApi, DetailedEntry, THREAT_LABELS,
  severityColor, formatHour, shortFp,
} from "./_lib";

interface Props { userId: string; }

type Filter = "all" | "visit" | "request" | "threat";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-emerald-300",
  POST: "text-sky-300",
  PUT: "text-amber-300",
  DELETE: "text-rose-300",
  PAGE: "text-violet-300",
};

function statusClass(s: number) {
  if (!s) return "text-muted-foreground";
  if (s >= 500) return "text-rose-400";
  if (s >= 400) return "text-amber-400";
  if (s >= 300) return "text-sky-300";
  return "text-emerald-300";
}

export default function DetailedLogsPanel({ userId }: Props) {
  const api = trafficApi(userId);
  const [entries, setEntries] = useState<DetailedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [ipFilter, setIpFilter] = useState("");
  const [detail, setDetail] = useState<DetailedEntry | null>(null);
  const [blockModal, setBlockModal] = useState<{ ip: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  async function refresh() {
    try {
      const data = await api.detailedLogs(200);
      setEntries(data.entries);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    return entries.filter((e) => {
      if (ipFilter && !e.ip.includes(ipFilter)) return false;
      if (filter === "all") return true;
      if (filter === "threat") return e._type === "threat";
      if (filter === "visit") return e._type === "request" && e.method === "PAGE";
      if (filter === "request") return e._type === "request" && e.method !== "PAGE";
      return true;
    });
  }, [entries, filter, ipFilter]);

  async function doBlock() {
    if (!blockModal) return;
    try {
      await api.blockIp(blockModal.ip, blockReason || "Bloqueio rápido a partir dos logs");
      setBlockModal(null);
      setBlockReason("");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falhou");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            placeholder="Filtrar IP…"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/60"
          />
          <FilterBtn current={filter} value="all" onChange={setFilter}>Todos</FilterBtn>
          <FilterBtn current={filter} value="visit" onChange={setFilter}>Visitas</FilterBtn>
          <FilterBtn current={filter} value="request" onChange={setFilter}>Requests</FilterBtn>
          <FilterBtn current={filter} value="threat" onChange={setFilter}>Ameaças</FilterBtn>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {visible.length}/{entries.length} entradas · 3s
          <button onClick={refresh} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-300">Erro: {err}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-card/60 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5">Hora</th>
              <th className="px-2 py-1.5">Tipo</th>
              <th className="px-2 py-1.5">IP</th>
              <th className="px-2 py-1.5">Método</th>
              <th className="px-2 py-1.5">Caminho</th>
              <th className="px-2 py-1.5">Estado</th>
              <th className="px-2 py-1.5">Localização</th>
              <th className="px-2 py-1.5">Informação</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono">
            {loading ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center text-muted-foreground">A carregar…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center text-muted-foreground">Sem entradas</td></tr>
            ) : visible.map((e) => {
              const isThreat = e._type === "threat";
              const isPage = e.method === "PAGE";
              const rowCls = isThreat
                ? "bg-rose-500/5 hover:bg-rose-500/10"
                : isPage
                  ? "bg-primary/5 hover:bg-primary/10"
                  : "hover:bg-foreground/[0.03]";
              return (
                <tr key={e.id} className={`cursor-pointer ${rowCls}`} onClick={() => setDetail(e)}>
                  <td className="whitespace-nowrap px-2 py-1 text-muted-foreground">{formatHour(e.timestamp)}</td>
                  <td className="px-2 py-1">
                    {isThreat ? (
                      <span style={{ color: severityColor(e.severity) }}>⚠ AMEAÇA</span>
                    ) : isPage ? (
                      <span className="text-violet-300">PÁGINA</span>
                    ) : (
                      <span className="text-muted-foreground">REQ</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-foreground">{e.ip}</td>
                  <td className={`px-2 py-1 ${METHOD_COLOR[e.method] ?? "text-muted-foreground"}`}>{e.method || "—"}</td>
                  <td className="max-w-[260px] truncate px-2 py-1 text-foreground/90" title={e.path}>{e.path}</td>
                  <td className={`px-2 py-1 ${statusClass(e.status_code)}`}>{e.status_code || "—"}</td>
                  <td className="px-2 py-1 text-muted-foreground">{e.country || "—"}{e.city ? ` · ${e.city}` : ""}</td>
                  <td className="max-w-[300px] truncate px-2 py-1 text-muted-foreground" title={e.details ?? e.user_agent}>
                    {isThreat ? (
                      <span style={{ color: severityColor(e.severity) }}>
                        {THREAT_LABELS[e.event ?? ""] ?? e.event} · {e.details}
                      </span>
                    ) : (
                      e.user_agent
                    )}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {!e.is_admin && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setBlockModal({ ip: e.ip }); setBlockReason(""); }}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300 transition-colors hover:bg-rose-500/20"
                      >
                        <Ban className="h-3 w-3" /> Bloq.
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <DetailModal entry={detail} onClose={() => setDetail(null)} />
      )}

      {blockModal && (
        <SmallModal onClose={() => setBlockModal(null)} title={`Bloquear IP · ${blockModal.ip}`}>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary/60"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setBlockModal(null)} className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
            <button onClick={doBlock} className="rounded-md border border-rose-500/50 bg-rose-500/15 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/25">Bloquear</button>
          </div>
        </SmallModal>
      )}
    </div>
  );
}

function FilterBtn({ current, value, onChange, children }: {
  current: Filter; value: Filter; onChange: (v: Filter) => void; children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={`rounded-md border px-2 py-1 text-xs transition-colors ${active ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function DetailModal({ entry, onClose }: { entry: DetailedEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Detalhes da entrada</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Field label="Timestamp" value={entry.timestamp} />
          <Field label="IP" value={entry.ip} />
          <Field label="Método" value={entry.method || "—"} />
          <Field label="Estado HTTP" value={String(entry.status_code || "—")} />
          <Field label="Caminho" value={entry.path} colSpan />
          <Field label="País" value={entry.country || "—"} />
          <Field label="Cidade" value={entry.city || "—"} />
          <Field label="VPN" value={entry.is_vpn ? entry.vpn_provider || "sim" : "não"} />
          <Field label="Tempo resp." value={`${entry.response_time_ms}ms`} />
          <Field label="Fingerprint" value={shortFp(entry.fingerprint_hash)} colSpan />
          {entry._type === "threat" && (
            <>
              <Field label="Tipo de ameaça" value={THREAT_LABELS[entry.event ?? ""] ?? entry.event ?? "—"} />
              <Field label="Severidade" value={entry.severity ?? "—"} />
              <Field label="Detalhes" value={entry.details ?? "—"} colSpan />
              <Field label="Auto-bloqueio" value={entry.auto_blocked ? "sim" : "não"} />
            </>
          )}
          {entry.user_agent && (
            <Field label="User-Agent" value={entry.user_agent} colSpan />
          )}
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value, colSpan }: { label: string; value: string; colSpan?: boolean }) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="break-all text-foreground">{value}</dd>
    </div>
  );
}

function SmallModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
