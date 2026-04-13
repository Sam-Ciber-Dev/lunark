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
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>This website is operated by <strong className="text-foreground">Lunark, Lda.</strong>, registered in Lisbon, Portugal.</p>
            <p>Contact: <a href="mailto:support@lunark.com" className="text-primary hover:underline">support@lunark.com</a></p>
            <p>These Terms are governed by Portuguese law and applicable EU regulations.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">2. Account Registration</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>You must be at least 16 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>
            <p>You agree to provide accurate, current, and complete information during registration and to update it as needed.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">3. Orders & Pricing</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>All prices are displayed in Euros (€) and include VAT where applicable. Prices are subject to change without notice, but changes do not affect orders already placed.</p>
            <p>Placing an order constitutes an offer to purchase. The contract is formed when we send you an order confirmation email. We reserve the right to refuse or cancel orders in cases of pricing errors, stock unavailability, or suspected fraud.</p>
            <p>We make every effort to display products accurately. However, colours may vary slightly due to screen settings and photography.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">4. Payment</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>We accept the payment methods listed on our <Link href="/payment-methods" className="text-primary hover:underline">Payment Methods</Link> page. All payments are processed securely through third-party providers.</p>
            <p>By providing payment information, you represent that you are authorised to use the payment method and that all information is accurate.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">5. Shipping & Delivery</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Shipping timelines are estimates only and are not guaranteed. We are not liable for delays caused by carriers, customs, weather, or other events beyond our control.</p>
            <p>Risk of loss passes to you upon delivery. If a package is marked as delivered but you have not received it, contact us within 48 hours.</p>
            <p>See our <Link href="/shipping-info" className="text-primary hover:underline">Shipping Info</Link> page for details on rates and timelines.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">6. Returns & Refunds</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>You have 30 days from delivery to return items for a refund, subject to our <Link href="/returns" className="text-primary hover:underline">Returns Policy</Link>. Items must be unworn, unwashed, with all original tags attached.</p>
            <p>In accordance with EU Directive 2011/83/EU, you have a 14-day withdrawal right for online purchases. This right does not apply to personalised items, sealed hygiene products once opened, or items that have been worn/washed.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">7. Intellectual Property</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>All content on this website — including text, images, logos, graphics, videos, and software — is the property of Lunark or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>
            <p>You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">8. User Conduct</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use the website for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to our systems</li>
              <li>Submit false or misleading information</li>
              <li>Interfere with the website&apos;s operation or other users&apos; experience</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Post defamatory, abusive, or inappropriate content in reviews</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">9. Limitation of Liability</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>To the maximum extent permitted by law, Lunark is not liable for indirect, incidental, special, or consequential damages arising from your use of our website or products.</p>
            <p>Our total liability for any claim arising from a purchase shall not exceed the amount you paid for the product(s) in question.</p>
            <p>Nothing in these Terms limits your statutory rights as a consumer under EU and Portuguese law.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">10. Dispute Resolution</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>We aim to resolve disputes amicably. If a dispute cannot be resolved directly, you may use the EU Online Dispute Resolution platform at{" "}
              <a href="https://ec.europa.eu/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/odr</a>.
            </p>
            <p>These Terms are governed by the laws of Portugal. Any legal proceedings shall be conducted in the courts of Lisbon, Portugal.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">11. Changes to These Terms</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a notice on our website. Continued use of the site after changes constitutes acceptance of the updated Terms.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">12. Contact</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>For questions about these Terms, contact us at:{" "}
              <a href="mailto:support@lunark.com" className="text-primary hover:underline">support@lunark.com</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
