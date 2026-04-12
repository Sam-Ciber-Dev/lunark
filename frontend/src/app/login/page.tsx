"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, resendCodeAction, googleSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/Turnstile";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending} className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
      {pending ? t.auth.loggingIn : t.auth.login}
    </Button>
  );
}

export default function LoginPage() {
  const [loginState, loginFormAction] = useFormState(loginAction, undefined);
  const { t } = useI18n();
  const router = useRouter();
  const { update } = useSession();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [verifyType] = useState<"login">("login");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Handle login state → redirect to verification
  useEffect(() => {
    if (loginState?.requiresVerification && loginState.email) {
      setVerifyEmail(loginState.email);
    }
  }, [loginState]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!verifyEmail || resendCooldown > 0) return;
    await resendCodeAction(verifyEmail, verifyType);
    setResendCooldown(60);
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifyPending(true);
    setVerifyError(null);
    const form = new FormData(e.currentTarget);
    try {
      const result = await signIn("verification-code", {
        email: form.get("email") as string,
        code: form.get("code") as string,
        type: form.get("type") as string,
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        setVerifyError("Invalid or expired code");
        setVerifyPending(false);
      } else {
        await update();
        router.push("/");
      }
    } catch {
      setVerifyError("Invalid or expired code");
      setVerifyPending(false);
    }
  };

  // Google Sign-In initialization
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setGoogleError(null);
    const result = await googleSignInAction(response.credential);
    if (result?.error) {
      setGoogleError(result.error);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || verifyEmail) return;

    function initGoogle() {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: 360,
          text: "signin_with",
          shape: "rectangular",
        });
      }
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    }
  }, [handleGoogleCallback, verifyEmail]);

  // Verification code screen
  if (verifyEmail) {
    return (
      <section className="mx-auto flex max-w-[400px] flex-col gap-6 px-4 py-20 sm:px-6">
        <button
          onClick={() => setVerifyEmail(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> {t.common.back}
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.auth.verifyTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.verifyDesc} <span className="text-foreground font-medium">{verifyEmail}</span>
          </p>
        </div>

        {verifyError && (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{verifyError}</p>
        )}

        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={verifyEmail} />
          <input type="hidden" name="type" value={verifyType} />
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder={t.auth.codePlaceholder}
            required
            autoFocus
            className="rounded-md border border-border/40 bg-card px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:border-primary focus:outline-none"
          />
          <input type="hidden" name="turnstileToken" value={turnstileToken} />
          <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
          <Button type="submit" disabled={verifyPending} className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
            {verifyPending ? "Verifying…" : "Verify Code"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `${t.auth.resendIn} ${resendCooldown}s` : t.auth.resendCode}
          </button>
        </div>
      </section>
    );
  }

  // Login form
  return (
    <section className="mx-auto flex max-w-[400px] flex-col gap-6 px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.login}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
      </div>

      {(loginState?.error || googleError) && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {loginState?.error ?? googleError}
        </p>
      )}

      <form action={loginFormAction} className="flex flex-col gap-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="email"
            type="email"
            placeholder={t.auth.email}
            required
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.password}
            required
            minLength={8}
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

        <LoginSubmitButton />
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-xs text-muted-foreground uppercase">{t.auth.or}</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      {/* Google Sign-In */}
      <div ref={googleBtnRef} className="flex justify-center" />
      {!GOOGLE_CLIENT_ID && (
        <div className="rounded-md border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground">
          Google Sign-In (dev — no client ID configured)
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          {t.auth.createAccount}
        </Link>
      </p>
    </section>
  );
}

// Google Sign-In types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}
