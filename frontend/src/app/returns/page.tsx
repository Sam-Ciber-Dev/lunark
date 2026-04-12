"use client";

import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReturnsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Returns & Refunds</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Not 100% happy? No problem. We make returns simple and hassle-free.
        </p>
      </div>

      {/* Key Info */}
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Clock, title: "30-Day Returns", desc: "Return any unworn item within 30 days of delivery for a full refund." },
          { icon: RotateCcw, title: "Free Returns (EU)", desc: "Free return shipping on all orders within the European Union." },
          { icon: CheckCircle, title: "Quick Refunds", desc: "Refunds are processed within 5–7 business days after we receive your return." },
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

      {/* Return Policy */}
      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Return Policy</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>We accept returns within <strong className="text-foreground">30 days</strong> of the delivery date. Items must be in their original condition — unworn, unwashed, with all tags still attached.</p>
            <p>Sale items and items marked as „Final Sale" are eligible for store credit or exchange only, not a cash refund.</p>
            <p>Gift cards, swimwear, underwear, earrings, and personalised items cannot be returned for hygiene reasons.</p>
          </div>
        </div>

        {/* How to Return */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">How to Return an Item</h2>
          <ol className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">1</span>
              <span><strong className="text-foreground">Log into your account</strong> and go to „My Orders". Select the order containing the item(s) you wish to return and click „Request Return".</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">2</span>
              <span><strong className="text-foreground">Select the item(s)</strong> you wish to return and choose your reason. This helps us improve our products and service.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">3</span>
              <span><strong className="text-foreground">Print the return label</strong> (EU orders get a prepaid label). Pack the item securely in its original packaging if possible.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">4</span>
              <span><strong className="text-foreground">Drop off at your nearest post office</strong> or schedule a pickup. Keep the tracking receipt until your refund is processed.</span>
            </li>
          </ol>
        </div>

        {/* Refund Info */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Refund Information</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Once we receive and inspect your return, we&apos;ll send you an email confirming your refund.</p>
            <p>Refunds are processed to the <strong className="text-foreground">original payment method</strong> within 5–7 business days. Depending on your bank, it may take an additional 3–5 days to appear on your statement.</p>
            <p>Shipping costs are non-refundable unless the return is due to our error (wrong item, defective product, etc.).</p>
            <p>For exchanges, we&apos;ll ship the replacement item once we receive the original. If the new item has a different price, we&apos;ll charge or refund the difference.</p>
          </div>
        </div>

        {/* Non-returnable */}
        <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm mb-2">Non-Returnable Items</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Swimwear and underwear (hygiene reasons)</li>
                <li>Earrings and pierced jewelry (hygiene reasons)</li>
                <li>Personalised or customised items</li>
                <li>Gift cards</li>
                <li>Items marked as „Final Sale"</li>
                <li>Items returned after 30 days from delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">Need help with a return?</p>
        <Link href="/contact" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Contact Support
        </Link>
      </div>
    </section>
  );
}
