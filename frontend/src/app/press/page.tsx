"use client";

import { Newspaper, Mail } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function PressPage() {
  const { t } = useI18n();

  const pressReleases = [
    { date: t.pressPage.pr1Date, title: t.pressPage.pr1Title, desc: t.pressPage.pr1Desc },
    { date: t.pressPage.pr2Date, title: t.pressPage.pr2Title, desc: t.pressPage.pr2Desc },
    { date: t.pressPage.pr3Date, title: t.pressPage.pr3Title, desc: t.pressPage.pr3Desc },
    { date: t.pressPage.pr4Date, title: t.pressPage.pr4Title, desc: t.pressPage.pr4Desc },
    { date: t.pressPage.pr5Date, title: t.pressPage.pr5Title, desc: t.pressPage.pr5Desc },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.pressPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.pressPage.subtitle}
        </p>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold mb-1">{t.pressPage.mediaInquiries}</h2>
          <p className="text-sm text-muted-foreground">{t.pressPage.mediaInquiriesDesc}</p>
        </div>
        <Link href="/contact" className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
          {t.pressPage.contactPress}
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-8">{t.pressPage.pressReleases}</h2>
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

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">{t.pressPage.brandAssets}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t.pressPage.brandAssetsDesc}</p>
        <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.pressPage.requestMediaKit}
        </Link>
      </div>
    </section>
  );
}
