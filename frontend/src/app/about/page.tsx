"use client";

import { Heart, Leaf, Globe, Award, Users, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  const values = [
    { icon: Heart, title: t.about.qualityFirst, desc: t.about.qualityFirstDesc },
    { icon: Leaf, title: t.about.sustainableFashion, desc: t.about.sustainableFashionDesc },
    { icon: Globe, title: t.about.globalReach, desc: t.about.globalReachDesc },
    { icon: Award, title: t.about.fairPricing, desc: t.about.fairPricingDesc },
    { icon: Users, title: t.about.communityDriven, desc: t.about.communityDrivenDesc },
    { icon: Sparkles, title: t.about.alwaysEvolving, desc: t.about.alwaysEvolvingDesc },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.about.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.about.subtitle}
        </p>
      </div>

      {/* Our Story */}
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <h2 className="text-2xl font-bold mb-4">{t.about.ourStory}</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>{t.about.storyP1}</p>
            <p>{t.about.storyP2}</p>
            <p>{t.about.storyP3}</p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">{t.about.ourMission}</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>{t.about.missionP1}</p>
            <p>{t.about.missionP2}</p>
            <p>{t.about.missionP3}</p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">{t.about.ourValues}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-lg border border-border/40 bg-card/50 p-8">
        {[
          { value: "50+", label: t.about.countriesServed },
          { value: "100K+", label: t.about.happyCustomers },
          { value: "5,000+", label: t.about.productsLabel },
          { value: "4.8★", label: t.about.avgRating },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
