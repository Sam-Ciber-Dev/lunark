import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-32">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Moda com estilo — feita para ti
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Descobre as últimas tendências em roupa moderna e acessível na Lunark.
        </p>
        <Button asChild size="lg">
          <Link href="/shop">
            Explorar loja
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Featured placeholder */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-semibold">Em destaque</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    </>
  );
}
