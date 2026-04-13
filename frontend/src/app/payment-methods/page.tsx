"use client";

import { CreditCard, Shield, Lock, CircleCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PaymentMethodsPage() {
  const { t } = useI18n();

  const methods = [
    {
      category: t.paymentPage.cards,
      icon: CreditCard,
      items: [
        { name: t.paymentPage.visa, desc: t.paymentPage.visaDesc },
        { name: t.paymentPage.mastercard, desc: t.paymentPage.mastercardDesc },
        { name: t.paymentPage.amex, desc: t.paymentPage.amexDesc },
        { name: t.paymentPage.maestro, desc: t.paymentPage.maestroDesc },
      ],
    },
    {
      category: t.paymentPage.digitalWallets,
      icon: Shield,
      items: [
        { name: t.paymentPage.applePay, desc: t.paymentPage.applePayDesc },
        { name: t.paymentPage.googlePay, desc: t.paymentPage.googlePayDesc },
        { name: t.paymentPage.paypal, desc: t.paymentPage.paypalDesc },
      ],
    },
    {
      category: t.paymentPage.bankTransfers,
      icon: Lock,
      items: [
        { name: t.paymentPage.mbway, desc: t.paymentPage.mbwayDesc },
        { name: t.paymentPage.multibanco, desc: t.paymentPage.multibancoDesc },
        { name: t.paymentPage.ideal, desc: t.paymentPage.idealDesc },
        { name: t.paymentPage.bancontact, desc: t.paymentPage.bancontactDesc },
        { name: t.paymentPage.sepa, desc: t.paymentPage.sepaDesc },
      ],
    },
    {
      category: t.paymentPage.bnpl,
      icon: CircleCheck,
      items: [
        { name: t.paymentPage.klarna, desc: t.paymentPage.klarnaDesc },
        { name: t.paymentPage.afterpay, desc: t.paymentPage.afterpayDesc },
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.paymentPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.paymentPage.subtitle}
        </p>
      </div>

      <div className="space-y-8">
        {methods.map(({ category, icon: Icon, items }) => (
          <div key={category} className="rounded-lg border border-border/40 bg-card/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{category}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map(({ name, desc }) => (
                <div key={name} className="rounded-md border border-border/30 p-4">
                  <p className="font-semibold text-sm mb-1">{name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.paymentPage.securityTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">{t.paymentPage.ssl}</p>
              <p>{t.paymentPage.sslDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">{t.paymentPage.pci}</p>
              <p>{t.paymentPage.pciDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CircleCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">{t.paymentPage.threeDSecure}</p>
              <p>{t.paymentPage.threeDSecureDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">{t.paymentPage.fraud}</p>
              <p>{t.paymentPage.fraudDesc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.paymentPage.currencyNote}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.paymentPage.currencyContent}
        </p>
      </div>
    </section>
  );
}
