"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronDown,
  Heart,
  Headphones,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  ShoppingBag,
  User,
  X,
  Coins,
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
import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { CURRENCIES, type CurrencyCode, WOMEN_SUBCATEGORIES, MEN_SUBCATEGORIES, CHILDREN_SUBCATEGORIES } from "@lunark/shared";
import type { SearchSuggestion, CategorySuggestion } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ products: SearchSuggestion[]; categories: CategorySuggestion[] } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: session } = useSession();
  const { t, locale, setLocale } = useI18n();
  const { currency, setCurrency, format } = useCurrency();

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults(null); return; }
    try {
      const res = await fetch(`${API_URL}/products/search-suggestions?q=${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch { /* ignore */ }
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(value), 300);
  };

  const submitSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false); setSearchQuery(""); setSearchResults(null);
    }
  };

  const toggleLocale = () => setLocale(locale === "en" ? "pt" : "en");

  const getSubcategories = (gender: string) => {
    const subMap: Record<string, readonly string[]> = { women: WOMEN_SUBCATEGORIES, men: MEN_SUBCATEGORIES, boys: CHILDREN_SUBCATEGORIES, girls: CHILDREN_SUBCATEGORIES };
    return subMap[gender] ?? [];
  };

  const requireAuth = (action: () => void) => {
    if (!session?.user) { router.push("/login"); return; }
    action();
  };

  const mainNavItems = [
    { key: "newArrivals", label: t.nav.newArrivals, href: "/shop?sort=newest" },
    { key: "sale", label: t.nav.sale, href: "/shop?onSale=true" },
    { key: "women", label: t.nav.women, hasMenu: true },
    { key: "men", label: t.nav.men, hasMenu: true },
    { key: "children", label: t.nav.children, hasMenu: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border/40">
      {/* Main navbar */}
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-card border-border p-0 overflow-y-auto">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-left text-primary font-bold tracking-tight text-xl">LUNARK</SheetTitle>
            </SheetHeader>
            <MobileMenu t={t} session={session} isAdmin={isAdmin} onClose={() => setMobileOpen(false)} onSignOut={() => { setMobileOpen(false); signOut(); }} getSubcategories={getSubcategories} />
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex-shrink-0">
          <span className="text-xl font-bold tracking-tight text-primary">LUNARK</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {mainNavItems.map((item) => (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => item.hasMenu ? setActiveMenu(item.key) : setActiveMenu(null)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              {item.hasMenu ? (
                <button className={cn("flex items-center gap-1 px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors hover:text-primary", activeMenu === item.key ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <Link href={item.href!} className="px-3 py-2 text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
                  {item.label}
                </Link>
              )}
              {item.hasMenu && activeMenu === item.key && (
                <MegaMenu gender={item.key} t={t} subcategories={getSubcategories(item.key === "children" ? "boys" : item.key)} isChildren={item.key === "children"} onClose={() => setActiveMenu(null)} />
              )}
            </div>
          ))}
        </nav>

        {/* Search bar */}
        <div className="hidden md:flex flex-1 max-w-sm ml-auto" ref={searchRef}>
          <div className="relative w-full">
            <div className="flex items-center w-full rounded-full border border-border bg-card/50 px-4 py-1.5 focus-within:border-primary transition-colors">
              <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder={t.nav.searchPlaceholder}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults(null); }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            {searchOpen && searchResults && (
              <SearchDropdown results={searchResults} format={format} onClose={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }} />
            )}
          </div>
        </div>

        {/* Right icons: Language | MyAccount | Cart | Likes | Support | Currency */}
        <div className="flex items-center gap-0.5">
          <button className="p-2 md:hidden text-muted-foreground hover:text-primary transition-colors" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-4 w-4" />
          </button>
          {/* Language toggle */}
          <button className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent/50" onClick={toggleLocale} title={locale === "en" ? "Mudar para Português" : "Switch to English"}>
            <span className="text-base leading-none">{locale === "en" ? "🇬🇧" : "🇵🇹"}</span>
            <span className="hidden sm:inline text-xs font-medium uppercase">{locale === "en" ? "EN" : "PT"}</span>
          </button>
          {/* My Account */}
          <div className="relative" ref={profileRef} onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
            <button
              className={cn("p-2 transition-colors", pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-primary")}
              onClick={() => { if (session?.user) { router.push("/profile"); setProfileOpen(false); } else { router.push("/login"); } }}
            >
              {session?.user ? (
                session.user.image ? (
                  <img src={session.user.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground uppercase">
                    {(session.user.name ?? session.user.email ?? "U").charAt(0)}
                  </span>
                )
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-card shadow-xl py-1">
                {session?.user ? (
                  <>
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 transition-colors">
                      <User className="h-4 w-4" /> {t.nav.profile}
                    </Link>
                    <Link href="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 transition-colors">
                      <Package className="h-4 w-4" /> {t.nav.myOrders}
                    </Link>
                    <Link href="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 transition-colors">
                      <Heart className="h-4 w-4" /> {t.nav.myWishlist}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 transition-colors">
                        <Shield className="h-4 w-4" /> {t.nav.admin}
                      </Link>
                    )}
                    <hr className="border-border my-1" />
                    <button onClick={() => { setProfileOpen(false); signOut(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 transition-colors text-red-400">
                      <LogOut className="h-4 w-4" /> {t.nav.signOut}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm hover:bg-accent/10 transition-colors">{t.auth.login}</Link>
                    <Link href="/register" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm hover:bg-accent/10 transition-colors">{t.auth.register}</Link>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Cart */}
          <button className={cn("p-2 transition-colors", pathname === "/cart" ? "text-primary" : "text-muted-foreground hover:text-primary")} onClick={() => requireAuth(() => router.push("/cart"))}>
            <ShoppingBag className="h-4 w-4" />
          </button>
          {/* Wishlist / Likes */}
          <button className={cn("hidden sm:block p-2 transition-colors", pathname === "/wishlist" ? "text-primary" : "text-muted-foreground hover:text-primary")} onClick={() => requireAuth(() => router.push("/wishlist"))}>
            <Heart className="h-4 w-4" />
          </button>
          {/* Customer Support */}
          <button className={cn("hidden sm:block p-2 transition-colors", pathname === "/contact" ? "text-primary" : "text-muted-foreground hover:text-primary")} onClick={() => requireAuth(() => router.push("/contact"))}>
            <Headphones className="h-4 w-4" />
          </button>
          {/* Currency */}
          <div className="relative" ref={currencyRef}>
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setCurrencyOpen(!currencyOpen)}>
              <Coins className="h-4 w-4" />
            </button>
            {currencyOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 max-h-72 overflow-y-auto rounded-md border border-border bg-card shadow-xl">
                {(Object.entries(CURRENCIES) as [CurrencyCode, typeof CURRENCIES[CurrencyCode]][]).map(([code, { name, symbol }]) => (
                  <button
                    key={code}
                    onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                    className={cn("flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors", currency === code && "text-primary font-medium")}
                  >
                    <span>{name}</span>
                    <span className="text-muted-foreground">{symbol} {code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3" ref={searchRef}>
          <div className="flex items-center rounded-full border border-border bg-card/50 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSearch()} placeholder={t.nav.searchPlaceholder} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" autoFocus />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          {searchResults && <SearchDropdown results={searchResults} format={format} onClose={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }} isMobile />}
        </div>
      )}
    </header>
  );
}

function MegaMenu({ gender, t, subcategories, isChildren, onClose }: { gender: string; t: ReturnType<typeof useI18n>["t"]; subcategories: readonly string[]; isChildren: boolean; onClose: () => void }) {
  return (
    <div className="absolute left-0 top-full z-50 w-[600px] rounded-b-lg border border-t-0 border-border bg-card shadow-xl p-6" onMouseLeave={onClose}>
      {isChildren && (
        <div className="mb-4 flex gap-2">
          <Link href="/shop?gender=boys" onClick={onClose} className="rounded-md bg-accent px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">{t.nav.boys}</Link>
          <Link href="/shop?gender=girls" onClick={onClose} className="rounded-md bg-accent px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">{t.nav.girls}</Link>
        </div>
      )}
      {isChildren && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.filters.ageGroup}</h4>
          <div className="flex flex-wrap gap-2">
            {(["0-9months", "0-3years", "4-7years", "8-12years", "13-16years"] as const).map((age) => (
              <Link key={age} href={`/shop?gender=boys&ageGroup=${age}`} onClick={onClose} className="rounded-md border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors">{t.ageGroups[age]}</Link>
            ))}
          </div>
        </div>
      )}
      <div className="mb-3">
        <Link href={isChildren ? "/shop?gender=boys" : `/shop?gender=${gender}`} onClick={onClose} className="text-sm font-semibold text-primary hover:underline">{t.nav.viewAll}</Link>
      </div>
      <div className="grid grid-cols-3 gap-x-8 gap-y-2">
        {subcategories.map((sub) => (
          <Link key={sub} href={`/shop?gender=${isChildren ? "boys" : gender}&category=${sub}`} onClick={onClose} className="text-sm text-muted-foreground hover:text-primary transition-colors py-1">
            {(t.subcategories as Record<string, string>)[sub] ?? sub}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchDropdown({ results, format, onClose, isMobile }: { results: { products: SearchSuggestion[]; categories: CategorySuggestion[] }; format: (price: number) => string; onClose: () => void; isMobile?: boolean }) {
  const hasResults = results.products.length > 0 || results.categories.length > 0;
  return (
    <div className={cn("bg-card border border-border rounded-md shadow-xl overflow-hidden", isMobile ? "mt-2" : "absolute top-full left-0 right-0 mt-1 z-50")}>
      {!hasResults ? (
        <p className="p-4 text-sm text-muted-foreground text-center">No results found</p>
      ) : (
        <>
          {results.categories.length > 0 && (
            <div className="border-b border-border p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((cat) => (
                  <Link key={cat.id} href={`/shop?category=${cat.slug}${cat.gender ? `&gender=${cat.gender}` : ""}`} onClick={onClose} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors">{cat.name}</Link>
                ))}
              </div>
            </div>
          )}
          {results.products.length > 0 && (
            <div className="p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Products</h4>
              <div className="space-y-2">
                {results.products.map((product) => (
                  <Link key={product.id} href={`/shop/${product.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors">
                    {product.image && <img src={product.image} alt={product.name} className="h-10 w-10 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{product.name}</p>
                      <p className="text-xs text-primary font-medium">{format(product.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MobileMenu({ t, session, isAdmin, onClose, onSignOut, getSubcategories }: { t: ReturnType<typeof useI18n>["t"]; session: ReturnType<typeof useSession>["data"]; isAdmin: boolean; onClose: () => void; onSignOut: () => void; getSubcategories: (g: string) => readonly string[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const genders = [
    { key: "women", label: t.nav.women, subs: getSubcategories("women") },
    { key: "men", label: t.nav.men, subs: getSubcategories("men") },
    { key: "children", label: t.nav.children, subs: getSubcategories("boys") },
  ];

  return (
    <nav className="flex flex-col">
      <Link href="/shop?sort=newest" onClick={onClose} className="px-4 py-3 text-sm font-medium border-b border-border/40 hover:bg-accent transition-colors">{t.nav.newArrivals}</Link>
      <Link href="/shop?onSale=true" onClick={onClose} className="px-4 py-3 text-sm font-medium border-b border-border/40 hover:bg-accent transition-colors text-red-400">{t.nav.sale}</Link>
      {genders.map(({ key, label, subs }) => (
        <div key={key} className="border-b border-border/40">
          <button onClick={() => setExpanded(expanded === key ? null : key)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
            {label}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded === key && "rotate-180")} />
          </button>
          {expanded === key && (
            <div className="bg-background/50 pb-2">
              <Link href={`/shop?gender=${key === "children" ? "boys" : key}`} onClick={onClose} className="block px-6 py-2 text-xs font-semibold text-primary">{t.nav.viewAll}</Link>
              {subs.map((sub) => (
                <Link key={sub} href={`/shop?gender=${key === "children" ? "boys" : key}&category=${sub}`} onClick={onClose} className="block px-6 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  {(t.subcategories as Record<string, string>)[sub] ?? sub}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="mt-4 px-4 pb-4">
        {session?.user ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{session.user.name}</p>
            <Link href="/orders" onClick={onClose} className="flex items-center gap-2 py-2 text-sm hover:text-primary"><Package className="h-4 w-4" /> {t.nav.myOrders}</Link>
            <Link href="/wishlist" onClick={onClose} className="flex items-center gap-2 py-2 text-sm hover:text-primary"><Heart className="h-4 w-4" /> {t.nav.myWishlist}</Link>
            <Link href="/cart" onClick={onClose} className="flex items-center gap-2 py-2 text-sm hover:text-primary"><ShoppingBag className="h-4 w-4" /> {t.nav.cart}</Link>
            {isAdmin && <Link href="/admin" onClick={onClose} className="flex items-center gap-2 py-2 text-sm hover:text-primary"><Shield className="h-4 w-4" /> {t.nav.admin}</Link>}
            <button onClick={onSignOut} className="flex items-center gap-2 py-2 text-sm text-red-400 hover:text-red-300"><LogOut className="h-4 w-4" /> {t.nav.signOut}</button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" onClick={onClose} className="block w-full text-center rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">{t.auth.login}</Link>
            <Link href="/register" onClick={onClose} className="block w-full text-center rounded-md border border-border py-2 text-sm font-medium hover:bg-accent">{t.auth.register}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
