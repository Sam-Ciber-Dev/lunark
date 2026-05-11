"use client";

import { useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";
import { trafficApi, Connection, shortFp } from "./_lib";

interface Props { userId: string; }

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-300 border-emerald-700/40",
  POST: "bg-sky-500/20 text-sky-300 border-sky-700/40",
  PUT: "bg-amber-500/20 text-amber-300 border-amber-700/40",
  DELETE: "bg-rose-500/20 text-rose-300 border-rose-700/40",
  PAGE: "bg-violet-500/20 text-violet-300 border-violet-700/40",
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
        <div className="text-sm text-zinc-400">
          Conexões activas — refresh cada 5s · <span className="text-zinc-200">{conns.length}</span> dispositivos
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          Erro: {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Dispositivo</th>
              <th className="px-3 py-2">IPs</th>
              <th className="px-3 py-2">Localização</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">VPN</th>
              <th className="px-3 py-2 text-right">Requests</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-500">A carregar…</td></tr>
            ) : conns.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-500">Sem conexões activas hoje</td></tr>
            ) : conns.map((c) => (
              <tr key={c.fingerprint_hash} className="hover:bg-zinc-900/40">
                <td className="px-3 py-2">
                  {c.online ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      <Wifi className="h-3 w-3" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      <WifiOff className="h-3 w-3" /> Offline
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-200">
                  {shortFp(c.fingerprint_hash)}
                  {c.is_admin && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                      <ShieldCheck className="h-3 w-3" /> ADMIN
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {c.ips.length <= 1 ? (
                    <span className="text-zinc-300">{c.ips[0] ?? "—"}</span>
                  ) : (
                    <button
                      onClick={() => setIpModal(c)}
                      className="text-sky-300 underline decoration-dotted hover:text-sky-200"
                    >
                      {c.ips[0]} <span className="text-zinc-500">+{c.ips.length - 1}</span>
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-300">
                  {c.country || "—"}{c.city ? ` · ${c.city}` : ""}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${METHOD_COLOR[c.method] ?? "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                    {c.method}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {c.is_vpn ? <span className="text-rose-300">{c.vpn_provider || "VPN"}</span> : <span className="text-zinc-500">—</span>}
                </td>
                <td className="px-3 py-2 text-right text-zinc-300">{c.requests}</td>
                <td className="px-3 py-2 text-right">
                  {!c.is_admin && (
                    <button
                      onClick={() => { setBlockModal({ fp: c.fingerprint_hash, preview: shortFp(c.fingerprint_hash) }); setBlockReason(""); }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-900/60 bg-red-950/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/40"
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

      {/* IPs modal */}
      {ipModal && (
        <Modal onClose={() => setIpModal(null)} title={`IPs · ${shortFp(ipModal.fingerprint_hash)}`}>
          <ul className="space-y-1 text-sm">
            {ipModal.ip_details.map((d) => (
              <li key={d.ip} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs">
                <span className="text-zinc-200">{d.ip}</span>
                {d.is_vpn && <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">VPN</span>}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Block modal */}
      {blockModal && (
        <Modal onClose={() => setBlockModal(null)} title={`Bloquear dispositivo · ${blockModal.preview}`}>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-200"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setBlockModal(null)} className="rounded border border-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-900">Cancelar</button>
            <button onClick={doBlock} className="rounded border border-red-900 bg-red-950/60 px-3 py-1 text-xs text-red-200 hover:bg-red-900/60">Bloquear</button>
          </div>
        </Modal>
      )}

      {/* Post-block reason modal */}
      {postBlockModal && (
        <Modal onClose={() => { setPostBlockModal(null); refresh(); }} title="Adicionar motivo">
          <p className="mb-2 text-xs text-zinc-400">Bloqueio efectuado sem motivo. Podes adicionar agora ou deixar em branco.</p>
          <textarea
            value={postReason}
            onChange={(e) => setPostReason(e.target.value)}
            placeholder="Motivo"
            className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-200"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { setPostBlockModal(null); refresh(); }} className="rounded border border-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-900">Saltar</button>
            <button onClick={doPostReason} className="rounded border border-sky-900 bg-sky-950/60 px-3 py-1 text-xs text-sky-200 hover:bg-sky-900/60">Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
