"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Unlock, X, Edit3 } from "lucide-react";
import { trafficApi, BlockedDevice, BlockedIp, shortFp } from "./_lib";

interface Props { userId: string; }

function parseAutoReason(reason: string): { simple: string; detail: string } {
  // "auto: rate_limit (520 reqs/min from 4 IPs)" etc.
  if (!reason) return { simple: "(sem motivo)", detail: "" };
  if (reason.startsWith("auto:")) {
    const body = reason.slice(5).trim();
    const match = body.match(/^(\w+)\s*(\(.*\))?\s*$/);
    if (match) {
      return { simple: `Auto · ${match[1]}`, detail: match[2] ?? "" };
    }
    return { simple: "Auto-bloqueio", detail: body };
  }
  return { simple: reason, detail: "" };
}

export default function BlockedPanel({ userId }: Props) {
  const api = trafficApi(userId);
  const [devices, setDevices] = useState<BlockedDevice[]>([]);
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<BlockedDevice | null>(null);
  const [editing, setEditing] = useState<{ fp: string; current: string } | null>(null);
  const [editReason, setEditReason] = useState("");

  async function refresh() {
    try {
      const data = await api.blocked();
      setDevices(data.blocked_devices);
      setIps(data.blocked);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unblockIp(ip: string) {
    if (!confirm(`Desbloquear IP ${ip}?`)) return;
    try { await api.unblockIp(ip); refresh(); }
    catch (e) { alert(e instanceof Error ? e.message : "Falhou"); }
  }
  async function unblockDev(fp: string) {
    if (!confirm(`Desbloquear dispositivo ${shortFp(fp)}?`)) return;
    try { await api.unblockDevice(fp); refresh(); }
    catch (e) { alert(e instanceof Error ? e.message : "Falhou"); }
  }
  async function saveEdit() {
    if (!editing) return;
    try {
      await api.updateDeviceReason(editing.fp, editReason);
      setEditing(null);
      setEditReason("");
      refresh();
    } catch (e) { alert(e instanceof Error ? e.message : "Falhou"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Refresh cada 10s · <span className="text-foreground">{devices.length}</span> dispositivos · <span className="text-foreground">{ips.length}</span> IPs
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-300">Erro: {err}</div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-medium text-foreground">Dispositivos bloqueados</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Fingerprint</th>
                <th className="px-3 py-2">IPs associados</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2">Bloqueado em</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">A carregar…</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Sem dispositivos bloqueados</td></tr>
              ) : devices.map((d) => {
                const auto = parseAutoReason(d.reason);
                return (
                  <tr key={d.id} className="cursor-pointer hover:bg-foreground/[0.03]" onClick={() => setDetail(d)}>
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{shortFp(d.fingerprint_hash)}</td>
                    <td className="px-3 py-2 text-xs text-foreground/90">
                      {d.associated_ips.length === 0 ? "—" : (
                        <span className="font-mono">
                          {d.associated_ips.slice(0, 2).join(", ")}
                          {d.associated_ips.length > 2 && <span className="text-muted-foreground"> +{d.associated_ips.length - 2}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing({ fp: d.fingerprint_hash, current: d.reason }); setEditReason(d.reason); }}
                        className="text-left text-foreground/90 hover:text-foreground underline decoration-dotted decoration-muted-foreground/40"
                      >
                        {auto.simple || "(sem motivo)"}
                      </button>
                      {auto.detail && <div className="mt-0.5 text-[10px] text-muted-foreground">{auto.detail}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${d.blocked_by === "system" ? "bg-amber-500/15 text-amber-300" : "bg-primary/15 text-primary"}`}>
                        {d.blocked_by}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{d.created_at}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); unblockDev(d.fingerprint_hash); }}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      >
                        <Unlock className="h-3 w-3" /> Desbloquear
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-foreground">IPs bloqueados</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">País</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2 text-right">Requests</th>
                <th className="px-3 py-2">Bloqueado em</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ips.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sem IPs bloqueados</td></tr>
              ) : ips.map((b) => (
                <tr key={b.id} className="hover:bg-foreground/[0.03]">
                  <td className="px-3 py-2 font-mono text-xs text-foreground">
                    {b.ip}{b.is_vpn && <span className="ml-2 rounded bg-rose-500/15 px-1 py-0.5 text-[10px] text-rose-300">VPN</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground/90">{b.country || "—"}</td>
                  <td className="px-3 py-2 text-xs text-foreground/90">{b.reason || "(sem motivo)"}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${b.blocked_by === "system" ? "bg-amber-500/15 text-amber-300" : "bg-primary/15 text-primary"}`}>
                      {b.blocked_by}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-foreground/90">{b.request_count}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{b.created_at}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => unblockIp(b.ip)} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20">
                      <Unlock className="h-3 w-3" /> Desbloquear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <Modal onClose={() => setDetail(null)} title={`Dispositivo · ${shortFp(detail.fingerprint_hash)}`}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Field label="Fingerprint" value={detail.fingerprint_hash} colSpan />
            <Field label="Motivo" value={detail.reason || "(sem motivo)"} colSpan />
            <Field label="Bloqueado por" value={detail.blocked_by} />
            <Field label="Bloqueado em" value={detail.created_at} />
            <Field label="IPs associados" value={detail.associated_ips.join(", ") || "—"} colSpan />
          </dl>
          {Object.keys(detail.components).length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Componentes</div>
              <pre className="max-h-60 overflow-auto rounded-md border border-border bg-background p-2 text-[10px] text-foreground/90">
                {JSON.stringify(detail.components, null, 2)}
              </pre>
            </div>
          )}
        </Modal>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={`Editar motivo · ${shortFp(editing.fp)}`}>
          <textarea
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary/60"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
            <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-primary hover:bg-primary/25">
              <Edit3 className="h-3 w-3" /> Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        {children}
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
