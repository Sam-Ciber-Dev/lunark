"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery within the EU takes 3–5 business days. Express delivery is 1–2 business days. International orders (outside EU) take 7–14 business days. See our Shipping Info page for full details.",
      },
      {
        q: "How much does shipping cost?",
        a: "We offer free standard shipping on all EU orders over €50. For orders under €50, standard shipping is €4.95. Express shipping is €9.95. International rates vary by destination.",
      },
      {
        q: "Can I track my order?",
        a: "Yes! Once your order ships, you'll receive an email with a tracking link. You can also track orders from the 'My Orders' section of your account.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "You can cancel or modify your order within 1 hour of placing it by contacting our support team. After that, orders enter processing and cannot be changed.",
      },
      {
        q: "What if my order arrives damaged?",
        a: "Contact us within 48 hours of delivery with photos of the damage. We'll send a replacement or issue a full refund — no need to return the damaged item.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "You can return any unworn item with tags attached within 30 days of delivery for a full refund. Sale items are eligible for store credit or exchange only.",
      },
      {
        q: "How do I start a return?",
        a: "Log into your account, go to 'My Orders', select the order, and click 'Request Return'. You'll receive a return label and instructions by email.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 5–7 business days after we receive your return. Depending on your bank, it may take an additional 3–5 days to appear on your statement.",
      },
      {
        q: "Do I have to pay for return shipping?",
        a: "Returns within the EU come with a free prepaid label. For international returns, shipping costs are the customer's responsibility unless the return is due to our error.",
      },
    ],
  },
  {
    category: "Account & Security",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Register' in the top navigation, fill in your details, and verify your email. You'll earn 50 welcome bonus points!",
      },
      {
        q: "I forgot my password. How can I reset it?",
        a: "Click 'Login', then 'Forgot Password'. We'll send a reset link to your registered email address.",
      },
      {
        q: "Is my personal data secure?",
        a: "Absolutely. We use 256-bit SSL encryption, never store full card details, and comply with GDPR. See our Privacy Policy for full details.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to your profile settings and click 'Delete Account'. All your personal data will be permanently removed within 30 days.",
      },
    ],
  },
  {
    category: "Payments",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, MB WAY, Multibanco, Klarna, and more. See our Payment Methods page for the full list.",
      },
      {
        q: "Are payments secure?",
        a: "Yes. All transactions are processed with 256-bit SSL encryption and 3D Secure authentication. We are PCI DSS compliant and never store your full card details.",
      },
      {
        q: "Can I pay in instalments?",
        a: "Yes! We offer Klarna (3 interest-free payments) and Afterpay (4 instalments). These options appear at checkout if available in your region.",
      },
      {
        q: "What currency do you charge in?",
        a: "All prices are in Euros (€). If your card is in a different currency, your bank will convert at their exchange rate.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    questions: [
      {
        q: "How do I find my size?",
        a: "Check our Size Guide for detailed measurements and conversion charts for women's, men's, and children's clothing and shoes.",
      },
      {
        q: "Are your products true to size?",
        a: "Most of our items run true to size. Each product page includes specific sizing notes. When in doubt, we recommend sizing up.",
      },
      {
        q: "How do I care for my clothes?",
        a: "Each item comes with a care label. General tips: wash darks inside-out in cold water, avoid tumble-drying delicate fabrics, and store knitwear folded.",
      },
    ],
  },
  {
    category: "Loyalty & Promotions",
    questions: [
      {
        q: "How does the Bonus Points programme work?",
        a: "Earn 1–3 points per €1 spent depending on your tier. Redeem points for discounts. See our Bonus Points page for tiers, earning rates, and rewards.",
      },
      {
        q: "How do I use a discount code?",
        a: "Enter your code in the 'Promo Code' field at checkout and click 'Apply'. The discount will be reflected in your order total immediately.",
      },
      {
        q: "Can I combine discount codes?",
        a: "Only one promotional code can be used per order. However, you can combine a code with points redemption.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Got questions? We&apos;ve got answers. Browse our most common questions below, or{" "}
          <Link href="/contact" className="text-primary hover:underline">contact us</Link>{" "}
          if you need more help.
        </p>
      </div>

      <div className="space-y-8">
        {faqs.map(({ category, questions }) => (
          <div key={category} className="rounded-lg border border-border/40 bg-card/50 p-6">
            <h2 className="text-lg font-bold mb-2">{category}</h2>
            <div>
              {questions.map(({ q, a }) => (
                <FAQItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">Didn&apos;t find what you were looking for?</p>
        <Link href="/contact" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Contact Us
        </Link>
      </div>
    </section>
  );
}
