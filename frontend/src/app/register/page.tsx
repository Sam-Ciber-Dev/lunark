"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { registerAction, resendCodeAction, googleGetProfileAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/Turnstile";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft, Check, X } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function RegisterSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
      {pending ? t.auth.registering : t.auth.register}
    </Button>
  );
}

export default function RegisterPage() {
  const [registerState, registerFormAction] = useFormState(registerAction, undefined);
  const { t } = useI18n();
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [verifyType] = useState<"register">("register");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [googleProfile, setGoogleProfile] = useState<{ name: string; email: string } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [passwordValue, setPasswordValue] = useState("");

  // Password strength check
  const passwordValid = passwordValue.length >= 8 && /[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue) && /[0-9]/.test(passwordValue);

  // Translate error codes from backend
  function translateError(error: string): React.ReactNode {
    switch (error) {
      case "PASSWORDS_MISMATCH":
        return t.auth.passwordsMismatch;
      case "RATE_LIMITED":
        return t.auth.tooManyRequests;
      case "This email is already registered":
        return t.auth.emailAlreadyRegistered;
      case "Captcha verification failed":
        return t.auth.captchaFailed;
      default:
        return error;
    }
  }

  // Handle register state → redirect to verification
  useEffect(() => {
    if (registerState?.requiresVerification && registerState.email) {
      setVerifyEmail(registerState.email);
    }
  }, [registerState]);

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

  // Verify code — uses client-side signIn (avoids server action hanging)
  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;
    if (!code || !verifyEmail) return;

    setVerifyPending(true);
    setVerifyError(null);

    try {
      const result = await nextAuthSignIn("verification-code", {
        email: verifyEmail,
        code,
        type: verifyType,
        redirect: false,
      });

      if (result?.error) {
        setVerifyError("INVALID_CODE");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setVerifyError("VERIFICATION_FAILED");
    } finally {
      setVerifyPending(false);
    }
  };

  // Google Sign-Up — get profile and pre-fill form
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setGoogleError(null);
    const result = await googleGetProfileAction(response.credential);
    if (result.error) {
      setGoogleError(result.error);
    } else if (result.profile) {
      setGoogleProfile({ name: result.profile.name, email: result.profile.email });
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || verifyEmail || googleProfile) return;

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
          text: "signup_with",
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
  }, [handleGoogleCallback, verifyEmail, googleProfile]);

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
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {verifyError === "INVALID_CODE" ? t.auth.invalidCode : verifyError === "VERIFICATION_FAILED" ? (t.auth.verificationFailed ?? "Verification failed. Please try again.") : verifyError}
          </p>
        )}

        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
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
          <Button type="submit" disabled={verifyPending} className="w-full h-11 text-sm font-semibold uppercase tracking-wider">
            {verifyPending ? t.auth.verifying : t.auth.verifyButton}
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

  // Register form
  return (
    <section className="mx-auto flex max-w-[400px] flex-col gap-6 px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.register}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.registerSubtitle}</p>
      </div>

      {googleProfile && (
        <div className="rounded-md bg-primary/10 px-4 py-2 text-sm text-primary flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {t.auth.googlePrefilled}
        </div>
      )}

      <form action={registerFormAction} className="flex flex-col gap-4">
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="name"
            type="text"
            placeholder={t.auth.name}
            required
            minLength={2}
            defaultValue={googleProfile?.name ?? ""}
            readOnly={!!googleProfile}
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none read-only:opacity-70"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="email"
            type="email"
            placeholder={t.auth.email}
            required
            defaultValue={googleProfile?.email ?? ""}
            readOnly={!!googleProfile}
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none read-only:opacity-70"
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
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {/* Password strength indicators */}
        {passwordValue.length > 0 && <PasswordStrength password={passwordValue} />}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.confirmPassword}
            required
            minLength={8}
            className="w-full rounded-md border border-border/40 bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Error messages — above Turnstile */}
        {(registerState?.error || googleError) && (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {translateError(registerState?.error ?? googleError ?? "")}
          </p>
        )}

        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        {!googleProfile && (
          <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
        )}

        <RegisterSubmitButton disabled={!passwordValid} />
      </form>

      {/* Divider — only show if not in Google flow */}
      {!googleProfile && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-xs text-muted-foreground uppercase">{t.auth.or}</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Google Sign-Up */}
          <div ref={googleBtnRef} className="flex justify-center" />
          {!GOOGLE_CLIENT_ID && (
            <div className="rounded-md border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground">
              Google Sign-Up (dev — no client ID configured)
            </div>
          )}
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t.auth.signIn}
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
