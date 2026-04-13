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
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>The data controller responsible for your personal data is:</p>
            <p><strong className="text-foreground">Lunark, Lda.</strong><br />Lisbon, Portugal<br />Email: <a href="mailto:privacy@lunark.com" className="text-primary hover:underline">privacy@lunark.com</a></p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">2. What Data We Collect</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><strong className="text-foreground">Account information:</strong> Name, email address, phone number, password (hashed), profile photo.</p>
            <p><strong className="text-foreground">Order information:</strong> Billing and shipping address, payment method (processed by third-party providers — we never store full card details), order history.</p>
            <p><strong className="text-foreground">Browsing data:</strong> IP address, browser type, device information, pages visited, referring URL, click patterns. Collected via cookies and similar technologies.</p>
            <p><strong className="text-foreground">Communication data:</strong> Contact form messages, support tickets, email correspondence, newsletter subscriptions.</p>
            <p><strong className="text-foreground">Voluntarily provided data:</strong> Product reviews, wishlist items, size preferences, survey responses.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">3. How We Use Your Data</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>We process your personal data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Contract performance:</strong> Processing orders, managing your account, handling returns and refunds.</li>
              <li><strong className="text-foreground">Legitimate interest:</strong> Improving our products and services, fraud prevention, website analytics, personalised recommendations.</li>
              <li><strong className="text-foreground">Consent:</strong> Sending marketing emails/SMS, personalised advertising, non-essential cookies.</li>
              <li><strong className="text-foreground">Legal obligation:</strong> Tax records, regulatory compliance, responding to legal requests.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">4. Data Sharing</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Payment processors:</strong> Stripe, PayPal — to process transactions securely.</li>
              <li><strong className="text-foreground">Shipping carriers:</strong> CTT, DHL, FedEx — to deliver your orders.</li>
              <li><strong className="text-foreground">Email service providers:</strong> Brevo — to send transactional and marketing emails.</li>
              <li><strong className="text-foreground">Analytics:</strong> Privacy-respecting analytics to understand site usage.</li>
              <li><strong className="text-foreground">Legal authorities:</strong> When required by law or to protect our legal rights.</li>
            </ul>
            <p>All third-party providers are contractually bound to process your data only for the purposes we specify and in compliance with GDPR.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">5. Data Retention</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p><strong className="text-foreground">Account data:</strong> Retained while your account is active. Deleted within 30 days of account deletion request.</p>
            <p><strong className="text-foreground">Order data:</strong> Retained for 7 years for tax and legal compliance.</p>
            <p><strong className="text-foreground">Marketing data:</strong> Retained until you unsubscribe. Deleted within 30 days of unsubscription.</p>
            <p><strong className="text-foreground">Browsing data / cookies:</strong> See our <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">6. Your Rights (GDPR)</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Access</strong> — Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Rectification</strong> — Correct inaccurate or incomplete data.</li>
              <li><strong className="text-foreground">Erasure</strong> — Request deletion of your data (&quot;right to be forgotten&quot;).</li>
              <li><strong className="text-foreground">Restriction</strong> — Restrict processing of your data in certain circumstances.</li>
              <li><strong className="text-foreground">Portability</strong> — Receive your data in a machine-readable format.</li>
              <li><strong className="text-foreground">Objection</strong> — Object to processing based on legitimate interest or direct marketing.</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — Withdraw consent at any time for consent-based processing.</li>
            </ul>
            <p>To exercise any right, email <a href="mailto:privacy@lunark.com" className="text-primary hover:underline">privacy@lunark.com</a>. We respond within 30 days.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">7. Data Security</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>Passwords hashed with bcrypt (not stored in plaintext)</li>
              <li>PCI DSS compliant payment processing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls limiting employee access to personal data</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">8. International Transfers</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>Your data is primarily stored within the EU. When data is transferred outside the EU (e.g., to service providers in the US), we ensure adequate protection through Standard Contractual Clauses (SCCs) approved by the European Commission or equivalent safeguards.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">9. Children&apos;s Privacy</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>Our services are not directed at children under 16. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child under 16, we will delete it promptly.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">10. Changes to This Policy</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on our website. We encourage you to review this page periodically.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">11. Contact & Complaints</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>For any privacy-related questions or concerns, contact us at:</p>
            <p>Email: <a href="mailto:privacy@lunark.com" className="text-primary hover:underline">privacy@lunark.com</a></p>
            <p>If you believe your data protection rights have been violated, you have the right to lodge a complaint with the Portuguese data protection authority:</p>
            <p><strong className="text-foreground">CNPD — Comissão Nacional de Proteção de Dados</strong><br />
              <a href="https://www.cnpd.pt" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cnpd.pt</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
