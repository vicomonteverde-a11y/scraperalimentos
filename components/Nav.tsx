"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Panorama" },
  { href: "/targets", label: "Top Targets" },
  { href: "/marcas-dormidas", label: "Marcas Dormidas" },
  { href: "/plantas-flexibles", label: "Plantas Flexibles" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-20 border-b border-border/50 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-2xl italic text-accent">
            scraper
          </span>
          <span className="font-serif text-2xl text-text">alimentos</span>
          <span className="ml-1 hidden text-[10px] uppercase tracking-[0.2em] text-muted md:inline">
            · deal sourcing
          </span>
        </Link>
        <div className="flex items-center gap-1 md:gap-3">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "rounded-sm px-2 py-1 text-xs uppercase tracking-[0.18em] transition-colors md:px-3 md:text-[11px]",
                  active
                    ? "text-accent"
                    : "text-muted hover:text-text",
                ].join(" ")}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
