"use client";

import { useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldCheck, Wifi, WifiOff, X, Network } from "lucide-react";
import { trafficApi, Connection, shortFp } from "./_lib";

interface Props { userId: string; }

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-300 border-emerald-700/40",
  POST: "bg-sky-500/15 text-sky-300 border-sky-700/40",
  PUT: "bg-amber-500/15 text-amber-300 border-amber-700/40",
  DELETE: "bg-rose-500/15 text-rose-300 border-rose-700/40",
  PAGE: "bg-violet-500/15 text-violet-300 border-violet-700/40",
};

export default function LogsPanel({ userId }: Props) {
  const api = trafficApi(userId);
  const [conns, setConns] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ipModal, setIpModal] = useState<Connection | null>(null);
  const [blockModal, setBlockModal] = useState<{ fp: string; preview: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [postBlockModal, setPostBlockModal] = useState<{ fp: string } | null>(null);
  const [postReason, setPostReason] = useState("");

  async function refresh() {
    try {
      const data = await api.connections();
      setConns(data.connections);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doBlock() {
    if (!blockModal) return;
    try {
      await api.blockDevice(blockModal.fp, blockReason || "");
      setBlockModal(null);
      if (!blockReason.trim()) {
        setPostBlockModal({ fp: blockModal.fp });
        setPostReason("");
      } else {
        setBlockReason("");
        refresh();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falhou");
    }
  }

  async function doPostReason() {
    if (!postBlockModal) return;
    try {
      if (postReason.trim()) {
        await api.updateDeviceReason(postBlockModal.fp, postReason.trim());
      }
      setPostBlockModal(null);
      setPostReason("");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falhou");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Conexões ativas — refresh cada 5s · <span className="text-foreground">{conns.length}</span> dispositivos
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-300">
          Erro: {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Dispositivo</th>
              <th className="px-3 py-2">IPs</th>
              <th className="px-3 py-2">Localização</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">VPN</th>
              <th className="px-3 py-2 text-right">Requests</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">A carregar…</td></tr>
            ) : conns.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Sem conexões ativas hoje</td></tr>
            ) : conns.map((c) => (
              <tr key={c.fingerprint_hash} className="hover:bg-foreground/[0.03]">
                <td className="px-3 py-2">
                  {c.online ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                      <Wifi className="h-3 w-3" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                      <WifiOff className="h-3 w-3" /> Offline
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-foreground">
                  {shortFp(c.fingerprint_hash)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {c.ips.length <= 1 ? (
                    <span className="text-foreground">{c.ips[0] ?? "—"}</span>
                  ) : (
                    <button
                      onClick={() => setIpModal(c)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-0.5 font-mono text-foreground transition-colors hover:border-primary/40 hover:bg-card"
                    >
                      <span>{c.ips[0]}</span>
                      <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-semibold text-primary">
                        +{c.ips.length - 1}
                      </span>
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {c.country || "—"}{c.city ? ` · ${c.city}` : ""}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${METHOD_COLOR[c.method] ?? "border-border bg-card text-muted-foreground"}`}>
                    {c.method}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {c.is_vpn ? <span className="text-rose-300">{c.vpn_provider || "VPN"}</span> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-right text-foreground tabular-nums">{c.requests}</td>
                <td className="px-3 py-2 text-right">
                  {c.is_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3 w-3" /> ADMIN
                    </span>
                  ) : (
                    <button
                      onClick={() => { setBlockModal({ fp: c.fingerprint_hash, preview: shortFp(c.fingerprint_hash) }); setBlockReason(""); }}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-500/20"
                    >
                      <Ban className="h-3 w-3" /> Bloquear
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IPs modal — IP atual + IPs que foram usados (EyeWeb style) */}
      {ipModal && (
        <IpsModal conn={ipModal} onClose={() => setIpModal(null)} />
      )}

      {/* Block modal */}
      {blockModal && (
        <Modal onClose={() => setBlockModal(null)} title={`Bloquear dispositivo · ${blockModal.preview}`}>
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
        </Modal>
      )}

      {/* Post-block reason modal */}
      {postBlockModal && (
        <Modal onClose={() => { setPostBlockModal(null); refresh(); }} title="Adicionar motivo">
          <p className="mb-2 text-xs text-muted-foreground">Bloqueio efetuado sem motivo. Podes adicionar agora ou deixar em branco.</p>
          <textarea
            value={postReason}
            onChange={(e) => setPostReason(e.target.value)}
            placeholder="Motivo"
            className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary/60"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { setPostBlockModal(null); refresh(); }} className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Saltar</button>
            <button onClick={doPostReason} className="rounded-md border border-primary/50 bg-primary/15 px-3 py-1 text-xs text-primary hover:bg-primary/25">Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IpsModal({ conn, onClose }: { conn: Connection; onClose: () => void }) {
  const [current, ...history] = conn.ip_details;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-rose-500 text-white">
            <Network className="h-4 w-4" />
          </span>
          <h3 className="text-base font-semibold text-foreground">IPs do Dispositivo</h3>
        </header>

        <div className="space-y-5 px-5 py-4">
          {current && (
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                IP atual
              </p>
              <IpRow ip={current.ip} isVpn={current.is_vpn} highlight />
            </section>
          )}

          {history.length > 0 && (
            <section>
              <div className="my-3 border-t border-border/70" />
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                IPs que foram usados
              </p>
              <div className="space-y-2">
                {history.map((d) => (
                  <IpRow key={d.ip} ip={d.ip} isVpn={d.is_vpn} />
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex justify-end border-t border-border bg-card/60 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-card"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

function IpRow({ ip, isVpn, highlight }: { ip: string; isVpn: boolean; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-sm ${
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      }`}
    >
      <span className="text-foreground">{ip}</span>
      <span
        className={`text-xs ${isVpn ? "font-semibold text-rose-300" : "text-muted-foreground"}`}
      >
        {isVpn ? "Sim" : "Não"}
      </span>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
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
