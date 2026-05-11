/**
 * Painel de Segurança — TrafficService
 * ─────────────────────────────────────────────────────────────────────
 * In-memory state singleton that mirrors EyeWeb's TrafficService.
 * - Tracks heartbeats (per IP + per fingerprint) → online status
 * - Tracks request rates per IP (rolling 5-min window)
 * - Holds blocked IPs / device hashes / hardware hashes / admin IPs+FPs
 * - Fuzzy-matches new fingerprints against blocked components
 *
 * Persistence is delegated to Drizzle/Turso (see middleware/traffic-log.ts
 * and routes/admin.ts traffic endpoints).
 */

import { db } from "../db";
import {
  trafficBlockedIps,
  trafficBlockedDevices,
  trafficDeviceIps,
  trafficLogs,
  trafficSuspicious,
  trafficVpnCache,
} from "../db/schema";
import { eq, sql } from "drizzle-orm";

// ───── Paths the middleware should skip (feedback-loop guard) ─────
export const SKIP_PATHS = new Set([
  "/",
  "/health",
  "/openapi.json",
  "/docs",
  "/redoc",
]);
export const SKIP_PREFIXES = [
  "/admin/traffic", // never log traffic requests themselves
  "/traffic/visit",
  "/traffic/heartbeat",
  "/traffic/check-ip",
  "/traffic/admin-heartbeat",
  "/traffic/register-fingerprint",
];

// ───── Infra CIDRs (AWS/GCP/Azure/DigitalOcean/Google) ─────
// Stored as [networkInt, maskInt] for fast lookup on IPv4 addresses.
const INFRA_CIDRS_RAW: Array<[string, number]> = [
  ["3.0.0.0", 8], ["13.32.0.0", 11], ["15.0.0.0", 8], ["18.0.0.0", 8],
  ["34.0.0.0", 8], ["35.160.0.0", 11], ["35.184.0.0", 13], ["35.192.0.0", 12],
  ["35.208.0.0", 12], ["35.224.0.0", 12], ["35.240.0.0", 12],
  ["44.192.0.0", 10], ["50.16.0.0", 14], ["51.44.0.0", 16],
  ["52.0.0.0", 8], ["54.0.0.0", 8], ["66.102.0.0", 16], ["66.249.0.0", 16],
  ["99.77.0.0", 16], ["104.40.0.0", 13], ["104.208.0.0", 13],
  ["142.250.0.0", 15], ["184.72.0.0", 15], ["184.169.0.0", 16],
  // DigitalOcean
  ["24.144.0.0", 16], ["24.199.0.0", 16], ["64.23.0.0", 16],
  ["68.183.0.0", 16], ["134.199.0.0", 16], ["137.184.0.0", 16],
  ["138.68.0.0", 16], ["139.59.0.0", 16], ["143.198.0.0", 16],
  ["143.244.0.0", 16], ["146.190.0.0", 16], ["147.182.0.0", 16],
  ["157.245.0.0", 16], ["159.65.0.0", 16], ["159.89.0.0", 16],
  ["159.203.0.0", 16], ["161.35.0.0", 16], ["164.90.0.0", 15],
  ["164.92.0.0", 16], ["165.22.0.0", 16], ["165.227.0.0", 16],
  ["165.232.0.0", 16], ["167.71.0.0", 16], ["167.172.0.0", 16],
  ["170.64.0.0", 16], ["174.138.0.0", 16], ["178.128.0.0", 16],
  ["178.62.0.0", 16], ["188.166.0.0", 16], ["206.189.0.0", 16],
  ["209.38.0.0", 16], ["209.97.0.0", 16],
];

