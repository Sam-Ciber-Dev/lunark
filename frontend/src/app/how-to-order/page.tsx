"use client";

import { ShoppingBag, CreditCard, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function HowToOrderPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.howToOrder.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.howToOrder.subtitle}
        </p>
      </div>

      <div className="space-y-8">
        {[
          { step: 1, icon: ShoppingBag, title: t.howToOrder.step1Title, desc: t.howToOrder.step1Desc, tips: t.howToOrder.step1Tips.split(";") },
          { step: 2, icon: CreditCard, title: t.howToOrder.step2Title, desc: t.howToOrder.step2Desc, tips: t.howToOrder.step2Tips.split(";") },
          { step: 3, icon: Truck, title: t.howToOrder.step3Title, desc: t.howToOrder.step3Desc, tips: t.howToOrder.step3Tips.split(";") },
          { step: 4, icon: CheckCircle, title: t.howToOrder.step4Title, desc: t.howToOrder.step4Desc, tips: t.howToOrder.step4Tips.split(";") },
        ].map(({ step, icon: Icon, title, desc, tips }) => (
          <div key={step} className="rounded-lg border border-border/40 bg-card/50 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2">
                  <span className="text-primary">Step {step}:</span> {title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-2">
                  {tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.howToOrder.guestVsAccount}</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">{t.howToOrder.guestTitle}</h3>
            <ul className="space-y-1 list-disc list-inside">
              {t.howToOrder.guestItems.split(";").map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">{t.howToOrder.accountTitle}</h3>
            <ul className="space-y-1 list-disc list-inside">
              {t.howToOrder.accountItems.split(";").map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.howToOrder.startShopping}
        </Link>
      </div>
    </section>
  );
}
