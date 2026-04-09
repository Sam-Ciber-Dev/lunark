import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sobre" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Sobre a Lunark</h1>
      <p className="text-muted-foreground">
        A Lunark nasceu com a missão de trazer moda moderna e acessível a todos.
        Cada peça é selecionada a pensar em qualidade, estilo e conforto.
      </p>
    </section>
  );
}
