import Link from "next/link";

const footerLinks = [
  { href: "/shop", label: "Loja" },
  { href: "/about", label: "Sobre" },
  { href: "/contact", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🌙 Lunark
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Moda com estilo — feita para ti.
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Lunark. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
