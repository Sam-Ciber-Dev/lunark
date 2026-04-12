"use client";

import { Newspaper, Mail } from "lucide-react";
import Link from "next/link";

export default function PressPage() {
  const pressReleases = [
    { date: "March 2026", title: "Lunark Expands to 50+ Countries", desc: "Following unprecedented growth, Lunark now ships to over 50 countries worldwide, making accessible luxury fashion available globally." },
    { date: "January 2026", title: "Lunark Launches Sustainability Initiative", desc: "New eco-friendly packaging and carbon-neutral shipping program rolled out across all markets." },
    { date: "October 2025", title: "Lunark Reaches 100K Customers", desc: "A major milestone as Lunark celebrates serving over 100,000 happy customers since launch." },
    { date: "June 2025", title: "Lunark Partners with Top European Manufacturers", desc: "New direct partnerships establish premium quality at accessible price points." },
    { date: "January 2025", title: "Lunark Official Launch", desc: "Lunark launches with a mission to bridge the gap between high-end fashion and everyday affordability." },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Press & Media</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Stay up to date with Lunark&apos;s latest news, announcements, and milestones.
        </p>
      </div>

      {/* Media Contact */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold mb-1">Media Inquiries</h2>
          <p className="text-sm text-muted-foreground">For press inquiries, interviews, or media kits, please contact our communications team.</p>
        </div>
        <Link href="/contact" className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
          Contact Press Team
        </Link>
      </div>

      {/* Press Releases */}
      <h2 className="text-2xl font-bold mb-8">Press Releases</h2>
      <div className="space-y-6">
        {pressReleases.map((pr) => (
          <div key={pr.title} className="rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-1">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-xs text-primary font-medium uppercase tracking-wider">{pr.date}</span>
                <h3 className="text-base font-semibold mt-1 mb-2">{pr.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pr.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Brand Assets */}
      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Brand Assets</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Need Lunark logos, product images, or brand guidelines? Contact our press team and we&apos;ll provide a comprehensive media kit.
        </p>
        <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Request Media Kit
        </Link>
      </div>
    </section>
  );
}
