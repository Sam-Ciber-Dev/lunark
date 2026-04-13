"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, forgotPasswordAction, resetPasswordAction, googleSignInSessionAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/Turnstile";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check, X } from "lucide-react";

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
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [localLoginError, setLocalLoginError] = useState<string | null>(null);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<"code" | "newpass" | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Translate error codes from backend
  function translateError(error: string): React.ReactNode {
    switch (error) {
      case "NO_ACCOUNT":
        return (
          <span>
            {t.auth.noAccountClickHere}{" "}
            <Link href="/register" className="text-primary underline font-medium">{t.auth.clickHere}</Link>{" "}
            {t.auth.createOne}
          </span>
        );
      case "WRONG_CREDENTIALS":
        return t.auth.wrongCredentials;
      case "RATE_LIMITED":
        return t.auth.tooManyRequests;
      case "Captcha verification failed":
        return t.auth.captchaFailed;
      default:
        return error;
    }
  }

  // Determine if this is a "forgot password trigger" error
  const showForgotLink = localLoginError === "WRONG_CREDENTIALS";

  // Sync loginState error → local error + reset Turnstile for retry
  useEffect(() => {
    if (loginState?.error) {
      setLocalLoginError(loginState.error);
      setTurnstileToken("");
      setTurnstileResetKey(k => k + 1);
    }
  }, [loginState]);

  // Handle login success → redirect
  useEffect(() => {
    if (loginState?.success) {
      window.location.href = "/";
    }
  }, [loginState]);

  // Forgot password: send code directly (email already known from login form)
  const handleForgotSendCode = async () => {
    setLocalLoginError(null);
    setForgotEmail(loginEmail);
    setForgotPending(true);
    setForgotError(null);
    setForgotStep("code");
    const result = await forgotPasswordAction(loginEmail);
    setForgotPending(false);
    if (result.error) {
      setForgotError(result.error);
    }
  };

  // Forgot password: verify code
  const handleForgotVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    // Move to new password step — actual code verification happens on submit
    setForgotStep("newpass");
  };

  // Forgot password: reset password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError(t.auth.passwordsMismatch);
      return;
    }
    if (forgotNewPass.length < 8 || !/[A-Z]/.test(forgotNewPass) || !/[a-z]/.test(forgotNewPass) || !/[0-9]/.test(forgotNewPass)) {
      setForgotError(t.auth.minChars);
      return;
    }
    setForgotPending(true);
    setForgotError(null);
    const result = await resetPasswordAction(forgotEmail, forgotCode, forgotNewPass);
    setForgotPending(false);
    if (result.error) {
      setForgotError(result.error === "INVALID_CODE" ? t.auth.invalidCode : result.error);
    } else {
      setForgotSuccess(true);
      setTimeout(() => {
        setForgotStep(null);
        setForgotSuccess(false);
        setForgotEmail("");
        setForgotCode("");
        setForgotNewPass("");
        setForgotConfirmPass("");
        setLocalLoginError(null);
        setTurnstileToken("");
        setTurnstileResetKey(k => k + 1);
      }, 3000);
    }
  };

  // Google Sign-In initialization
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setGoogleError(null);
    try {
      const result = await googleSignInSessionAction(response.credential);
      if (result.error) {
        setGoogleError(result.error);
      } else {
        window.location.href = "/";
        return;
      }
    } catch {
      setGoogleError("Sign-in failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

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
  }, [handleGoogleCallback]);

  // Forgot password screens
  if (forgotStep) {
    return (
      <section className="mx-auto flex max-w-[400px] flex-col gap-6 px-4 py-20 sm:px-6">
        <button
          onClick={() => {
            if (forgotStep === "newpass") setForgotStep("code");
            else { setForgotStep(null); setForgotError(null); setTurnstileToken(""); setTurnstileResetKey(k => k + 1); }
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> {t.common.back}
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.auth.forgotPasswordTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {forgotStep === "code" && <>{t.auth.resetCodeSent} <span className="text-foreground font-medium">{forgotEmail}</span></>}
            {forgotStep === "newpass" && t.auth.newPassword}
          </p>
        </div>

        {forgotSuccess && (
          <p className="rounded-md bg-green-500/10 px-4 py-2 text-sm text-green-500">{t.auth.passwordChanged}</p>
        )}

        {forgotError && (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{forgotError}</p>
        )}

        {forgotStep === "code" && (
          <form onSubmit={handleForgotVerifyCode} className="flex flex-col gap-4">
            <input
              type="text"
              value={forgotCode}
              onChange={(e) => setForgotCode(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder={t.auth.codePlaceholder}
              required
              autoFocus
              className="rounded-md border border-border/40 bg-card px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:border-primary focus:outline-none"
            />
            <Button type="submit" className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
              {t.auth.verifyTitle}
            </Button>
          </form>
        )}

        {forgotStep === "newpass" && (
          <form onSubmit={handleForgotResetPassword} className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showForgotPass ? "text" : "password"}
                value={forgotNewPass}
                onChange={(e) => setForgotNewPass(e.target.value)}
                placeholder={t.auth.newPassword}
                required
                minLength={8}
                className="w-full rounded-md border border-border/40 bg-card pl-10 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button type="button" onClick={() => setShowForgotPass(!showForgotPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showForgotPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password strength indicators */}
            <PasswordStrength password={forgotNewPass} />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showForgotPass ? "text" : "password"}
                value={forgotConfirmPass}
                onChange={(e) => setForgotConfirmPass(e.target.value)}
                placeholder={t.auth.confirmNewPassword}
                required
                minLength={8}
                className="w-full rounded-md border border-border/40 bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="submit" disabled={forgotPending} className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
              {forgotPending ? t.auth.changingPassword : t.auth.changePassword}
            </Button>
          </form>
        )}
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

      <form action={loginFormAction} className="flex flex-col gap-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="email"
            type="email"
            placeholder={t.auth.email}
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
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

        {/* Error message + forgot password — above Turnstile */}
        {(localLoginError || googleError) && (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {translateError(localLoginError ?? googleError ?? "")}
          </p>
        )}

        {showForgotLink && (
          <p className="text-sm text-muted-foreground">
            {t.auth.forgotPassword}{" "}
            <button type="button" onClick={handleForgotSendCode} className="text-primary underline font-medium">
              {t.auth.clickHere}
            </button>
          </p>
        )}

        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <Turnstile key={turnstileResetKey} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

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

/* ─── Password Strength Indicator ─── */
function PasswordStrength({ password }: { password: string }) {
  const { t } = useI18n();
  const rules = [
    { label: t.auth.minChars, met: password.length >= 8 },
    { label: t.auth.oneUppercase, met: /[A-Z]/.test(password) },
    { label: t.auth.oneLowercase, met: /[a-z]/.test(password) },
    { label: t.auth.oneNumber, met: /[0-9]/.test(password) },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {rules.map(({ label, met }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs">
          {met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
          <span className={met ? "text-green-500" : "text-muted-foreground"}>{label}</span>
        </div>
      ))}
    </div>
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
