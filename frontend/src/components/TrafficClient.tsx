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
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const FP_KEY = "lk_fp";
const HWFP_KEY = "lk_hwfp";

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
  const { data: session, status } = useSession();
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
          }).then((r) => r.json()).then((d) => {
            if (d?.blocked) {
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

  // Admin heartbeat every 20s on /admin/*
  useEffect(() => {
    if (status !== "authenticated") return;
    const userId = session?.user?.id;
    if (!userId) return;
    if (!pathname?.startsWith("/admin")) return;
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
  }, [status, session?.user?.id, pathname]);

  return null;
}
