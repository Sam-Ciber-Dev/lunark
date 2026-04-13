"use client";

import { Search, Bell } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function HowToTrackPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.howToTrack.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.howToTrack.subtitle}
        </p>
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">{t.howToTrack.method1Title}</h2>
              <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
                {t.howToTrack.method1Steps.split(";").map((step: string) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">{t.howToTrack.method2Title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.howToTrack.method2Content}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-6">{t.howToTrack.statusTitle}</h2>
        <div className="space-y-4">
          {[
            { status: t.howToTrack.statusPlaced, color: "bg-blue-500", desc: t.howToTrack.statusPlacedDesc },
            { status: t.howToTrack.statusConfirmed, color: "bg-indigo-500", desc: t.howToTrack.statusConfirmedDesc },
            { status: t.howToTrack.statusProcessing, color: "bg-yellow-500", desc: t.howToTrack.statusProcessingDesc },
            { status: t.howToTrack.statusShipped, color: "bg-orange-500", desc: t.howToTrack.statusShippedDesc },
            { status: t.howToTrack.statusInTransit, color: "bg-purple-500", desc: t.howToTrack.statusInTransitDesc },
            { status: t.howToTrack.statusOutForDelivery, color: "bg-emerald-500", desc: t.howToTrack.statusOutForDeliveryDesc },
            { status: t.howToTrack.statusDelivered, color: "bg-green-600", desc: t.howToTrack.statusDeliveredDesc },
          ].map(({ status, color, desc }) => (
            <div key={status} className="flex items-start gap-3">
              <div className={`h-3 w-3 rounded-full ${color} shrink-0 mt-1.5`} />
              <div>
                <p className="text-sm font-semibold">{status}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.howToTrack.questionsTitle}</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">{t.howToTrack.trackQ1}</p>
            <p className="text-muted-foreground">{t.howToTrack.trackA1}</p>
          </div>
          <div>
            <p className="font-semibold">{t.howToTrack.trackQ2}</p>
            <p className="text-muted-foreground">{t.howToTrack.trackA2}</p>
          </div>
          <div>
            <p className="font-semibold">{t.howToTrack.trackQ3}</p>
            <p className="text-muted-foreground">{t.howToTrack.trackA3}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/orders" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.howToTrack.viewOrders}
        </Link>
        <Link href="/contact" className="inline-flex rounded-md border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
          {t.howToTrack.contactSupport}
        </Link>
      </div>
    </section>
  );
}
