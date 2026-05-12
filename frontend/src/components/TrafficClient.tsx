"use client";

/**
 * Painel de Segurança — client-side traffic hooks.
 *
 * - Sends a visit beacon on every route change.
 * - Heartbeats every 30s to keep online status.
 * - Admin heartbeats every 20s when the path starts with /admin.
 * - Registers a lightweight fingerprint (hash of common navigator props)
 *   on first mount. We avoid pulling FingerprintJS into the bundle —
 *   the backend's fuzzy matching tolerates partial component sets.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const FP_KEY = "lk_fp";
const HWFP_KEY = "lk_hwfp";

// Note: the block state is held in HttpOnly cookies (`lk_dev` + `lk_blk`)
// set by the backend via Set-Cookie. The client cannot read or forge them.
// Deleting them in DevTools merely strips identity; on the next mount the
// backend's fuzzy matching re-applies the block via the hardware hash.

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

async function buildFingerprint(): Promise<{ hash: string; hardwareHash: string; components: Record<string, unknown> }> {
  const nav = navigator;
  const scr = window.screen;
  const components: Record<string, unknown> = {
    user_agent: nav.userAgent,
    platform: safe(() => nav.platform, ""),
    language: nav.language,
    languages: nav.languages?.join(",") ?? "",
    timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone, ""),
    screen: `${scr.width}x${scr.height}x${scr.colorDepth}`,
    device_pixel_ratio: window.devicePixelRatio,
    hardware_concurrency: nav.hardwareConcurrency ?? 0,
    // @ts-expect-error — deviceMemory is non-standard
    device_memory: nav.deviceMemory ?? 0,
    touch_points: nav.maxTouchPoints ?? 0,
  };
  // Canvas
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 30);
      ctx.fillStyle = "#069";
      ctx.fillText("Lunark fp 🛡️", 2, 15);
      components.canvas = await sha256Hex(canvas.toDataURL());
    }
  } catch {}
  // WebGL
  try {
    const gl = (document.createElement("canvas").getContext("webgl") ||
      document.createElement("canvas").getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      components.webgl_vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : "";
      components.webgl_renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "";
    }
  } catch {}

  const hash = await sha256Hex(JSON.stringify(components));
  const hwParts = [
    components.platform, components.hardware_concurrency,
    components.device_memory, components.screen, components.touch_points,
    components.webgl_vendor, components.webgl_renderer,
  ].join("|");
  const hardwareHash = await sha256Hex(hwParts);
  return { hash, hardwareHash, components };
}

export default function TrafficClient() {
  const pathname = usePathname();
  const { data: session, status, update: updateSession } = useSession();
  const fpRef = useRef<string>("");
  const hwfpRef = useRef<string>("");
  const registered = useRef(false);

  // Bootstrap fingerprint
  useEffect(() => {
    (async () => {
      try {
        let fp = localStorage.getItem(FP_KEY) ?? "";
        let hwfp = localStorage.getItem(HWFP_KEY) ?? "";
        let components: Record<string, unknown> | null = null;
        if (!fp) {
          const built = await buildFingerprint();
          fp = built.hash; hwfp = built.hardwareHash;
          components = built.components;
          localStorage.setItem(FP_KEY, fp);
          localStorage.setItem(HWFP_KEY, hwfp);
        }
        fpRef.current = fp;
        hwfpRef.current = hwfp;
        if (!registered.current) {
          registered.current = true;
          fetch(`${API_URL}/traffic/register-fingerprint`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-fp": fp, "x-hwfp": hwfp },
            body: JSON.stringify({
              hash: fp,
              hardwareHash: hwfp,
              components: components ?? {},
            }),
            keepalive: true,
            credentials: "include", // Required so the backend can Set-Cookie HttpOnly tokens.
          }).then((r) => r.json()).then((d) => {
            if (d?.blocked) {
              // Backend already set lk_blk HttpOnly; just navigate.
              window.location.href = "/blocked";
            }
          }).catch(() => {});
        }
      } catch {}
    })();
  }, []);

  // Visit beacon on route change
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/blocked")) return;
    const fp = fpRef.current || localStorage.getItem(FP_KEY) || "";
    const hwfp = hwfpRef.current || localStorage.getItem(HWFP_KEY) || "";
    fetch(`${API_URL}/traffic/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fp": fp, "x-hwfp": hwfp },
      body: JSON.stringify({ page: pathname, fp, ua: navigator.userAgent }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  // Heartbeat every 30s
  useEffect(() => {
    const tick = () => {
      const fp = fpRef.current || localStorage.getItem(FP_KEY) || "";
      const hwfp = hwfpRef.current || localStorage.getItem(HWFP_KEY) || "";
      fetch(`${API_URL}/traffic/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fp": fp, "x-hwfp": hwfp },
        body: JSON.stringify({ fp }),
        keepalive: true,
      }).catch(() => {});
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Admin heartbeat: fires immediately whenever the user is authenticated as
  // admin (independent of pathname) so the backend tags this IP+FP as admin
  // ASAP — protecting it from any auto-block heuristic the moment we log in.
  useEffect(() => {
    if (status !== "authenticated") return;
    const userId = session?.user?.id;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") return;
    const tick = () => {
      const fp = fpRef.current || localStorage.getItem(FP_KEY) || "";
      fetch(`${API_URL}/traffic/admin-heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-fp": fp,
        },
        body: JSON.stringify({ fp }),
        keepalive: true,
      }).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [status, session?.user?.id, session?.user]);

  // Account-status poll: if the authenticated user gets banned or deleted by
  // an admin, log them out within ~20s and bounce them back to the home page.
  // This works on EVERY page because TrafficClient is mounted globally — it
  // does not depend on the NextAuth middleware matcher.
  //
  // This is the SAFETY NET. The primary mechanism is the SSE stream below
  // which fires in <1s. We keep this poll because:
  //   1. The SSE stream may drop (proxies, sleep, offline) and the client
  //      auto-reconnects — between the drop and reconnect, this poll catches
  //      anything that happened in that window.
  //   2. If the backend SSE endpoint is ever unreachable but /account-status
  //      still works, the system degrades gracefully.
  useEffect(() => {
    if (status !== "authenticated") return;
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `${API_URL}/auth/account-status?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json() as { exists?: boolean; banned?: boolean };
        if (!data.exists || data.banned) {
          await signOut({ redirect: false });
          window.location.href = "/";
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [status, session?.user?.id]);

  // ─── REAL-TIME ACCOUNT EVENTS (sub-second logout) ─────────────────────
  // Opens a Server-Sent Events stream to /auth/account-events. The backend
  // pushes `banned` / `deleted` / `unbanned` / `renamed` events the moment
  // an admin acts on the account. EventSource auto-reconnects on drops.
  useEffect(() => {
    if (status !== "authenticated") return;
    const userId = session?.user?.id;
    if (!userId) return;

    const url = `${API_URL}/auth/account-events?userId=${encodeURIComponent(userId)}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
    } catch {
      return; // EventSource unsupported — the poll above handles it.
    }

    const forceLogout = async () => {
      try { await signOut({ redirect: false }); } catch {}
      window.location.href = "/";
    };

    es.addEventListener("banned", () => { void forceLogout(); });
    es.addEventListener("deleted", () => { void forceLogout(); });
    es.addEventListener("renamed", (e: MessageEvent) => {
      // Live-update the NextAuth session in-place. No page reload, no
      // redirect — the new name appears on the next React render anywhere
      // session.user.name is read (Navbar, /profile, etc.).
      try {
        const data = JSON.parse(e.data) as { newName?: string };
        if (data.newName) {
          void updateSession({ user: { name: data.newName } } as never);
        }
      } catch {}
    });
    // unbanned + ping + connected: silent.

    return () => { es?.close(); };
  }, [status, session?.user?.id, updateSession]);

  // ─── REAL-TIME DEVICE BLOCK (instant /blocked navigation) ─────────────
  // Independent of any logged-in user. As soon as an admin (or the auto-
  // block heuristic) blocks this fingerprint, the backend pushes a
  // `blocked` event and we navigate to /blocked from whatever page the
  // user is currently on — no refresh required.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let es: EventSource | null = null;
    let cancelled = false;

    const open = (fp: string) => {
      if (cancelled || !fp) return;
      const url = `${API_URL}/traffic/device-events?fp=${encodeURIComponent(fp)}`;
      try {
        es = new EventSource(url, { withCredentials: true } as EventSourceInit);
      } catch {
        return;
      }
      es.addEventListener("blocked", () => {
        if (!window.location.pathname.startsWith("/blocked")) {
          window.location.href = "/blocked";
        }
      });
      // unblocked / ping / connected: silent.
    };

    // Wait briefly for the fingerprint bootstrap effect to populate ref/storage.
    const attempt = () => {
      const fp = fpRef.current || localStorage.getItem(FP_KEY) || "";
      if (fp) { open(fp); return true; }
      return false;
    };
    if (!attempt()) {
      const id = setInterval(() => {
        if (attempt()) clearInterval(id);
      }, 300);
      // Stop trying after 10s.
      setTimeout(() => clearInterval(id), 10_000);
    }

    return () => { cancelled = true; es?.close(); };
  }, []);

  return null;
}
