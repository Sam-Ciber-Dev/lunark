"use client";

import Link from "next/link";
import { Settings, BarChart3, Target, Shield } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border border-border/40 bg-card/50 p-8 text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>This Cookie Policy explains how Lunark uses cookies and similar technologies when you visit our website. It should be read alongside our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">What Are Cookies?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Cookies are small text files stored on your device (computer, phone, tablet) when you visit a website. They help the website remember your preferences and improve your experience.</p>
            <p>We also use similar technologies such as local storage, session storage, and pixel tags.</p>
          </div>
        </div>

        {/* Cookie Types */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-6">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {[
              {
                icon: Shield,
                type: "Strictly Necessary",
                required: true,
                desc: "Essential for the website to function. Without these, services like shopping cart, account login, and checkout would not work.",
                examples: ["Session authentication", "Shopping cart", "CSRF protection", "Cookie consent preferences"],
                duration: "Session – 1 year",
              },
              {
                icon: Settings,
                type: "Functional",
                required: false,
                desc: "Remember your choices and preferences to provide a more personalised experience.",
                examples: ["Language preference", "Currency selection", "Recently viewed products", "Theme preference (dark/light)"],
                duration: "1 month – 1 year",
              },
              {
                icon: BarChart3,
                type: "Analytics",
                required: false,
                desc: "Help us understand how visitors interact with our website so we can improve it.",
                examples: ["Page view counts", "Navigation patterns", "Error tracking", "Performance metrics"],
                duration: "30 days – 2 years",
              },
              {
                icon: Target,
                type: "Marketing",
                required: false,
                desc: "Used to deliver relevant advertisements and measure the effectiveness of advertising campaigns.",
                examples: ["Ad personalisation", "Retargeting", "Social media pixels", "Conversion tracking"],
                duration: "30 days – 2 years",
              },
            ].map(({ icon: Icon, type, required, desc, examples, duration }) => (
              <div key={type} className="border border-border/30 rounded-md p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{type}</h3>
                  {required && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Always Active</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{desc}</p>
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-1">Examples:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {examples.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Duration:</p>
                    <p>{duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Third-Party Cookies</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Some cookies are set by third-party services that appear on our pages:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Cloudflare</strong> — Security and performance (bot protection, Turnstile CAPTCHA)</li>
              <li><strong className="text-foreground">Stripe / PayPal</strong> — Payment processing (fraud detection)</li>
              <li><strong className="text-foreground">Brevo</strong> — Email marketing tracking</li>
            </ul>
            <p>These third parties have their own privacy and cookie policies. We encourage you to review them.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Managing Your Cookies</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>You can control cookies in several ways:</p>
            <p><strong className="text-foreground">Cookie consent banner:</strong> When you first visit our site, you can choose which types of cookies to accept. You can change your preferences at any time by clicking the cookie settings link in the footer.</p>
            <p><strong className="text-foreground">Browser settings:</strong> Most browsers allow you to block or delete cookies. Check your browser&apos;s help section for instructions:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Chrome: Settings → Privacy and Security → Cookies</li>
              <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Cookies and Website Data</li>
              <li>Edge: Settings → Cookies and Site Permissions</li>
            </ul>
            <p><strong className="text-foreground">Note:</strong> Blocking certain cookies may impact your experience on our site. If you disable strictly necessary cookies, some features (like the shopping cart) will not work.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Your Rights</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Under GDPR and the ePrivacy Directive, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be informed about the cookies we use (this policy)</li>
              <li>Choose which non-essential cookies to accept</li>
              <li>Withdraw consent at any time</li>
              <li>Request deletion of cookie-related data</li>
            </ul>
            <p>For questions, contact <a href="mailto:privacy@lunark.com" className="text-primary hover:underline">privacy@lunark.com</a>.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/50 p-8">
          <h2 className="text-xl font-bold mb-4">Updates</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>We may update this Cookie Policy periodically. The &quot;Last updated&quot; date at the top reflects the latest revision. Continued use of the site after updates constitutes acceptance.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
