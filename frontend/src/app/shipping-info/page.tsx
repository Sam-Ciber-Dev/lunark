"use client";

import { Truck, Clock, Globe, Package, AlertCircle } from "lucide-react";

export default function ShippingInfoPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Shipping Information</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about how we deliver your orders.
        </p>
      </div>

      {/* Shipping Options */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shipping Options</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-card/80">
              <tr className="border-b border-border/40">
                <th className="px-6 py-4 text-left font-semibold">Method</th>
                <th className="px-6 py-4 text-left font-semibold">Delivery Time</th>
                <th className="px-6 py-4 text-left font-semibold">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Standard Shipping</span></td>
                <td className="px-6 py-4 text-muted-foreground">5–8 business days</td>
                <td className="px-6 py-4 text-muted-foreground">Free on orders over €50 / €4.99 under</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Express Shipping</span></td>
                <td className="px-6 py-4 text-muted-foreground">2–4 business days</td>
                <td className="px-6 py-4 text-muted-foreground">€9.99</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Next Day Delivery</span></td>
                <td className="px-6 py-4 text-muted-foreground">1 business day (order before 2 PM)</td>
                <td className="px-6 py-4 text-muted-foreground">€14.99</td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-6 py-4"><span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> International Shipping</span></td>
                <td className="px-6 py-4 text-muted-foreground">7–15 business days</td>
                <td className="px-6 py-4 text-muted-foreground">From €12.99 (varies by destination)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing */}
      <div className="mb-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Order Processing</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Orders are processed within 1–2 business days after payment confirmation. During sales or peak periods, processing may take up to 3 business days.</p>
          <p>You will receive a confirmation email once your order is placed, and a shipping notification with tracking details once your order is dispatched.</p>
          <p>Orders placed on weekends or public holidays will be processed on the next business day.</p>
        </div>
      </div>

      {/* International */}
      <div className="mb-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">International Orders</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>We ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination.</p>
          <p><strong className="text-foreground">Customs & Duties:</strong> International orders may be subject to customs duties, import taxes, and fees imposed by the destination country. These charges are the responsibility of the recipient and are not included in Lunark&apos;s shipping costs.</p>
          <p><strong className="text-foreground">Tracking:</strong> All international shipments include full tracking. You can track your order via the link in your shipping confirmation email or through your account dashboard.</p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">Important Notes</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Delivery times are estimates and may vary during peak seasons or due to unforeseen circumstances.</li>
              <li>We are not responsible for delays caused by customs clearance for international orders.</li>
              <li>Ensure your shipping address is correct. We cannot be held responsible for orders delivered to incorrect addresses provided by the customer.</li>
              <li>P.O. Box addresses may experience longer delivery times.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
