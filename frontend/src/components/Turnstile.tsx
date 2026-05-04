"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: string;
          size?: string;
          appearance?: string;
          language?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Module-level promise so the script is fetched at most once across mounts.
let scriptLoadPromise: Promise<void> | null = null;

function ensureTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );
    if (existing) {
      if (window.turnstile) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  const renderWidget = useCallback((key: string) => {
    if (!ref.current || !window.turnstile) return;
    if (widgetId.current) {
      try {
        window.turnstile.remove(widgetId.current);
      } catch {
        /* ignore */
      }
      widgetId.current = null;
    }
    ref.current.innerHTML = "";
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: key,
      callback: (token: string) => onVerifyRef.current(token),
      "expired-callback": () => onExpireRef.current?.(),
      "error-callback": () => onExpireRef.current?.(),
      theme: "dark",
      size: "flexible",
      language: "auto",
    });
  }, []);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey || !ref.current) return;

    let cancelled = false;

    ensureTurnstileScript().then(() => {
      if (cancelled) return;
      // Tiny poll in case the global is exposed slightly after the load event.
      let attempts = 0;
      const tick = () => {
        if (cancelled) return;
        if (window.turnstile) {
          renderWidget(siteKey);
          return;
        }
        if (attempts++ < 40) setTimeout(tick, 25);
      };
      tick();
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
  }, [renderWidget]);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
        Turnstile (dev mode — sem chave configurada)
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full [&>div]:!w-full [&>iframe]:!w-full" />
  );
}
