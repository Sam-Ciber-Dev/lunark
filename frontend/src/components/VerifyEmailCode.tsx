"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { verifyCodeAction, resendCodeAction } from "@/app/(auth)/actions";

interface VerifyEmailCodeProps {
  email: string;
  type: "login" | "register";
  onBack: () => void;
  onSuccess: () => void;
}

export function VerifyEmailCode({ email, type, onBack, onSuccess }: VerifyEmailCodeProps) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setPending(true);
    setError(null);
    setInfo(null);
    const result = await verifyCodeAction(email, code, type);
    setPending(false);
    if ("error" in result) {
      setError(result.error === "INVALID_CODE" ? t.auth.invalidCode : t.auth.verificationFailed);
      return;
    }
    onSuccess();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setInfo(null);
    const result = await resendCodeAction(email, type);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setInfo(`${t.auth.verifyDesc} ${email}`);
    setResendCooldown(30);
  };

  return (
    <section className="mx-auto flex max-w-[400px] flex-col gap-6 px-4 py-20 sm:px-6">
      <button
        type="button"
        onClick={onBack}
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
          {t.auth.verifyDesc} <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      {info && (
        <p className="rounded-md bg-primary/10 px-4 py-2 text-sm text-primary">{info}</p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder={t.auth.codePlaceholder}
          required
          autoFocus
          className="rounded-md border border-border/40 bg-card px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:border-primary focus:outline-none"
        />
        <Button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full h-11 text-sm font-semibold uppercase tracking-wider"
        >
          {pending ? t.auth.verifying : t.auth.verifyButton}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-primary underline font-medium disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `${t.auth.resendIn} ${resendCooldown}s` : t.auth.resendCode}
        </button>
      </div>
    </section>
  );
}
