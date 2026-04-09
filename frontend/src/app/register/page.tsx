"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "A criar\u2026" : "Criar conta"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, action] = useFormState(registerAction, undefined);

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-20 sm:px-6">
      <h1 className="text-center text-2xl font-bold">Criar conta</h1>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <form action={action} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder="Nome"
          required
          minLength={2}
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Palavra-passe"
          required
          minLength={8}
          className="rounded-md border bg-background px-4 py-2"
        />
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tens conta?{" "}
        <Link href="/login" className="underline hover:text-foreground">
          Entrar
        </Link>
      </p>
    </section>
  );
}
