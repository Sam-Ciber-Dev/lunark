"use client";

import Link from "next/link";
import { Globe, Mail, MessageCircle, Video } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  const columns = [
    {
      title: t.footer.company,
      links: [
        { label: t.footer.aboutUs, href: "/about" },
        { label: t.footer.careers, href: "#" },
        { label: t.footer.sustainability, href: "#" },
        { label: t.footer.press, href: "#" },
        { label: t.footer.affiliates, href: "#" },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { label: t.footer.shippingInfo, href: "#" },
        { label: t.footer.returns, href: "#" },
        { label: t.footer.howToOrder, href: "#" },
        { label: t.footer.howToTrack, href: "#" },
        { label: t.footer.sizeGuide, href: "#" },
      ],
    },
    {
      title: t.footer.customerService,
      links: [
        { label: t.footer.contactUs, href: "/contact" },
        { label: t.footer.paymentMethods, href: "#" },
        { label: t.footer.bonusPoints, href: "#" },
        { label: t.footer.faq, href: "#" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.privacyPolicy, href: "#" },
        { label: t.footer.termsConditions, href: "#" },
        { label: t.footer.cookiePolicy, href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Globe, href: "#", label: "Instagram" },
    { icon: MessageCircle, href: "#", label: "Facebook" },
    { icon: Mail, href: "#", label: "X / Twitter" },
    { icon: Video, href: "#", label: "YouTube" },
  ];

  const paymentLogos = ["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay", "Google Pay"];

  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        {/* Top section: columns + newsletter */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.newsletterTitle}</h3>
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{t.footer.newsletterDesc}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.footer.emailPlaceholder}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-colors"
                required
              />
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {t.footer.subscribe}
              </button>
            </form>
          </div>
        </div>

        {/* Social + Payment */}
        <div className="mt-10 flex flex-col items-center gap-6 border-t border-border/40 pt-8 sm:flex-row sm:justify-between">
          {/* Social */}
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.footer.followUs}</span>
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" aria-label={label}>
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          {/* Payment methods */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.footer.weAccept}</span>
            {paymentLogos.map((name) => (
              <span key={name} className="rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">{name}</span>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border/40 pt-6 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">LUNARK</Link>
          <p className="mt-2 text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Lunark. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
