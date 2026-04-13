"use client";

import { Leaf, Recycle, Droplets, Wind, Package, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SustainabilityPage() {
  const { t } = useI18n();

  const pillars = [
    { icon: Leaf, title: t.sustainPage.ethicalSourcing, desc: t.sustainPage.ethicalSourcingDesc },
    { icon: Recycle, title: t.sustainPage.circularFashion, desc: t.sustainPage.circularFashionDesc },
    { icon: Droplets, title: t.sustainPage.waterConservation, desc: t.sustainPage.waterConservationDesc },
    { icon: Wind, title: t.sustainPage.carbonNeutral, desc: t.sustainPage.carbonNeutralDesc },
    { icon: Package, title: t.sustainPage.ecoPackaging, desc: t.sustainPage.ecoPackagingDesc },
    { icon: Heart, title: t.sustainPage.communityImpact, desc: t.sustainPage.communityImpactDesc },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.sustainPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.sustainPage.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-lg border border-border/40 bg-card/50 p-8 mb-16">
        {[
          { value: t.sustainPage.stat1Value, label: t.sustainPage.stat1Label },
          { value: t.sustainPage.stat2Value, label: t.sustainPage.stat2Label },
          { value: t.sustainPage.stat3Value, label: t.sustainPage.stat3Label },
          { value: t.sustainPage.stat4Value, label: t.sustainPage.stat4Label },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-center mb-10">{t.sustainPage.pillarsTitle}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {pillars.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-2xl font-bold mb-8 text-center">{t.sustainPage.roadmapTitle}</h2>
        <div className="space-y-6">
          {[
            { year: t.sustainPage.year2024, milestone: t.sustainPage.year2024Desc },
            { year: t.sustainPage.year2025, milestone: t.sustainPage.year2025Desc },
            { year: t.sustainPage.year2026, milestone: t.sustainPage.year2026Desc },
            { year: t.sustainPage.year2027, milestone: t.sustainPage.year2027Desc },
            { year: t.sustainPage.year2030, milestone: t.sustainPage.year2030Desc },
          ].map(({ year, milestone }) => (
            <div key={year} className="flex gap-4">
              <span className="text-primary font-bold text-sm w-12 shrink-0 pt-0.5">{year}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
