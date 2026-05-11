/**
 * Painel de Segurança — shared API helpers + threat constants.
 *
 * Mirrors EyeWeb's traffic monitor types so the panels render the
 * same data regardless of backend stack.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function trafficApi(userId: string) {
  const headers = {
    "Content-Type": "application/json",
    "x-user-id": userId,
  } as const;

  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j.detail || j.error || JSON.stringify(j);
      } catch {
        detail = await res.text();
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    base: API_URL,
    headers,
    stats: () => req<TrafficStats>(`/admin/traffic/stats`),
    connections: () => req<{ connections: Connection[] }>(`/admin/traffic/connections`),
    logs: (limit = 100, offset = 0, ip = "") =>
      req<{ logs: TrafficLog[]; total: number }>(
        `/admin/traffic/logs?limit=${limit}&offset=${offset}${ip ? `&ip=${encodeURIComponent(ip)}` : ""}`,
      ),
    suspicious: (limit = 100, offset = 0) =>
      req<{ events: SuspiciousEvent[]; total: number }>(
        `/admin/traffic/suspicious?limit=${limit}&offset=${offset}`,
      ),
    detailedLogs: (limit = 200) =>
      req<{ entries: DetailedEntry[]; total: number }>(
        `/admin/traffic/detailed-logs?limit=${limit}`,
      ),
    blocked: () =>
      req<{ blocked: BlockedIp[]; blocked_devices: BlockedDevice[] }>(`/admin/traffic/blocked`),
    chartData: () => req<ChartData>(`/admin/traffic/chart-data`),
    blockIp: (ip: string, reason: string) =>
      req<{ success: boolean; message: string }>(`/admin/traffic/block-ip`, {
        method: "POST",
        body: JSON.stringify({ ip, reason }),
      }),
    unblockIp: (ip: string) =>
      req<{ success: boolean }>(`/admin/traffic/unblock-ip`, {
        method: "POST",
        body: JSON.stringify({ ip }),
      }),
    blockDevice: (fp: string, reason: string) =>
      req<{ success: boolean; message: string }>(`/admin/traffic/block-device`, {
        method: "POST",
        body: JSON.stringify({ fingerprint_hash: fp, reason }),
      }),
    unblockDevice: (fp: string) =>
      req<{ success: boolean }>(`/admin/traffic/unblock-device`, {
        method: "POST",
        body: JSON.stringify({ fingerprint_hash: fp }),
      }),
    updateDeviceReason: (fp: string, reason: string) =>
      req<{ success: boolean }>(`/admin/traffic/update-device-reason`, {
        method: "POST",
        body: JSON.stringify({ fingerprint_hash: fp, reason }),
      }),
    reports: () => req<{ reports: ReportListItem[] }>(`/admin/traffic/reports`),
    report: (period: string) => req<ReportDetail>(`/admin/traffic/reports/${period}`),
    generateCurrent: () =>
      req<{ ok: boolean; period: string; title: string }>(
        `/admin/traffic/reports/generate-current`,
        { method: "POST" },
      ),
    downloadReportUrl: (period: string) =>
      `${API_URL}/admin/traffic/reports/${period}/download`,
  };
}

// ─── Types ───
export interface TrafficStats {
  requests_today: number;
  active_ips_5m: number;
  suspicious_today: number;
  blocked_total: number;
}

export interface Connection {
  fingerprint_hash: string;
  ips: string[];
  ip_details: { ip: string; is_vpn: boolean }[];
  country: string;
  city: string;
  is_vpn: boolean;
  vpn_provider: string;
  method: string;
  requests: number;
  online: boolean;
  is_admin: boolean;
}

export interface TrafficLog {
  id: number;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  userAgent: string;
  country: string;
  city: string;
  isVpn: boolean;
  vpnProvider: string;
  responseTimeMs: number;
  fingerprintHash: string;
  createdAt: string;
}

export interface SuspiciousEvent {
  id: number;
  ip: string;
  event: string;
  severity: string;
  details: string;
  path: string;
  country: string;
  city: string;
  isVpn: boolean;
  fingerprintHash: string;
  autoBlocked: boolean;
  createdAt: string;
}

export interface DetailedEntry {
  _type: "request" | "threat";
  id: string;
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  user_agent: string;
  country: string;
  city: string;
  is_vpn: boolean;
  vpn_provider: string;
  response_time_ms: number;
  fingerprint_hash: string;
  event: string | null;
  severity: string | null;
  details: string | null;
  auto_blocked: boolean;
}

export interface BlockedIp {
  id: number;
  ip: string;
  reason: string;
  blocked_by: string;
  request_count: number;
  country: string;
  is_vpn: boolean;
  log_snapshot: string;
  created_at: string;
}

export interface BlockedDevice {
  id: number;
  fingerprint_hash: string;
  reason: string;
  blocked_by: string;
  components: Record<string, unknown>;
  associated_ips: string[];
  ip_details: { ip: string; is_vpn: boolean }[];
  created_at: string;
}

export interface ChartData {
  hourly_requests: { hour: string; requests: number }[];
  hourly_threats: { hour: string; threats: number }[];
  threat_distribution: { type: string; count: number }[];
  top_countries: { country: string; requests: number }[];
  vpn_stats: { vpn: number; direct: number };
  methods: { method: string; count: number }[];
  unique_ips_today: number;
  total_requests_today: number;
  total_threats_today: number;
  recent_blocks: number;
}

export interface ReportListItem {
  id: number;
  type: "monthly" | "yearly";
  period: string;
  title: string;
  created_at: string;
}

export interface ReportDetail extends ReportListItem {
  markdown: string;
  data: {
    hourly_requests: { hour: string; requests: number }[];
    hourly_threats: { hour: string; threats: number }[];
    threat_distribution: { type: string; count: number }[];
    top_countries: { country: string; requests: number }[];
    vpn_stats: { vpn: number; direct: number };
    methods: { method: string; count: number }[];
    unique_ips: number;
    total_requests: number;
    total_threats: number;
    total_blocks: number;
    daily_requests: { date: string; requests: number }[];
    top_paths: { path: string; count: number }[];
  };
}

// ─── Threat constants (mirror EyeWeb palette) ───
export const CHART_COLORS = [
  "#ff0000", "#ff4444", "#ff6666", "#ff8888",
  "#cc0000", "#990000", "#ff2222", "#dd3333",
];

export const THREAT_COLORS: Record<string, string> = {
  rate_limit: "#ff4444",
  scanner: "#ff8800",
  sql_injection: "#ff0000",
  path_traversal: "#cc0000",
  brute_force: "#ff2222",
  recon_probe: "#ff6600",
  suspicious_ua: "#ffaa00",
};

export const THREAT_LABELS: Record<string, string> = {
  rate_limit: "Rate Limit",
  scanner: "Scanner",
  sql_injection: "SQL Injection",
  path_traversal: "Path Traversal",
  brute_force: "Brute Force",
  recon_probe: "Recon Probe",
  suspicious_ua: "UA Suspeito",
};

export function severityColor(sev: string | null | undefined): string {
  switch ((sev ?? "").toLowerCase()) {
    case "critical": return "#ff0000";
    case "high": return "#ff4444";
    case "medium": return "#ff8800";
    case "low": return "#ffaa00";
    default: return "#aaaaaa";
  }
}

export function formatHour(ts: string): string {
  // ts is "YYYY-MM-DD HH:MM:SS"
  return ts.length >= 19 ? ts.slice(11, 19) : ts;
}

export function shortFp(fp: string): string {
  return fp ? `${fp.slice(0, 8)}…${fp.slice(-4)}` : "—";
}
