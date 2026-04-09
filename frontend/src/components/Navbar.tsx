"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
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

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/shop", label: "Loja" },
  { href: "/about", label: "Sobre" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">🌙 Lunark</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="/shop?q=">
              <Search className="h-5 w-5" />
              <span className="sr-only">Pesquisar</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Carrinho</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="/login">
              <User className="h-5 w-5" />
              <span className="sr-only">Conta</span>
            </Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">🌙 Lunark</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-foreground",
                      pathname === link.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  Entrar
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  Carrinho
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
