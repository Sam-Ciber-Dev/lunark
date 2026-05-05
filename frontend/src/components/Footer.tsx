"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { COUNTRY_CODES, type CountryCode } from "@/lib/phone-codes";
import { ChevronDown, Search } from "lucide-react";

/* ─── Social Icons ─── */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
/* ─── Flag Image ─── */
function FlagImg({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      className={className ?? "h-4 w-5 object-cover rounded-[2px]"}
      loading="lazy"
    />
  );
}

/* ─── Country Code Selector ─── */
function CountryCodeSelector({ selected, onSelect }: { selected: CountryCode; onSelect: (c: CountryCode) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search
    ? COUNTRY_CODES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
    : COUNTRY_CODES;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-l-md border border-r-0 border-border bg-card px-2.5 py-2 text-sm hover:bg-card/80 transition-colors h-full"
      >
        <FlagImg code={selected.code} />
        <span className="text-muted-foreground">{selected.dial}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-72 max-h-64 overflow-hidden rounded-md border border-border bg-card shadow-xl z-50 flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch(""); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
              >
                <FlagImg code={c.code} />
                <span className="flex-1 text-left text-foreground truncate">{c.name}</span>
                <span className="text-muted-foreground">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Payment Method Icons ─── */
function PaymentIcons() {
  const payments = [
    { label: "Visa", src: "/payments/visa.png" },
    { label: "Mastercard", src: "/payments/mastercard.png" },
    { label: "American Express", src: "/payments/amex.png" },
    { label: "Maestro", src: "/payments/maestro.png" },
    { label: "PayPal", src: "/payments/paypal.png" },
    { label: "MB WAY", src: "/payments/mbway.png" },
    { label: "Multibanco", src: "/payments/multibanco.png" },
    { label: "Google Pay", src: "/payments/googlepay.png" },
    { label: "Apple Pay", src: "/payments/applepay.png" },
    { label: "Klarna", src: "/payments/klarna.png" },
    { label: "Scalapay", src: "/payments/scalapay.png" },
    { label: "UnionPay", src: "/payments/unionpay.png" },
    { label: "JCB", src: "/payments/jcb.png" },
    { label: "DMCA", src: "/payments/dmca.png" },
    { label: "Trustwave", src: "/payments/trustwave.png" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {payments.map(({ label, src }) => (
        <div key={label} className="flex h-9 w-14 items-center justify-center rounded border border-border/50 bg-white px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} title={label} className="max-h-full max-w-full object-contain" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

/* ─── Footer Component ─── */
export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find(c => c.code === "PT") ?? COUNTRY_CODES[0]
  );
  const [subscribeMode, setSubscribeMode] = useState<"email" | "phone" | "whatsapp">("email");

  const columns = [
    {
      title: t.footer.company,
      links: [
        { label: t.footer.aboutUs, href: "/about" },
        { label: t.footer.careers, href: "/careers" },
        { label: t.footer.sustainability, href: "/sustainability" },
        { label: t.footer.press, href: "/press" },
        { label: t.footer.affiliates, href: "/affiliates" },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { label: t.footer.shippingInfo, href: "/shipping-info" },
        { label: t.footer.returns, href: "/returns" },
        { label: t.footer.howToOrder, href: "/how-to-order" },
        { label: t.footer.howToTrack, href: "/how-to-track" },
        { label: t.footer.sizeGuide, href: "/size-guide" },
      ],
    },
    {
      title: t.footer.customerService,
      links: [
        { label: t.footer.contactUs, href: "/contact" },
        { label: t.footer.paymentMethods, href: "/payment-methods" },
        { label: t.footer.bonusPoints, href: "/bonus-points" },
        { label: t.footer.faq, href: "/faq" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.privacyPolicy, href: "/privacy-policy" },
        { label: t.footer.termsConditions, href: "/terms" },
        { label: t.footer.cookiePolicy, href: "/cookie-policy" },
      ],
    },
  ];

  const socialLinks = [
    { icon: InstagramIcon, href: "#", label: "Instagram" },
    { icon: FacebookIcon, href: "#", label: "Facebook" },
    { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeMode === "email") {
      setEmail("");
    } else {
      setPhone("");
    }
  };

  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        {/* Top: Link columns + Social + Newsletter */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1.5fr_2fr_3fr]">
          {/* Link columns */}
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

          {/* Follow Us */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.followUs}</h3>
            <div className="flex flex-col gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" title={label}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.newsletterTitle}</h3>
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{t.footer.newsletterDesc}</p>

            {/* Subscribe mode tabs */}
            <div className="mb-3 flex gap-1 rounded-lg bg-background/50 p-1">
              {(["email", "phone", "whatsapp"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSubscribeMode(mode)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    subscribeMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "email" ? "Email" : mode === "phone" ? "SMS" : "WhatsApp"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              {subscribeMode === "email" ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.footer.emailPlaceholder}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-colors"
                  required
                />
              ) : (
                <div className="flex w-full">
                  <CountryCodeSelector selected={selectedCountry} onSelect={setSelectedCountry} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={subscribeMode === "whatsapp" ? "WhatsApp" : "Phone"}
                    maxLength={selectedCountry.maxDigits}
                    className="flex-1 min-w-0 rounded-r-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-colors"
                    required
                  />
                </div>
              )}
              <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
                {t.footer.subscribe}
              </button>
            </form>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 border-t border-border/40 pt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.weAccept}</h3>
          <PaymentIcons />
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/40 pt-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Lunark. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
