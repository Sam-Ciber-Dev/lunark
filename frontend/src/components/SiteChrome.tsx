"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className={!isAdmin ? "min-h-[calc(100vh-8rem)]" : "min-h-screen"}>
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
