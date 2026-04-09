import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Contacto</h1>
      <p className="mb-8 text-muted-foreground">
        Tem alguma questão? Envia-nos uma mensagem.
      </p>
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
        <textarea
          rows={5}
          placeholder="Mensagem"
          className="rounded-md border bg-background px-4 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
