"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
      reset: (widgetId: string) => void;
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

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !ref.current) return;

    // Load the script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => renderWidget(siteKey);
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget(siteKey);
    }

    function renderWidget(key: string) {
      if (!ref.current || !window.turnstile) return;
      // Clear previous widget
      ref.current.innerHTML = "";
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: key,
        callback: onVerify,
        "expired-callback": onExpire,
      });
    }
  }, [onVerify, onExpire]);

  // If no site key is configured, show a dev placeholder
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
        Turnstile (dev mode — sem chave configurada)
      </div>
    );
  }

  return <div ref={ref} />;
}
