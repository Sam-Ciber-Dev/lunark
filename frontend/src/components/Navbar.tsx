"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Globe,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { t, locale, setLocale } = useI18n();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  const toggleLocale = () => {
    setLocale(locale === "en" ? "pt" : "en");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">
            LUNARK
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium uppercase tracking-wider transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            className="hidden sm:flex text-muted-foreground hover:text-primary"
            title={locale === "en" ? "Mudar para Português" : "Switch to English"}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only ml-1 text-xs">{locale.toUpperCase()}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:flex text-muted-foreground hover:text-primary"
          >
            <Link href="/shop?q=">
              <Search className="h-4 w-4" />
              <span className="sr-only">{t.nav.search}</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-muted-foreground hover:text-primary"
          >
            <Link href="/cart">
              <ShoppingBag className="h-4 w-4" />
              <span className="sr-only">{t.nav.cart}</span>
            </Link>
          </Button>

          {session?.user ? (
            <>
              {(session.user as { role?: string }).role === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="hidden sm:flex text-muted-foreground hover:text-primary"
                >
                  <Link href="/admin">
                    <Shield className="h-4 w-4" />
                    <span className="sr-only">{t.nav.admin}</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hidden sm:flex text-muted-foreground hover:text-primary"
              >
                <Link href="/orders">
                  <Package className="h-4 w-4" />
                  <span className="sr-only">{t.nav.orders}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-muted-foreground hover:text-primary"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{t.nav.signOut}</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden sm:flex text-muted-foreground hover:text-primary"
            >
              <Link href="/login">
                <User className="h-4 w-4" />
                <span className="sr-only">{t.nav.account}</span>
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t.nav.menu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-border">
              <SheetHeader>
                <SheetTitle className="text-left text-primary font-bold tracking-tight">
                  LUNARK
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-base font-medium uppercase tracking-wider transition-colors hover:text-primary",
                      pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-border" />

                {/* Language toggle mobile */}
                <button
                  onClick={toggleLocale}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                  {locale === "en" ? "Português" : "English"}
                </button>

                {session?.user ? (
                  <>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {session.user.name}
                    </span>
                    {(session.user as { role?: string }).role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="text-base font-medium text-muted-foreground hover:text-primary uppercase tracking-wider"
                      >
                        {t.nav.admin}
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={() => setOpen(false)}
                      className="text-base font-medium text-muted-foreground hover:text-primary uppercase tracking-wider"
                    >
                      {t.nav.orders}
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="text-base font-medium text-muted-foreground hover:text-primary text-left uppercase tracking-wider"
                    >
                      {t.nav.signOut}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-primary uppercase tracking-wider"
                  >
                    {t.auth.login}
                  </Link>
                )}
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-primary uppercase tracking-wider"
                >
                  {t.nav.cart}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
