import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">About Lunark</h1>
      <div className="space-y-8 text-muted-foreground">
        <p>
          Lunark was born with the mission of bringing modern, accessible
          fashion to everyone. Each piece is selected with quality, style, and
          comfort in mind.
        </p>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Our Mission
          </h2>
          <p>
            We believe that great style shouldn&apos;t come at an unreasonable
            price. Lunark bridges the gap between high-end aesthetics and
            everyday affordability.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Our Story
          </h2>
          <p>
            Founded by fashion enthusiasts who were tired of choosing between
            style and budget, Lunark curates collections that make you feel
            confident without breaking the bank.
          </p>
        </div>
      </div>
    </section>
  );
}
