import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Lunark — orders, shipping, returns, payments, account, and sizing.",
  openGraph: { title: "FAQ — Lunark", description: "Find answers to common questions about shopping at Lunark." },
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does delivery take?",
      acceptedAnswer: { "@type": "Answer", text: "Standard delivery within the EU takes 3–5 business days. Express delivery is 1–2 business days. International orders take 7–14 business days." },
    },
    {
      "@type": "Question",
      name: "What is your return policy?",
      acceptedAnswer: { "@type": "Answer", text: "You can return any unworn item with tags attached within 30 days of delivery for a full refund. Sale items are eligible for store credit or exchange only." },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: { "@type": "Answer", text: "We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, MB WAY, Multibanco, Klarna, and more." },
    },
    {
      "@type": "Question",
      name: "How do I find my size?",
      acceptedAnswer: { "@type": "Answer", text: "Check our Size Guide for detailed measurements and conversion charts for women’s, men’s, and children’s clothing and shoes." },
    },
    {
      "@type": "Question",
      name: "How does the Bonus Points programme work?",
      acceptedAnswer: { "@type": "Answer", text: "Earn 1–3 points per €1 spent depending on your tier. Redeem points for discounts." },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
