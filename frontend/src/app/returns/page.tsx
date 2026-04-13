"use client";

import { RotateCcw, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function ReturnsPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.returnsPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.returnsPage.subtitle}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Clock, title: t.returnsPage.thirtyDay, desc: t.returnsPage.thirtyDayDesc },
          { icon: RotateCcw, title: t.returnsPage.freeReturns, desc: t.returnsPage.freeReturnsDesc },
          { icon: CheckCircle, title: t.returnsPage.quickRefunds, desc: t.returnsPage.quickRefundsDesc },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.returnsPage.policyTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.returnsPage.policyContent}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.returnsPage.howToTitle}</h2>
          <ol className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            {[t.returnsPage.step1, t.returnsPage.step2, t.returnsPage.step3, t.returnsPage.step4].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.returnsPage.refundTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.returnsPage.refundContent}</p>
        </div>

        <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm mb-2">{t.returnsPage.nonReturnableTitle}</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {t.returnsPage.nonReturnableItems.split(";").map((item: string) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t.returnsPage.needHelp}</p>
        <Link href="/contact" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.returnsPage.contactSupport}
        </Link>
      </div>
    </section>
  );
}
