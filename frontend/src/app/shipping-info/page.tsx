"use client";

import { Truck, Clock, Globe, Package, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ShippingInfoPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.shippingPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.shippingPage.subtitle}
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t.shippingPage.optionsTitle}</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-card/80">
              <tr className="border-b border-border/40">
                <th className="px-6 py-4 text-left font-semibold">{t.shippingPage.method}</th>
                <th className="px-6 py-4 text-left font-semibold">{t.shippingPage.deliveryTime}</th>
                <th className="px-6 py-4 text-left font-semibold">{t.shippingPage.cost}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> {t.shippingPage.standard}</span></td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.standardTime}</td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.standardCost}</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> {t.shippingPage.express}</span></td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.expressTime}</td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.expressCost}</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {t.shippingPage.nextDay}</span></td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.nextDayTime}</td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.nextDayCost}</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> {t.shippingPage.international}</span></td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.internationalTime}</td>
                <td className="px-6 py-4 text-muted-foreground">{t.shippingPage.internationalCost}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.shippingPage.processingTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.shippingPage.processingContent}</p>
      </div>

      <div className="mb-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.shippingPage.internationalTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.shippingPage.internationalContent}</p>
      </div>

      <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">{t.shippingPage.notesTitle}</p>
            <p>{t.shippingPage.notesContent}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
