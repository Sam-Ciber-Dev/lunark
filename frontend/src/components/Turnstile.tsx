"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void; theme?: string }
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
      try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
    }
    ref.current.innerHTML = "";
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: key,
      callback: (token: string) => onVerifyRef.current(token),
      "expired-callback": () => onExpireRef.current?.(),
      theme: "dark",
    });
  }, []);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey || !ref.current) return;

    // If turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget(siteKey);
      return;
    }

    // Load the script if not already present
    let script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }

    // Wait for script to load and turnstile to be available
    const onLoad = () => {
      // Poll briefly in case turnstile isn't immediately available after load
      let attempts = 0;
      const check = () => {
        if (window.turnstile) {
          renderWidget(siteKey);
        } else if (attempts < 20) {
          attempts++;
          setTimeout(check, 100);
        }
      };
      check();
    };

    if (script.dataset.loaded === "true") {
      onLoad();
    } else {
      const handler = () => {
        script!.dataset.loaded = "true";
        onLoad();
      };
      script.addEventListener("load", handler);
      return () => script!.removeEventListener("load", handler);
    }
  }, [renderWidget]);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
        Turnstile (dev mode — sem chave configurada)
      </div>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