function ipv4ToInt(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const a = +m[1], b = +m[2], c = +m[3], d = +m[4];
  if ([a, b, c, d].some((n) => n > 255)) return null;
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

const INFRA_CIDRS: Array<[number, number]> = INFRA_CIDRS_RAW.map(([net, bits]) => {
  const n = ipv4ToInt(net) ?? 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return [n & mask, mask];
});

export function isInfraIp(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  for (const [net, mask] of INFRA_CIDRS) {
    if ((n & mask) === net) return true;
  }
  return false;
}

const LOCALHOST = new Set(["127.0.0.1", "::1", "localhost", "unknown", ""]);

// ───── VPN / hosting heuristic (used as fallback for the free ip-api tier) ─────
// Matches against the ISP / Org / AS strings returned by ip-api. We look for
// well-known consumer VPN brands plus the big cloud / datacenter providers
// (because residential users almost never come from those AS ranges).
const VPN_PROVIDER_PATTERNS: Array<{ re: RegExp; name: string }> = [
  { re: /nordvpn|nord\s*vpn/i, name: "NordVPN" },
  { re: /express\s*vpn/i, name: "ExpressVPN" },
  { re: /surfshark/i, name: "Surfshark" },
  { re: /mullvad/i, name: "Mullvad" },
  { re: /proton\s*(vpn|ag)/i, name: "ProtonVPN" },
  { re: /\bivpn\b/i, name: "IVPN" },
  { re: /cyberghost/i, name: "CyberGhost" },
  { re: /private\s*internet\s*access|\bpia\b/i, name: "Private Internet Access" },
  { re: /hide\s*my\s*ass|\bhma\b/i, name: "HideMyAss" },
  { re: /tunnelbear/i, name: "TunnelBear" },
  { re: /hotspot\s*shield/i, name: "Hotspot Shield" },
  { re: /windscribe/i, name: "Windscribe" },
  { re: /vyprvpn/i, name: "VyprVPN" },
  { re: /perfect\s*privacy/i, name: "Perfect Privacy" },
  { re: /tor\s*(exit|network|project)/i, name: "Tor" },
];
const DATACENTER_PATTERNS: Array<{ re: RegExp; name: string }> = [
  { re: /\bamazon\b|\baws\b|ec2/i, name: "Amazon AWS" },
  { re: /microsoft|azure/i, name: "Microsoft Azure" },
  { re: /google\s*(cloud|llc)|\bgcp\b/i, name: "Google Cloud" },
  { re: /digital\s*ocean/i, name: "DigitalOcean" },
  { re: /\blinode\b/i, name: "Linode" },
  { re: /\bvultr\b/i, name: "Vultr" },
  { re: /\bovh\b/i, name: "OVH" },
  { re: /hetzner/i, name: "Hetzner" },
  { re: /leaseweb/i, name: "Leaseweb" },
  { re: /contabo/i, name: "Contabo" },
  { re: /scaleway/i, name: "Scaleway" },
  { re: /oracle\s*cloud/i, name: "Oracle Cloud" },
  { re: /\bcloudflare\b/i, name: "Cloudflare" },
  { re: /m247/i, name: "M247" },
  { re: /datacamp/i, name: "DataCamp" },
];

export function classifyVpn(
  isp?: string,
  org?: string,
  asStr?: string,
): { isVpn: boolean; provider: string } {
  const haystack = `${isp ?? ""} | ${org ?? ""} | ${asStr ?? ""}`;
  for (const p of VPN_PROVIDER_PATTERNS) {
    if (p.re.test(haystack)) return { isVpn: true, provider: p.name };
  }
  for (const p of DATACENTER_PATTERNS) {
    if (p.re.test(haystack)) return { isVpn: true, provider: p.name };
  }
  return { isVpn: false, provider: "" };
}

// ───── Threat signatures (kept identical to EyeWeb) ─────
export const SCANNER_AGENTS = [
  "nmap", "nikto", "sqlmap", "dirbuster", "gobuster",
  "wpscan", "masscan", "zmap", "shodan", "censys",
  "nuclei", "ffuf", "feroxbuster", "burpsuite", "hydra",
  "metasploit", "openvas", "nessus", "qualys", "acunetix",
];
export const SQL_PATTERNS = [
  "' or ", "' and ", "union select", "drop table",
  "insert into", "delete from", "1=1", "' or '1'='1",
  "char(", "concat(", "benchmark(", "sleep(",
  "waitfor delay", "pg_sleep", "load_file", "0x",
];
export const PATH_TRAVERSAL = ["../", "..\\", "%2e%2e", "%252e"];
export const PATH_TRAVERSAL_TARGETS = [
  "/etc/passwd", "/etc/shadow", "/etc/hosts",
  "/proc/self", "/proc/version", "/proc/cpuinfo",
  "/var/log/", "/var/www/", "/usr/local/",
  "c:\\windows", "c:/windows", "boot.ini",
  "win.ini", "web.config",
];
export const SUSPICIOUS_PATHS = [
  "/wp-admin", "/wp-login", "/wp-content", "/wp-includes",
  "/wordpress", "/wp-json", "/xmlrpc.php",
  "/administrator", "/joomla", "/drupal",
  "/.env", "/.git", "/.svn", "/.htaccess", "/.htpasswd",
  "/.ds_store", "/config.php", "/config.yml", "/config.json",
  "/database.yml", "/settings.py", "/web.config",
  "/composer.json", "/.npmrc",
  "/phpinfo", "/phpmyadmin", "/pma", "/adminer",
  "/server-status", "/server-info", "/_debug",
  "/actuator", "/swagger", "/graphql",
  "/shell", "/cmd", "/command", "/eval",
  "/c99", "/r57", "/webshell", "/backdoor",
  "/filemanager", "/upload.php",
  "/cgi-bin/", "/console", "/debug/", "/trace",
  "/solr/", "/jenkins/", "/manager/html",
  "/invoker/", "/jmx-console", "/status",
  "/.well-known/", "/telescope/",
];

// ───── Thresholds ─────
const RATE_LIMIT_WINDOW = 60_000;        // ms
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_AUTOBLOCK = 200;
const BRUTE_FORCE_WINDOW = 300_000;      // 5 min
const BRUTE_FORCE_MAX = 10;

// ───── Fuzzy fingerprint weights (sum = 100) ─────
const FP_WEIGHTS: Record<string, number> = {
  canvas: 25, webgl: 30, audio: 20, screen: 10,
  cpu: 5, ram: 3, tz: 3, platform: 2, ua: 2,
};
const FP_MATCH_THRESHOLD = 70;

// ────────────────────────────────────────────────────────────
// SINGLETON
// ────────────────────────────────────────────────────────────
class TrafficServiceImpl {
  private blockedIps: Set<string> = new Set();
  private blockedDevices: Set<string> = new Set();
  private blockedHardwareHashes: Set<string> = new Set();
  private blockedFpComponents: Map<string, Record<string, unknown>> = new Map();
  private fpIpMap: Map<string, Set<string>> = new Map();
  private heartbeats: Map<string, number> = new Map();
  private reqCounts: Map<string, number[]> = new Map();
  private probedPaths: Map<string, Set<string>> = new Map();
  private adminIps: Set<string> = new Set();
  private adminFps: Set<string> = new Set();
  private fpLastIp: Map<string, string> = new Map();
  private geoCache: Map<string, GeoResult> = new Map();
  private initialised = false;

  async init() {
    if (this.initialised) return;
    try {
      const ips = await db.select({ ip: trafficBlockedIps.ip }).from(trafficBlockedIps);
      for (const r of ips) this.blockedIps.add(r.ip);

      const devices = await db
        .select({
          fp: trafficBlockedDevices.fingerprintHash,
          components: trafficBlockedDevices.components,
          associatedIps: trafficBlockedDevices.associatedIps,
        })
        .from(trafficBlockedDevices);
      for (const r of devices) {
        this.blockedDevices.add(r.fp);
        try {
          const comps = JSON.parse(r.components || "{}");
          this.blockedFpComponents.set(r.fp, comps);
          const hw = typeof comps?.hardware_hash === "string" ? comps.hardware_hash : "";
          if (hw) this.blockedHardwareHashes.add(hw);
        } catch {}
        try {
          const ipList = JSON.parse(r.associatedIps || "[]") as string[];
          this.fpIpMap.set(r.fp, new Set(ipList));
        } catch {}
      }
    } catch (err) {
      console.warn("[TrafficService.init] failed:", err);
    }
    this.initialised = true;
  }

  shouldLog(path: string): boolean {
    if (SKIP_PATHS.has(path)) return false;
    return !SKIP_PREFIXES.some((p) => path.startsWith(p));
  }

  isBlocked(ip: string) { return this.blockedIps.has(ip); }
  isDeviceBlocked(fp: string) { return !!fp && this.blockedDevices.has(fp); }
  isHardwareBlocked(hw: string) { return !!hw && this.blockedHardwareHashes.has(hw); }
  isAdminIp(ip: string) { return this.adminIps.has(ip); }
  isAdminFp(fp: string) { return !!fp && this.adminFps.has(fp); }

  registerAdminIp(ip: string) { if (!LOCALHOST.has(ip)) this.adminIps.add(ip); }
  registerAdminFp(fp: string) { if (fp) this.adminFps.add(fp); }

  heartbeat(ip: string, fp = "") {
    const now = Date.now();
    if (fp) this.heartbeats.set(`fp:${fp}`, now);
    if (!LOCALHOST.has(ip)) this.heartbeats.set(ip, now);
    if (this.heartbeats.size > 10_000) {
      const cutoff = now - 300_000;
      for (const [k, v] of this.heartbeats) if (v < cutoff) this.heartbeats.delete(k);
    }
  }

  isOnline(ip: string) {
    const v = this.heartbeats.get(ip);
    return !!v && Date.now() - v < 60_000;
  }
  isOnlineFp(fp: string) {
    if (!fp) return false;
    const v = this.heartbeats.get(`fp:${fp}`);
    return !!v && Date.now() - v < 60_000;
  }
  onlineCount(): number {
    // Count unique IPs (not fp:* keys) with active heartbeat
    const cutoff = Date.now() - 60_000;
    let n = 0;
    for (const [k, v] of this.heartbeats) {
      if (k.startsWith("fp:")) continue;
      if (v > cutoff) n++;
    }
    return n;
  }

  getLastIp(fp: string) { return this.fpLastIp.get(fp) ?? ""; }
  setLastIp(fp: string, ip: string) {
    this.fpLastIp.set(fp, ip);
    if (this.fpLastIp.size > 10_000) {
      const arr = Array.from(this.fpLastIp.entries()).slice(-5000);
      this.fpLastIp = new Map(arr);
    }
  }

  trackRequest(ip: string) {
    const now = Date.now();
    let arr = this.reqCounts.get(ip);
    if (!arr) { arr = []; this.reqCounts.set(ip, arr); }
    arr.push(now);
    const cutoff = now - 300_000;
    while (arr.length && arr[0] < cutoff) arr.shift();
  }

  recentRequestCount(ip: string, windowMs: number): number {
    const arr = this.reqCounts.get(ip) ?? [];
    const cutoff = Date.now() - windowMs;
    let n = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] >= cutoff) n++; else break;
    }
    return n;
  }

  getCachedGeo(ip: string): GeoResult | undefined { return this.geoCache.get(ip); }
  setCachedGeo(ip: string, geo: GeoResult) {
    this.geoCache.set(ip, geo);
    if (this.geoCache.size > 10_000) this.geoCache.clear();
  }

  trackProbe(ip: string, path: string): number {
    let set = this.probedPaths.get(ip);
    if (!set) { set = new Set(); this.probedPaths.set(ip, set); }
    set.add(path);
    return set.size;
  }

  trackLoginAttempt(ip: string): number {
    const key = `_login_${ip}`;
    let arr = this.reqCounts.get(key);
    if (!arr) { arr = []; this.reqCounts.set(key, arr); }
    const now = Date.now();
    arr.push(now);
    const cutoff = now - BRUTE_FORCE_WINDOW;
    while (arr.length && arr[0] < cutoff) arr.shift();
    return arr.length;
  }

  // ───── Block / Unblock IP ─────
  async blockIp(ip: string, reason: string, blockedBy: "admin" | "system" = "admin") {
    const geo = this.geoCache.get(ip);
    const reqCount = this.reqCounts.get(ip)?.length ?? 0;
    // Snapshot last 20 log rows
    let snapshot = "";
    try {
      const rows = await db
        .select()
        .from(trafficLogs)
        .where(eq(trafficLogs.ip, ip))
        .orderBy(sql`${trafficLogs.createdAt} desc`)
        .limit(20);
      snapshot = JSON.stringify(rows, null, 2);
    } catch {}
    try {
      await db
        .insert(trafficBlockedIps)
        .values({
          ip,
          reason,
          blockedBy,
          requestCount: reqCount,
          country: geo?.country ?? "",
          isVpn: !!geo?.isVpn,
          logSnapshot: snapshot,
        })
        .onConflictDoUpdate({
          target: trafficBlockedIps.ip,
          set: { reason, blockedBy, requestCount: reqCount, logSnapshot: snapshot },
        });
    } catch (err) {
      console.warn("[blockIp] failed:", err);
    }
    this.blockedIps.add(ip);
  }

  async unblockIp(ip: string) {
    try {
      await db.delete(trafficBlockedIps).where(eq(trafficBlockedIps.ip, ip));
    } catch (err) {
      console.warn("[unblockIp] failed:", err);
    }
    this.blockedIps.delete(ip);
  }

  // ───── Block / Unblock Device ─────
  async blockDevice(
    fpHash: string,
    reason: string,
    blockedBy: "admin" | "system" = "admin",
    components?: Record<string, unknown>
  ) {
    if (!fpHash) return;
    if (this.isAdminFp(fpHash)) {
      throw new Error(
        `Dispositivo ${fpHash.slice(0, 12)}... pertence a um administrador e não pode ser bloqueado`
      );
    }
    let associated = Array.from(this.fpIpMap.get(fpHash) ?? []);
    if (!associated.length) {
      try {
        const rows = await db
          .select({ ip: trafficDeviceIps.ip })
          .from(trafficDeviceIps)
          .where(eq(trafficDeviceIps.fingerprintHash, fpHash));
        associated = rows.map((r) => r.ip);
      } catch {}
    }
    try {
      await db
        .insert(trafficBlockedDevices)
        .values({
          fingerprintHash: fpHash,
          reason,
          blockedBy,
          components: JSON.stringify(components ?? {}),
          associatedIps: JSON.stringify(associated),
        })
        .onConflictDoUpdate({
          target: trafficBlockedDevices.fingerprintHash,
          set: {
            reason,
            blockedBy,
            components: JSON.stringify(components ?? {}),
            associatedIps: JSON.stringify(associated),
          },
        });
    } catch (err) {
      console.warn("[blockDevice] failed:", err);
    }
    for (const ip of associated) {
      if (ip && !this.blockedIps.has(ip) && !this.isAdminIp(ip)) {
        await this.blockIp(ip, `Device bloqueado: ${fpHash.slice(0, 12)}...`, blockedBy);
      }
    }
    this.blockedDevices.add(fpHash);
    if (components) {
      this.blockedFpComponents.set(fpHash, components);
      const hw = typeof components.hardware_hash === "string" ? components.hardware_hash : "";
      if (hw) this.blockedHardwareHashes.add(hw);
    }
  }

  async unblockDevice(fpHash: string) {
    if (!fpHash) return;
    let associated = Array.from(this.fpIpMap.get(fpHash) ?? []);
    if (!associated.length) {
      try {
        const rows = await db
          .select({ associatedIps: trafficBlockedDevices.associatedIps })
          .from(trafficBlockedDevices)
          .where(eq(trafficBlockedDevices.fingerprintHash, fpHash))
          .limit(1);
        if (rows[0]) associated = JSON.parse(rows[0].associatedIps || "[]");
      } catch {}
    }
    try {
      await db
        .delete(trafficBlockedDevices)
        .where(eq(trafficBlockedDevices.fingerprintHash, fpHash));
    } catch (err) {
      console.warn("[unblockDevice] failed:", err);
    }
    for (const ip of associated) await this.unblockIp(ip);
    this.blockedDevices.delete(fpHash);
    const old = this.blockedFpComponents.get(fpHash);
    this.blockedFpComponents.delete(fpHash);
    if (old?.hardware_hash && typeof old.hardware_hash === "string") {
      this.blockedHardwareHashes.delete(old.hardware_hash);
    }
    this.fpIpMap.delete(fpHash);
  }

  // ───── Update reason for a blocked device ─────
  async updateDeviceReason(fpHash: string, reason: string) {
    try {
      await db
        .update(trafficBlockedDevices)
        .set({ reason })
        .where(eq(trafficBlockedDevices.fingerprintHash, fpHash));
    } catch (err) {
      console.warn("[updateDeviceReason] failed:", err);
    }
  }

  // ───── Fuzzy fingerprint matching ─────
  fuzzyMatchScore(a: Record<string, unknown>, b: Record<string, unknown>): number {
    let score = 0;
    for (const [key, weight] of Object.entries(FP_WEIGHTS)) {
      const va = a[key], vb = b[key];
      if (!va || !vb) continue;
      if (String(va) === String(vb)) score += weight;
    }
    return score;
  }

  async registerFingerprint(
    ip: string,
    fpHash: string,
    components: Record<string, unknown>
  ): Promise<boolean> {
    if (!fpHash) return false;
    if (this.blockedDevices.has(fpHash)) return true;

    const hw = typeof components.hardware_hash === "string" ? components.hardware_hash : "";
    if (hw && this.blockedHardwareHashes.has(hw)) {
      await this.blockDevice(
        fpHash,
        `Auto: hardware match (${hw.slice(0, 12)}...)`,
        "system",
        components
      );
      if (ip && !this.blockedIps.has(ip)) {
        await this.blockIp(ip, `Auto: hardware bloqueado (${hw.slice(0, 12)}...)`, "system");
      }
      return true;
    }

    for (const [blockedHash, blockedComps] of this.blockedFpComponents) {
      const score = this.fuzzyMatchScore(components, blockedComps);
      if (score >= FP_MATCH_THRESHOLD) {
        await this.blockDevice(
          fpHash,
          `Auto: fuzzy match (${score}%) com ${blockedHash.slice(0, 12)}...`,
          "system",
          components
        );
        if (ip && !this.blockedIps.has(ip)) {
          await this.blockIp(ip, `Auto: device bloqueado (${fpHash.slice(0, 12)}...)`, "system");
        }
        return true;
      }
    }

    if (ip) {
      if (!this.fpIpMap.has(fpHash)) this.fpIpMap.set(fpHash, new Set());
      this.fpIpMap.get(fpHash)!.add(ip);
    }
    return false;
  }

  // ───── Persist fingerprint→IP association ─────
  async upsertDeviceIp(fpHash: string, ip: string, geo?: GeoResult) {
    if (!fpHash || !ip) return;
    if (!this.fpIpMap.has(fpHash)) this.fpIpMap.set(fpHash, new Set());
    this.fpIpMap.get(fpHash)!.add(ip);
    try {
      const existing = await db
        .select({ id: trafficDeviceIps.id })
        .from(trafficDeviceIps)
        .where(sql`${trafficDeviceIps.fingerprintHash} = ${fpHash} AND ${trafficDeviceIps.ip} = ${ip}`)
        .limit(1);
      if (existing[0]) {
        await db
          .update(trafficDeviceIps)
          .set({ lastSeenAt: sql`(datetime('now'))`, isVpn: !!geo?.isVpn })
          .where(eq(trafficDeviceIps.id, existing[0].id));
      } else {
        await db.insert(trafficDeviceIps).values({
          fingerprintHash: fpHash,
          ip,
          isVpn: !!geo?.isVpn,
        });
      }
    } catch {}
  }

  // ───── Insert traffic_logs + traffic_suspicious ─────
  async logRequest(args: {
    ip: string;
    method: string;
    path: string;
    statusCode: number;
    userAgent: string;
    responseTimeMs: number;
    fingerprintHash?: string;
    geo?: GeoResult;
  }) {
    const { ip, method, path, statusCode, userAgent, responseTimeMs, fingerprintHash = "", geo } = args;
    if (LOCALHOST.has(ip)) return;
    this.heartbeats.set(ip, Date.now());
    this.trackRequest(ip);
    try {
      await db.insert(trafficLogs).values({
        ip,
        method,
        path,
        statusCode,
        userAgent: (userAgent || "").slice(0, 500),
        country: geo?.country ?? "",
        city: geo?.city ?? "",
        isVpn: !!geo?.isVpn,
        vpnProvider: geo?.provider ?? "",
        responseTimeMs,
        fingerprintHash,
      });
    } catch {}
    if (fingerprintHash) await this.upsertDeviceIp(fingerprintHash, ip, geo);
    await this.detectSuspicious({ ip, method, path, userAgent, geo, fingerprintHash });
  }

  // ───── Threat detection ─────
  private async detectSuspicious(args: {
    ip: string;
    method: string;
    path: string;
    userAgent: string;
    geo?: GeoResult;
    fingerprintHash: string;
  }) {
    const { ip, method, path, userAgent, geo, fingerprintHash } = args;
    if (isInfraIp(ip)) return;
    if (method === "PAGE") return;
    // Administrators never trigger threat events.
    if (this.isAdminIp(ip) || (fingerprintHash && this.isAdminFp(fingerprintHash))) return;

    type Evt = {
      event: string;
      severity: "low" | "medium" | "high" | "critical";
      details: string;
      autoBlock: boolean;
    };
    const events: Evt[] = [];
    const pathLower = path.toLowerCase();
    const uaLower = (userAgent || "").toLowerCase();

    // 1. Rate limit
    const recent = this.recentRequestCount(ip, RATE_LIMIT_WINDOW);
    if (recent > RATE_LIMIT_MAX) {
      events.push({
        event: "rate_limit",
        severity: "high",
        details: `${recent} requests em 60s (limite: ${RATE_LIMIT_MAX})`,
        autoBlock: recent > RATE_LIMIT_AUTOBLOCK,
      });
    }
    // 2. Scanner UA
    for (const s of SCANNER_AGENTS) {
      if (uaLower.includes(s)) {
        events.push({
          event: "scanner",
          severity: "high",
          details: `Scanner detetado: ${s}`,
          autoBlock: false,
        });
        break;
      }
    }
    // 3. SQL injection
    const check = pathLower + " " + uaLower;
    for (const p of SQL_PATTERNS) {
      if (check.includes(p)) {
        events.push({
          event: "sql_injection",
          severity: "critical",
          details: `Padrão SQL injection detetado: ${p}`,
          autoBlock: true,
        });
        break;
      }
    }
    // 4. Path traversal patterns
    for (const p of PATH_TRAVERSAL) {
      if (pathLower.includes(p)) {
        events.push({
          event: "path_traversal",
          severity: "high",
          details: `Tentativa de path traversal: ${p}`,
          autoBlock: false,
        });
        break;
      }
    }
    // 4b. Path traversal targets (decoded)
    let decoded = pathLower;
    try { decoded = decodeURIComponent(decodeURIComponent(pathLower)); } catch {}
    for (const t of PATH_TRAVERSAL_TARGETS) {
      if (decoded.includes(t)) {
        events.push({
          event: "path_traversal",
          severity: "high",
          details: `Acesso a ficheiro sensível: ${t}`,
          autoBlock: false,
        });
        break;
      }
    }
    // 5. Brute force (login endpoints)
    if (
      method === "POST" &&
      ["/login", "/auth/", "/signin", "/send-code", "/verify"].some((p) => path.includes(p))
    ) {
      const n = this.trackLoginAttempt(ip);
      if (n > BRUTE_FORCE_MAX) {
        events.push({
          event: "brute_force",
          severity: "critical",
          details: `${n} tentativas de login em 5 minutos`,
          autoBlock: true,
        });
      }
    }
    // 6. Recon probes
    for (const susp of SUSPICIOUS_PATHS) {
      if (pathLower.includes(susp)) {
        const unique = this.trackProbe(ip, pathLower);
        events.push({
          event: "recon_probe",
          severity: unique < 5 ? "medium" : "high",
          details: `Path suspeito: ${susp} (${unique} paths únicos sondados)`,
          autoBlock: unique >= 5,
        });
        break;
      }
    }
    // 7. Empty / suspicious UA
    if (
      !userAgent ||
      userAgent.trim() === "" ||
      (userAgent.length < 10 && !userAgent.includes(" "))
    ) {
      if (!["/", "/health", "/favicon.ico", "/robots.txt"].includes(pathLower)) {
        events.push({
          event: "suspicious_ua",
          severity: "low",
          details: `User-Agent suspeito: '${userAgent || "(vazio)"}' em ${path}`,
          autoBlock: false,
        });
      }
    }

    for (const e of events) {
      try {
        await db.insert(trafficSuspicious).values({
          ip,
          event: e.event,
          severity: e.severity,
          details: e.details,
          path,
          country: geo?.country ?? "",
          city: geo?.city ?? "",
          isVpn: !!geo?.isVpn,
          fingerprintHash,
          autoBlocked: e.autoBlock,
        });
      } catch {}
      if (e.autoBlock && !this.blockedIps.has(ip) && !this.isAdminIp(ip)) {
        await this.blockIp(ip, `Auto: ${e.event}`, "system");
      }
    }
  }

  // ───── Geo / VPN lookup (caches in trafficVpnCache table) ─────
  async geoLookup(ip: string): Promise<GeoResult> {
    if (LOCALHOST.has(ip) || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return { country: "Local", city: "", isVpn: false, provider: "" };
    }
    const mem = this.geoCache.get(ip);
    if (mem) return mem;
    try {
      const row = await db
        .select()
        .from(trafficVpnCache)
        .where(eq(trafficVpnCache.ip, ip))
        .limit(1)
        .get();
      if (row) {
        const result: GeoResult = {
          country: row.country,
          city: row.city,
          isVpn: row.isVpn,
          provider: row.provider,
        };
        this.geoCache.set(ip, result);
        return result;
      }
    } catch {}
    // External lookup: ip-api.com (free, 45 req/min/IP). Fire-and-forget cache on success.
    // NB: the free tier does NOT include the `proxy`/`hosting` boolean fields
    // (Pro-only), so we still request them but fall back to a heuristic based
    // on the ISP / org / AS strings to detect VPNs and datacenter hosts.
    try {
      const r = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,proxy,hosting,isp,org,as`,
        { signal: AbortSignal.timeout(3_000) }
      );
      if (r.ok) {
        const d = (await r.json()) as {
          status?: string;
          country?: string;
          city?: string;
          proxy?: boolean;
          hosting?: boolean;
          isp?: string;
          org?: string;
          as?: string;
        };
        if (d.status === "success") {
          const heur = classifyVpn(d.isp, d.org, d.as);
          const isVpn = !!d.proxy || !!d.hosting || heur.isVpn;
          const provider = isVpn
            ? heur.provider || d.isp || d.org || ""
            : "";
          const result: GeoResult = {
            country: d.country ?? "Desconhecido",
            city: d.city ?? "",
            isVpn,
            provider,
          };
          this.geoCache.set(ip, result);
          try {
            await db
              .insert(trafficVpnCache)
              .values({
                ip,
                isVpn: result.isVpn,
                provider: result.provider,
                country: result.country,
                city: result.city,
              })
              .onConflictDoUpdate({
                target: trafficVpnCache.ip,
                set: {
                  isVpn: result.isVpn,
                  provider: result.provider,
                  country: result.country,
                  city: result.city,
                  cachedAt: sql`(datetime('now'))`,
                },
              });
          } catch {}
          return result;
        }
      }
    } catch {}
    return { country: "Desconhecido", city: "", isVpn: false, provider: "" };
  }
}

export type GeoResult = {
  country: string;
  city: string;
  isVpn: boolean;
  provider: string;
};

// Module-level singleton.
let _instance: TrafficServiceImpl | null = null;
export function trafficService(): TrafficServiceImpl {
  if (!_instance) _instance = new TrafficServiceImpl();
  return _instance;
}
