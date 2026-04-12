"use client";

import { ShoppingBag, CreditCard, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function HowToOrderPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">How to Order</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ordering from Lunark is quick and easy. Follow these simple steps to get your favourite pieces delivered right to your door.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {[
          {
            step: 1,
            icon: ShoppingBag,
            title: "Browse & Add to Cart",
            desc: "Browse our shop or use the search to find what you love. Select your size and colour, then click „Add to Cart". You can continue shopping and add as many items as you like.",
            tips: [
              "Use filters to narrow by category, size, or price range",
              "Save items to your wishlist by clicking the heart icon",
              "Check the size guide if you're unsure about sizing",
            ],
          },
          {
            step: 2,
            icon: CreditCard,
            title: "Checkout & Payment",
            desc: "When you're ready, go to your cart and click „Checkout". Enter your shipping address and choose a payment method. We accept all major credit and debit cards, PayPal, Apple Pay, Google Pay, and more.",
            tips: [
              "Create an account to save your details for faster checkout next time",
              "Apply any discount codes in the promo field before paying",
              "All payments are processed securely with 256-bit encryption",
            ],
          },
          {
            step: 3,
            icon: Truck,
            title: "Shipping & Delivery",
            desc: "After your order is confirmed, you'll receive an email with your order details. Once shipped, you'll get another email with a tracking link so you can follow your package every step of the way.",
            tips: [
              "Standard delivery: 3–5 business days (EU) / 7–14 days (international)",
              "Express delivery available at checkout for faster shipping",
              "Free shipping on orders over €50 within the EU",
            ],
          },
          {
            step: 4,
            icon: CheckCircle,
            title: "Receive & Enjoy",
            desc: "Your order arrives in our signature packaging. Try everything on, and if something isn't right, you have 30 days to return it — no questions asked.",
            tips: [
              "Inspect your items upon delivery and report any issues immediately",
              "Keep your receipt and tags attached if you might return an item",
              "Leave a review to help other shoppers make great choices",
            ],
          },
        ].map(({ step, icon: Icon, title, desc, tips }) => (
          <div key={step} className="rounded-lg border border-border/40 bg-card/50 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2">
                  <span className="text-primary">Step {step}:</span> {title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-2">
                  {tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guest vs Account */}
      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Guest Checkout vs. Account</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Guest Checkout</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>No account required</li>
              <li>Enter your details at checkout</li>
              <li>Tracking link sent by email</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">With an Account</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Save addresses & payment methods</li>
              <li>View full order history</li>
              <li>Track all orders from your dashboard</li>
              <li>Earn bonus points on every order</li>
              <li>Faster checkout next time</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Start Shopping
        </Link>
      </div>
    </section>
  );
}
