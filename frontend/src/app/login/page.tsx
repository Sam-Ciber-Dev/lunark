import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-20 sm:px-6">
      <h1 className="text-center text-2xl font-bold">Entrar</h1>
      <form className="flex flex-col gap-4">
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
          Entrar
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Não tens conta?{" "}
        <Link href="/register" className="underline hover:text-foreground">
          Criar conta
        </Link>
      </p>
    </section>
  );
}
