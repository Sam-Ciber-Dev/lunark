"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  const faqs = [
    { category: t.faq.cat1, questions: [
      { q: t.faq.q1, a: t.faq.a1 }, { q: t.faq.q2, a: t.faq.a2 }, { q: t.faq.q3, a: t.faq.a3 },
      { q: t.faq.q4, a: t.faq.a4 }, { q: t.faq.q5, a: t.faq.a5 },
    ]},
    { category: t.faq.cat2, questions: [
      { q: t.faq.q6, a: t.faq.a6 }, { q: t.faq.q7, a: t.faq.a7 },
      { q: t.faq.q8, a: t.faq.a8 }, { q: t.faq.q9, a: t.faq.a9 },
    ]},
    { category: t.faq.cat3, questions: [
      { q: t.faq.q10, a: t.faq.a10 }, { q: t.faq.q11, a: t.faq.a11 },
      { q: t.faq.q12, a: t.faq.a12 }, { q: t.faq.q13, a: t.faq.a13 },
    ]},
    { category: t.faq.cat4, questions: [
      { q: t.faq.q14, a: t.faq.a14 }, { q: t.faq.q15, a: t.faq.a15 },
      { q: t.faq.q16, a: t.faq.a16 }, { q: t.faq.q17, a: t.faq.a17 },
    ]},
    { category: t.faq.cat5, questions: [
      { q: t.faq.q18, a: t.faq.a18 }, { q: t.faq.q19, a: t.faq.a19 },
      { q: t.faq.q20, a: t.faq.a20 },
    ]},
    { category: t.faq.cat6, questions: [
      { q: t.faq.q21, a: t.faq.a21 }, { q: t.faq.q22, a: t.faq.a22 },
      { q: t.faq.q23, a: t.faq.a23 },
    ]},
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.faq.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.faq.subtitle}{" "}
          <Link href="/contact" className="text-primary hover:underline">{t.faq.contactLink}</Link>{" "}
          {t.faq.subtitleEnd}
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
        <p className="text-sm text-muted-foreground mb-4">{t.faq.notFound}</p>
        <Link href="/contact" className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.faq.contactUs}
        </Link>
      </div>
    </section>
  );
}
