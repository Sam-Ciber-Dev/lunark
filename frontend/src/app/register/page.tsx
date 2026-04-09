"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.auth.registering : t.auth.register}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, action] = useFormState(registerAction, undefined);
  const { t } = useI18n();

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-20 sm:px-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">{t.auth.register}</h1>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <form action={action} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder={t.auth.name}
          required
          minLength={2}
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder={t.auth.email}
          required
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder={t.auth.password}
          required
          minLength={8}
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </section>
  );
}
