"use client";

import { DollarSign, Share2, TrendingUp, Gift, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function AffiliatesPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.affiliatesPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.affiliatesPage.subtitle}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-8 mb-16">
        {[
          { step: "1", icon: Share2, title: t.affiliatesPage.step1, desc: t.affiliatesPage.step1Desc },
          { step: "2", icon: DollarSign, title: t.affiliatesPage.step2, desc: t.affiliatesPage.step2Desc },
          { step: "3", icon: TrendingUp, title: t.affiliatesPage.step3, desc: t.affiliatesPage.step3Desc },
        ].map(({ step, icon: Icon, title, desc }) => (
          <div key={step} className="text-center rounded-lg border border-border/40 bg-card/50 p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-primary font-bold tracking-wider">STEP {step}</span>
            <h3 className="text-lg font-semibold mt-2 mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">{t.affiliatesPage.whyTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            t.affiliatesPage.benefit1,
            t.affiliatesPage.benefit2,
            t.affiliatesPage.benefit3,
            t.affiliatesPage.benefit4,
            t.affiliatesPage.benefit5,
            t.affiliatesPage.benefit6,
            t.affiliatesPage.benefit7,
            t.affiliatesPage.benefit8,
            t.affiliatesPage.benefit9,
            t.affiliatesPage.benefit10,
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">{t.affiliatesPage.tiersTitle}</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { tier: t.affiliatesPage.starterTier, rate: t.affiliatesPage.starterRate, req: t.affiliatesPage.starterReq, perks: t.affiliatesPage.starterPerks },
            { tier: t.affiliatesPage.proTier, rate: t.affiliatesPage.proRate, req: t.affiliatesPage.proReq, perks: t.affiliatesPage.proPerks },
            { tier: t.affiliatesPage.eliteTier, rate: t.affiliatesPage.eliteRate, req: t.affiliatesPage.eliteReq, perks: t.affiliatesPage.elitePerks },
          ].map(({ tier, rate, req, perks }) => (
            <div key={tier} className="text-center rounded-lg border border-border/40 p-6 hover:border-primary/30 transition-colors">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">{tier}</span>
              <p className="text-4xl font-bold mt-2 mb-1">{rate}</p>
              <p className="text-xs text-muted-foreground mb-3">{req}</p>
              <p className="text-sm text-muted-foreground">{perks}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Gift className="h-4 w-4" /> {t.affiliatesPage.applyButton}
        </Link>
        <p className="text-xs text-muted-foreground mt-3">{t.affiliatesPage.applyDesc}</p>
      </div>
    </section>
  );
}
