"use client";

import { CreditCard, Shield, Lock, CircleCheck } from "lucide-react";

const methods = [
  {
    category: "Credit & Debit Cards",
    icon: CreditCard,
    items: [
      { name: "Visa", desc: "Credit, debit, and prepaid cards accepted worldwide." },
      { name: "Mastercard", desc: "Credit, debit, and prepaid cards accepted worldwide." },
      { name: "American Express", desc: "Available in most countries. Some regions may have restrictions." },
      { name: "Maestro", desc: "European debit card network. Supported for EU customers." },
    ],
  },
  {
    category: "Digital Wallets",
    icon: Shield,
    items: [
      { name: "Apple Pay", desc: "Available on Safari (macOS/iOS). Authenticate with Face ID, Touch ID, or passcode." },
      { name: "Google Pay", desc: "Available on Chrome and Android devices. Fast one-tap checkout." },
      { name: "PayPal", desc: "Pay with your PayPal balance, linked bank account, or card. Buyer protection included." },
    ],
  },
  {
    category: "Bank Transfers",
    icon: Lock,
    items: [
      { name: "MB WAY", desc: "Instant payment via your Portuguese bank app. Available for PT customers." },
      { name: "Multibanco", desc: "Generate a reference and pay at an ATM or through your bank's app (Portugal only)." },
      { name: "iDEAL", desc: "Direct bank transfer for Dutch customers. Supported by all major NL banks." },
      { name: "Bancontact", desc: "Belgian debit card and mobile app payment. Instant confirmation." },
      { name: "SEPA Direct Debit", desc: "Direct debit from any EU bank account. Available for subscriptions." },
    ],
  },
  {
    category: "Buy Now, Pay Later",
    icon: CircleCheck,
    items: [
      { name: "Klarna", desc: "Split into 3 interest-free payments, or pay within 30 days. No extra fees." },
      { name: "Afterpay", desc: "Pay in 4 interest-free instalments, every 2 weeks." },
    ],
  },
];

export default function PaymentMethodsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Payment Methods</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We offer a wide range of secure payment options so you can shop with confidence. All transactions are protected with industry-standard encryption.
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
        <h2 className="text-xl font-bold mb-4">Payment Security</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">256-Bit SSL Encryption</p>
              <p>All payment data is encrypted in transit using TLS 1.3 — the same standard used by banks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">PCI DSS Compliant</p>
              <p>Our payment processing meets PCI Data Security Standards. We never store your full card details.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CircleCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">3D Secure Authentication</p>
              <p>Supported for Visa, Mastercard, and Amex. Adds an extra verification step for your protection.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Fraud Protection</p>
              <p>Our system automatically detects and blocks suspicious transactions to keep your account safe.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Currency</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All prices on our site are displayed in <strong className="text-foreground">Euros (€)</strong>. If you pay with a card in a different currency, your bank will convert the amount at their current exchange rate. Some banks may apply a small international transaction fee — check with your bank for details.
        </p>
      </div>
    </section>
  );
}
