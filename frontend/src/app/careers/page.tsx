"use client";

import { Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function CareersPage() {
  const { t } = useI18n();

  const openPositions = [
    { title: t.careersPage.seniorFrontend, dept: t.careersPage.engineering, location: t.careersPage.remoteLisbon, type: t.careersPage.fullTime, desc: t.careersPage.seniorFrontendDesc },
    { title: t.careersPage.uxDesigner, dept: t.careersPage.design, location: t.careersPage.remote, type: t.careersPage.fullTime, desc: t.careersPage.uxDesignerDesc },
    { title: t.careersPage.fashionBuyer, dept: t.careersPage.merchandising, location: t.careersPage.lisbon, type: t.careersPage.fullTime, desc: t.careersPage.fashionBuyerDesc },
    { title: t.careersPage.marketingManager, dept: t.careersPage.marketing, location: t.careersPage.remoteLisbon, type: t.careersPage.fullTime, desc: t.careersPage.marketingManagerDesc },
    { title: t.careersPage.customerSupport, dept: t.careersPage.support, location: t.careersPage.remote, type: t.careersPage.fullTimePartTime, desc: t.careersPage.customerSupportDesc },
    { title: t.careersPage.warehouseLead, dept: t.careersPage.logistics, location: t.careersPage.lisbon, type: t.careersPage.fullTime, desc: t.careersPage.warehouseLeadDesc },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.careersPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.careersPage.subtitle}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { title: t.careersPage.remoteFirst, desc: t.careersPage.remoteFirstDesc },
          { title: t.careersPage.growthCulture, desc: t.careersPage.growthCultureDesc },
          { title: t.careersPage.flexibleHours, desc: t.careersPage.flexibleHoursDesc },
          { title: t.careersPage.greatBenefits, desc: t.careersPage.greatBenefitsDesc },
        ].map(({ title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-8">{t.careersPage.openPositions}</h2>
      <div className="space-y-4">
        {openPositions.map((pos) => (
          <div key={pos.title} className="group rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{pos.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{pos.desc}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {pos.dept}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pos.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pos.type}</span>
                </div>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap self-start">
                {t.careersPage.applyNow} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">{t.careersPage.noRoleTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t.careersPage.noRoleDesc}</p>
        <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.careersPage.getInTouch}
        </Link>
      </div>
    </section>
  );
}
