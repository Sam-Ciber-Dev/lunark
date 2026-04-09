import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Criar Conta" };

export default function RegisterPage() {
  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-20 sm:px-6">
      <h1 className="text-center text-2xl font-bold">Criar conta</h1>
      <form className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nome"
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          type="password"
          placeholder="Palavra-passe"
          className="rounded-md border bg-background px-4 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Criar conta
        </button>
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
