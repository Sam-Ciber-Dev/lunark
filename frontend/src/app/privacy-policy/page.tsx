"use client";

import { useI18n } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const { t } = useI18n();

  const sections = [
    { title: t.privacy.s1Title, content: t.privacy.s1Content },
    { title: t.privacy.s2Title, content: t.privacy.s2Intro, items: t.privacy.s2Items.split(";") },
    { title: t.privacy.s3Title, content: t.privacy.s3Content },
    { title: t.privacy.s4Title, content: t.privacy.s4Content },
    { title: t.privacy.s5Title, content: t.privacy.s5Content },
    { title: t.privacy.s6Title, content: t.privacy.s6Content },
    { title: t.privacy.s7Title, content: t.privacy.s7Content },
    { title: t.privacy.s8Title, content: t.privacy.s8Content },
    { title: t.privacy.s9Title, content: t.privacy.s9Content },
    { title: t.privacy.s10Title, content: t.privacy.s10Content },
    { title: t.privacy.s11Title, content: t.privacy.s11Content },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.privacy.title}</h1>
        <p className="text-sm text-muted-foreground">{t.privacy.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        {sections.map(({ title, content, items }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-8">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>{content}</p>
              {items && (
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {items.map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
