"use client";

import { Settings, BarChart3, Target, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CookiePolicyPage() {
  const { t } = useI18n();

  const cookieTypes = [
    { icon: Shield, type: t.cookiePage.strictlyNecessary, required: true, desc: t.cookiePage.strictlyNecessaryDesc },
    { icon: Settings, type: t.cookiePage.functional, required: false, desc: t.cookiePage.functionalDesc },
    { icon: BarChart3, type: t.cookiePage.analytics, required: false, desc: t.cookiePage.analyticsDesc },
    { icon: Target, type: t.cookiePage.marketing, required: false, desc: t.cookiePage.marketingDesc },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.cookiePage.title}</h1>
        <p className="text-sm text-muted-foreground">{t.cookiePage.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.cookiePage.whatTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.cookiePage.whatContent}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-6">{t.cookiePage.typesTitle}</h2>
          <div className="space-y-6">
            {cookieTypes.map(({ icon: Icon, type, required, desc }) => (
              <div key={type} className="border border-border/30 rounded-md p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{type}</h3>
                  {required && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">{t.cookiePage.alwaysActive}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.cookiePage.thirdPartyTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.cookiePage.thirdPartyContent}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.cookiePage.managingTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.cookiePage.managingContent}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.cookiePage.rightsTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.cookiePage.rightsContent}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">{t.cookiePage.updatesTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.cookiePage.updatesContent}</p>
        </div>
      </div>
    </section>
  );
}
