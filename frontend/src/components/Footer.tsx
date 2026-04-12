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
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

/* ─── Payment Method Icons (inline SVG) ─── */
function PaymentIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Visa */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-white p-1" title="Visa">
        <svg viewBox="0 0 780 500" className="h-full w-full">
          <path d="M293.2 348.73l33.36-195.76h53.35l-33.38 195.76H293.2zm246.11-191.54c-10.57-3.97-27.16-8.2-47.89-8.2-52.84 0-90.08 26.63-90.33 64.82-.5 28.18 26.59 43.91 46.89 53.3 20.82 9.63 27.82 15.77 27.82 24.38-.24 13.16-16.7 19.18-32.15 19.18-21.44 0-32.87-2.98-50.43-10.33l-7.08-3.22-7.52 44.07c12.55 5.49 35.77 10.25 59.88 10.51 56.16 0 92.61-26.28 93.09-67.11.24-22.37-14.07-39.39-44.94-53.42-18.73-9.08-30.19-15.14-30.19-24.38.24-8.35 9.74-16.94 30.82-16.94 17.55-.24 30.31 3.58 40.18 7.57l4.81 2.3 7.28-42.59h-.24zm138.69-4.46h-41.3c-12.79 0-22.37 3.47-27.94 16.22l-79.1 179.3h55.97s9.17-24.11 11.19-29.36l68.26.08c1.57 6.83 6.49 29.28 6.49 29.28h49.47l-43.14-195.52h.1zM635.64 299c4.41-11.27 21.25-54.67 21.25-54.67-.24.42 4.41-11.39 7.04-18.71l3.63 16.9s10.17 46.57 12.31 56.48h-44.23zm-404.27-191.3L178.35 285.2l-5.37-26.15c-9.97-31.6-40.3-65.84-74.32-82.96l47.97 172.46 56.42-.08 83.94-244.77h-56.4l.18.01z" fill="#1a1f71"/>
          <path d="M131.92 152.96H46.39l-.62 3.7c66.93 16.22 111.19 55.39 129.46 102.4l-18.67-89.88c-3.22-12.34-12.55-15.86-24.64-16.22z" fill="#f9a533"/>
        </svg>
      </div>
      {/* Mastercard */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-white p-1" title="Mastercard">
        <svg viewBox="0 0 780 500" className="h-full w-full">
          <circle cx="312" cy="250" r="170" fill="#eb001b"/>
          <circle cx="468" cy="250" r="170" fill="#f79e1b"/>
          <path d="M390 113.4A169.7 169.7 0 0 0 312 250a169.7 169.7 0 0 0 78 136.6A169.7 169.7 0 0 0 468 250a169.7 169.7 0 0 0-78-136.6z" fill="#ff5f00"/>
        </svg>
      </div>
      {/* PayPal */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-white px-1" title="PayPal">
        <svg viewBox="0 0 124 33" className="h-full w-full">
          <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253b80"/>
          <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179bd7"/>
          <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .312-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.126a.155.155 0 0 1-.096.035H7.266z" fill="#253b80"/>
          <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179bd7"/>
          <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.294-.516z" fill="#222d65"/>
        </svg>
      </div>
      {/* American Express */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-[#006fcf] px-1" title="American Express">
        <span className="text-[10px] font-bold text-white leading-tight text-center">AMERICAN EXPRESS</span>
      </div>
      {/* Apple Pay */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-black px-1" title="Apple Pay">
        <svg viewBox="0 0 165.52 105.97" className="h-5 w-auto">
          <path d="M41.64 34.38c1.96-2.48 3.29-5.82 2.93-9.24-2.84.12-6.32 1.92-8.36 4.32-1.8 2.12-3.41 5.58-2.97 8.84 3.16.24 6.4-1.6 8.4-3.92zM44.53 39.5c-4.64-.28-8.6 2.64-10.8 2.64-2.2 0-5.6-2.52-9.24-2.44-4.76.08-9.16 2.76-11.6 7.04-4.96 8.6-1.28 21.36 3.52 28.36 2.4 3.48 5.24 7.32 8.96 7.2 3.56-.16 4.96-2.32 9.28-2.32s5.56 2.32 9.36 2.24c3.88-.08 6.28-3.48 8.68-6.96 2.72-3.96 3.84-7.8 3.88-8.04-.08-.04-7.48-2.88-7.56-11.4-.04-7.16 5.84-10.56 6.12-10.76-3.36-4.96-8.6-5.52-10.4-5.56l-.2-.2zM78.16 32.26v49.38h7.64v-16.88h10.56c9.64 0 16.44-6.64 16.44-16.28s-6.64-16.22-16.16-16.22H78.16zm7.64 6.56h8.8c6.6 0 10.4 3.52 10.4 9.68s-3.8 9.72-10.44 9.72h-8.76V38.82z" fill="white"/>
        </svg>
      </div>
      {/* Google Pay */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-white px-0.5" title="Google Pay">
        <svg viewBox="0 0 435.97 173.13" className="h-4 w-auto">
          <path d="M206.2 84.58v50.75h-16.1V10h42.7a38.61 38.61 0 0127.65 10.85A34.88 34.88 0 01272 47.3a34.72 34.72 0 01-11.55 26.6 38.82 38.82 0 01-27.65 10.68zm0-59.15v43.72h27a22.18 22.18 0 0016.27-6.72 22.2 22.2 0 000-30.45 22 22 0 00-16.27-6.55z" fill="#5f6368"/>
          <path d="M299.72 46.15c11.87 0 21.23 3.18 28.08 9.55s10.27 15.07 10.27 26.27v53.07h-15.4v-11.95h-.7c-6.65 9.95-15.47 14.93-26.47 14.93a36.14 36.14 0 01-24.85-9.1 29 29 0 01-10.15-22.4 27.67 27.67 0 0110.5-22.23c7-5.77 16.35-8.65 28-8.65 9.93 0 18.13 1.82 24.57 5.47v-3.85a19.86 19.86 0 00-7.1-15.4 24.08 24.08 0 00-16.45-6.37c-9.63 0-17.23 4.07-22.82 12.2l-14.18-8.93c8.3-12.07 20.58-18.1 36.7-18.1zm-21.7 64.4a14.7 14.7 0 006.13 12.08 21.7 21.7 0 0013.65 4.9 27.77 27.77 0 0019.6-8.23c5.83-5.47 8.75-11.93 8.75-19.38-5.25-4.17-12.6-6.27-22.05-6.27-6.88 0-12.63 1.7-17.22 5.1s-6.86 7.7-6.86 12.8z" fill="#5f6368"/>
          <path d="M436 49.13L382.17 173.13h-16.62l20-43.2-35.4-80.8h17.5l25.55 61.6h.35l24.85-61.6z" fill="#5f6368"/>
          <path d="M142.08 73.65a85.3 85.3 0 00-1.25-14.58H73.15v27.55h38.68a33.08 33.08 0 01-14.35 21.7v18.03h23.3c13.57-12.5 21.4-30.92 21.3-52.7z" fill="#4285f4"/>
          <path d="M73.15 135.33c19.37 0 35.63-6.43 47.5-17.38l-23.2-17.98c-6.42 4.3-14.62 6.83-24.3 6.83-18.7 0-34.53-12.62-40.18-29.6H9.08v18.55a71.65 71.65 0 0064.07 39.58z" fill="#34a853"/>
          <path d="M32.97 77.2a43.15 43.15 0 010-27.53V31.12H9.08a71.75 71.75 0 000 64.63z" fill="#fbbc04"/>
          <path d="M73.15 20.07a38.82 38.82 0 0127.48 10.73l20.58-20.58A69.08 69.08 0 0073.15 0 71.65 71.65 0 009.08 31.12l23.9 18.55c5.64-16.98 21.47-29.6 40.17-29.6z" fill="#ea4335"/>
        </svg>
      </div>
      {/* Klarna */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-[#FFB3C7] px-1.5" title="Klarna">
        <span className="text-[11px] font-extrabold text-black">Klarna.</span>
      </div>
      {/* MB WAY */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-white px-1" title="MB WAY">
        <span className="text-[9px] font-bold text-[#D0021B]">MB WAY</span>
      </div>
      {/* Multibanco */}
      <div className="flex h-9 w-14 items-center justify-center rounded bg-[#21AFED] px-1" title="Multibanco">
        <span className="text-[10px] font-bold text-white">MB</span>
      </div>
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
    { icon: TwitterIcon, href: "#", label: "X (Twitter)" },
    { icon: YoutubeIcon, href: "#", label: "YouTube" },
    { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
    { icon: WhatsAppIcon, href: "#", label: "WhatsApp" },
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
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-12">
          {/* Link columns — each takes 2/12 */}
          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
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

          {/* Follow Us — 2/12 */}
          <div className="lg:col-span-2">
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

          {/* Newsletter — 2/12 */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
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
