"use client";

import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useI18n();

  const sections = [
    { title: t.termsPage.s1Title, content: t.termsPage.s1Content },
    { title: t.termsPage.s2Title, content: t.termsPage.s2Content },
    { title: t.termsPage.s3Title, content: t.termsPage.s3Content },
    { title: t.termsPage.s4Title, content: t.termsPage.s4Content },
    { title: t.termsPage.s5Title, content: t.termsPage.s5Content },
    { title: t.termsPage.s6Title, content: t.termsPage.s6Content },
    { title: t.termsPage.s7Title, content: t.termsPage.s7Content },
    { title: t.termsPage.s8Title, content: t.termsPage.s8Content },
    { title: t.termsPage.s9Title, content: t.termsPage.s9Content },
    { title: t.termsPage.s10Title, content: t.termsPage.s10Content },
    { title: t.termsPage.s11Title, content: t.termsPage.s11Content },
    { title: t.termsPage.s12Title, content: t.termsPage.s12Content },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.termsPage.title}</h1>
        <p className="text-sm text-muted-foreground">{t.termsPage.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        {sections.map(({ title, content }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-8">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>{content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
