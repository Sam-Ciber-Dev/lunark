"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ArrowLeft, Download, FileText, RefreshCw, Sparkles } from "lucide-react";
import {
  trafficApi, ReportListItem, ReportDetail,
  CHART_COLORS, THREAT_COLORS, THREAT_LABELS,
} from "./_lib";

interface Props { userId: string; }

const TICK = { fill: "#999", fontSize: 11 };
const GRID = "#262626";

const MONTH_PT = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function ReportsPanel({ userId }: Props) {
  const api = trafficApi(userId);
  const [list, setList] = useState<ReportListItem[]>([]);
  const [active, setActive] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function refresh() {
    try {
      const data = await api.reports();
      setList(data.reports);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function open(period: string) {
    setActive(null);
    try {
      const d = await api.report(period);
      setActive(d);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falhou");
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const r = await api.generateCurrent();
      await refresh();
      await open(r.period);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falhou");
    } finally {
      setGenerating(false);
    }
  }

  if (active) {
    return <ReportView api={api} report={active} onBack={() => setActive(null)} />;
  }

  const now = new Date();
  const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthlyReports = list.filter((r) => r.type === "monthly");
  const yearlyReports = list.filter((r) => r.type === "yearly");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{list.length} relatórios disponíveis</div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-gradient-to-br from-primary to-rose-500 px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" /> {generating ? "A gerar…" : "Gerar relatório actual"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-300">Erro: {err}</div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-medium text-foreground">Relatórios anuais</h3>
        {yearlyReports.length === 0 ? (
          <div className="rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">Nenhum relatório anual ainda</div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {yearlyReports.map((r) => (
              <li key={r.id}>
                <button onClick={() => open(r.period)} className="flex w-full items-center gap-2 rounded-lg border border-border bg-card/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-card">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-sm text-foreground">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground">{r.created_at}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-foreground">Relatórios mensais</h3>
        {loading ? (
          <div className="text-muted-foreground text-sm">A carregar…</div>
        ) : monthlyReports.length === 0 ? (
          <div className="rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">Nenhum relatório mensal ainda. Clica em &quot;Gerar relatório actual&quot;.</div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyReports.map((r) => {
              const isCurrent = r.period === currentPeriod;
              return (
                <li key={r.id}>
                  <button onClick={() => open(r.period)} className="flex w-full items-center gap-2 rounded-lg border border-border bg-card/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-card">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{r.title}</span>
                        {isCurrent && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">A decorrer</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{r.period}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReportView({
  api, report, onBack,
}: {
  api: ReturnType<typeof trafficApi>;
  report: ReportDetail;
  onBack: () => void;
}) {
  const d = report.data;
  const threatPie = d.threat_distribution.map((t) => ({
    name: THREAT_LABELS[t.type] ?? t.type,
    value: t.count,
    color: THREAT_COLORS[t.type] ?? "#888",
  }));
  const vpnPie = [
    { name: "VPN/Proxy", value: d.vpn_stats.vpn, color: "#ff4444" },
    { name: "Direto", value: d.vpn_stats.direct, color: "#22c55e" },
  ];
  const [monthStr, yearStr] = (() => {
    const [y, m] = report.period.split("-");
    if (m) return [MONTH_PT[parseInt(m, 10)] ?? "", y];
    return ["", y];
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
          <div>
            <h2 className="text-base font-medium text-foreground">{report.title}</h2>
            <p className="text-xs text-muted-foreground">
              {monthStr ? `${monthStr} ${yearStr}` : yearStr} · gerado {report.created_at}
            </p>
          </div>
        </div>
        <a
          href={api.downloadReportUrl(report.period)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-gradient-to-br from-primary to-rose-500 px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-3 w-3" /> Descarregar .md
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Requests" value={d.total_requests} />
        <SummaryCard label="IPs Únicos" value={d.unique_ips} />
        <SummaryCard label="Ameaças" value={d.total_threats} />
        <SummaryCard label="Bloqueios" value={d.total_blocks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pedidos por hora">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.hourly_requests}>
              <defs>
                <linearGradient id="rRptReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4444" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="requests" stroke="#ff4444" fill="url(#rRptReq)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Requests por dia">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.daily_requests}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="requests" fill="#cc0000" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top países">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.top_countries} layout="vertical">
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="country" tick={TICK} width={90} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="requests">
                {d.top_countries.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição de ameaças">
          {threatPie.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Sem ameaças registadas</div>
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

        <ChartCard title="Métodos HTTP">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.methods}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="method" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="count" fill="#ff6666" />
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
      </div>

      <ChartCard title="Top endpoints">
        <table className="min-w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-2 py-1">Path</th><th className="px-2 py-1 text-right">Requests</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono">
            {d.top_paths.length === 0 ? (
              <tr><td colSpan={2} className="px-2 py-3 text-center text-muted-foreground">Sem dados</td></tr>
            ) : d.top_paths.map((p) => (
              <tr key={p.path}>
                <td className="max-w-[400px] truncate px-2 py-1 text-foreground/90">{p.path}</td>
                <td className="px-2 py-1 text-right text-foreground">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value.toLocaleString("pt-PT")}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-2 text-sm font-medium text-foreground">{title}</div>
      {children}
    </div>
  );
}
