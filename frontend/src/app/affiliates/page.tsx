"use client";

import { DollarSign, Share2, TrendingUp, Gift, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AffiliatesPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Affiliate Program</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Earn commissions by sharing Lunark with your audience. Join our affiliate program and turn your influence into income.
        </p>
      </div>

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-8 mb-16">
        {[
          { step: "1", icon: Share2, title: "Share Your Link", desc: "Sign up and get a unique referral link. Share it on your blog, social media, or website." },
          { step: "2", icon: DollarSign, title: "Earn Commission", desc: "Earn up to 12% commission on every sale made through your referral link. No caps, no limits." },
          { step: "3", icon: TrendingUp, title: "Get Paid Monthly", desc: "Track your earnings in real-time. Receive monthly payouts via bank transfer or PayPal." },
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

      {/* Benefits */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Partner With Us</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Up to 12% commission on all sales",
            "30-day cookie window",
            "Real-time reporting dashboard",
            "Dedicated affiliate manager",
            "Exclusive promotional materials",
            "Early access to sales and new drops",
            "No minimum payout threshold",
            "Monthly payouts via PayPal or bank transfer",
            "Custom discount codes for your audience",
            "Performance bonuses for top affiliates",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Commission Tiers</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { tier: "Starter", rate: "8%", req: "0–50 sales/month", perks: "Standard materials, affiliate dashboard" },
            { tier: "Pro", rate: "10%", req: "51–200 sales/month", perks: "Custom codes, priority support, early access" },
            { tier: "Elite", rate: "12%", req: "200+ sales/month", perks: "All Pro perks + performance bonuses, co-branded campaigns" },
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

      {/* CTA */}
      <div className="text-center">
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Gift className="h-4 w-4" /> Apply to Join
        </Link>
        <p className="text-xs text-muted-foreground mt-3">Applications are reviewed within 2 business days.</p>
      </div>
    </section>
  );
}
