"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/studio", label: "Studio" },
  { href: "/#how", label: "How it works" },
  { href: "/#moves", label: "Moves" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="rounded-md"
          aria-label="Toonify home"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="btn btn-primary btn-sm hidden sm:inline-flex"
          >
            Open studio <ArrowUpRight size={14} strokeWidth={2.6} />
          </Link>
          <button
            type="button"
            className="chip lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={15} /> : <Menu size={15} />}
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="border-t-2 border-ink bg-paper px-4 pb-4 pt-2 lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="card-flat flex items-center justify-between px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                {link.label}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
          <Link
            href="/studio"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-2 w-full"
          >
            Open studio <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </header>
  );
}

export default SiteNav;
