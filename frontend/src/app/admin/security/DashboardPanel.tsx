"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, AlertTriangle, ShieldAlert, Ban, RefreshCw } from "lucide-react";
import {
  trafficApi, ChartData, TrafficStats,
  CHART_COLORS, THREAT_COLORS, THREAT_LABELS,
} from "./_lib";

interface Props { userId: string; }

const TICK = { fill: "#999", fontSize: 11 };
const GRID = "#262626";

export default function DashboardPanel({ userId }: Props) {
  const api = trafficApi(userId);
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const [s, ch] = await Promise.all([api.stats(), api.chartData()]);
      setStats(s);
      setChart(ch);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="text-zinc-400 text-sm py-8 text-center">A carregar dashboard…</div>;
  }
  if (err) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
        Erro: {err}
        <button onClick={refresh} className="ml-3 underline">Tentar novamente</button>
      </div>
    );
  }
  if (!chart || !stats) return null;

  const threatPie = chart.threat_distribution.map((t) => ({
    name: THREAT_LABELS[t.type] ?? t.type,
    value: t.count,
    color: THREAT_COLORS[t.type] ?? "#888",
  }));
  const vpnPie = [
    { name: "VPN/Proxy", value: chart.vpn_stats.vpn, color: "#ff4444" },
    { name: "Direto", value: chart.vpn_stats.direct, color: "#22c55e" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Requests hoje" value={stats.requests_today} accent="from-red-500/30 to-rose-700/30" />
        <StatCard icon={ShieldAlert} label="IPs activos (5 min)" value={stats.active_ips_5m} accent="from-orange-500/30 to-amber-700/30" />
        <StatCard icon={AlertTriangle} label="Ameaças hoje" value={stats.suspicious_today} accent="from-yellow-500/30 to-orange-700/30" />
        <StatCard icon={Ban} label="Bloqueados" value={stats.blocked_total} accent="from-rose-500/30 to-red-800/30" />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">
          Refresh automático cada 15s · Únicos hoje: <span className="text-zinc-300">{chart.unique_ips_today}</span>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pedidos por hora (hoje)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart.hourly_requests}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4444" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="requests" stroke="#ff4444" fill="url(#reqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ameaças por hora">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart.hourly_threats}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="threats" fill="#ff0000" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição de ameaças">
          {threatPie.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-12">Nenhuma ameaça hoje</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={threatPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {threatPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top países">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart.top_countries} layout="vertical">
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="country" tick={TICK} width={90} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="requests" fill="#cc0000">
                {chart.top_countries.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="VPN vs Directo">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={vpnPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                {vpnPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Métodos HTTP">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart.methods}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="method" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="count" fill="#ff6666" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Activity; label: string; value: number; accent: string;
}) {
  return (
    <div className={`rounded-xl border border-zinc-800/80 bg-gradient-to-br ${accent} p-4`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-300">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">{value.toLocaleString("pt-PT")}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
      <div className="mb-2 text-sm font-medium text-zinc-200">{title}</div>
      {children}
    </div>
  );
}
