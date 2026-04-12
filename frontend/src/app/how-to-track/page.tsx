"use client";

import { Search, Bell } from "lucide-react";
import Link from "next/link";

export default function HowToTrackPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">How to Track Your Order</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay updated on your delivery every step of the way. Here&apos;s how to track your order from dispatch to doorstep.
        </p>
      </div>

      {/* Tracking Methods */}
      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Method 1: Track from Your Account</h2>
              <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
                <li>Log into your Lunark account</li>
                <li>Navigate to <strong className="text-foreground">My Orders</strong></li>
                <li>Find the order you want to track and click <strong className="text-foreground">Track Order</strong></li>
                <li>You&apos;ll see real-time status updates including estimated delivery date</li>
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
              <h2 className="text-lg font-bold mb-2">Method 2: Tracking Email</h2>
              <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
                <li>Once your order ships, we&apos;ll send a <strong className="text-foreground">Shipping Confirmation</strong> email</li>
                <li>The email contains a tracking number and a direct link to the carrier&apos;s tracking page</li>
                <li>Click the link to see live updates from the shipping carrier</li>
                <li>Check your spam folder if you don&apos;t see the email within 24 hours of ordering</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Order Statuses */}
      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-6">Order Status Guide</h2>
        <div className="space-y-4">
          {[
            { status: "Order Placed", color: "bg-blue-500", desc: "We have received your order and it's being processed." },
            { status: "Confirmed", color: "bg-indigo-500", desc: "Payment confirmed. Your order is being prepared." },
            { status: "Processing", color: "bg-yellow-500", desc: "Your items are being picked, packed, and prepared for shipment." },
            { status: "Shipped", color: "bg-orange-500", desc: "Your order has been dispatched. Tracking info is now available." },
            { status: "In Transit", color: "bg-purple-500", desc: "Your package is on its way to the delivery address." },
            { status: "Out for Delivery", color: "bg-emerald-500", desc: "Your package is with the delivery driver and will arrive today." },
            { status: "Delivered", color: "bg-green-600", desc: "Your package has been delivered. Enjoy!" },
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

      {/* FAQ */}
      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Common Tracking Questions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">My tracking hasn&apos;t updated in a while</p>
            <p className="text-muted-foreground">Tracking updates can sometimes be delayed, especially during carrier sorting or customs processing for international orders. If there&apos;s no update after 5 business days, please contact our support team.</p>
          </div>
          <div>
            <p className="font-semibold">It says &ldquo;Delivered&rdquo; but I haven&apos;t received it</p>
            <p className="text-muted-foreground">Check with neighbours, your building reception, or safe places around your property. Carriers sometimes mark parcels as delivered slightly early. If you still can&apos;t find it after 24 hours, contact us and we&apos;ll investigate.</p>
          </div>
          <div>
            <p className="font-semibold">Can I change my delivery address after ordering?</p>
            <p className="text-muted-foreground">If your order hasn&apos;t shipped yet, contact us immediately and we&apos;ll try to update the address. Once shipped, address changes may not be possible depending on the carrier.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/orders" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          View My Orders
        </Link>
        <Link href="/contact" className="inline-flex rounded-md border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
          Contact Support
        </Link>
      </div>
    </section>
  );
}
