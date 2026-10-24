"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/studio", label: "Studio" },
  { href: "/#moves", label: "Moves" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d7d4cb] bg-[#efece4]/92 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[64px] max-w-[1140px] items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="rounded-[13px] py-1 inline-flex items-center"
          aria-label="Anitoon home"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <div className="hidden items-center gap-1.5 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 font-mono text-[12px] font-medium tracking-[0.04em] text-[#2c2823] transition-colors hover:bg-[#e2d8c6]/60 hover:text-[#111111]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/studio"
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full bg-[#4b63ff] px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.04em] text-white shadow-sm transition hover:bg-[#3850f3]"
          >
            Open studio <ArrowUpRight size={14} strokeWidth={2.4} />
          </Link>
          <div className="md:hidden">
            <button
              type="button"
              className="chip min-h-[38px] px-3.5"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
              <span className="sr-only sm:not-sr-only sm:inline">{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-[#d7d4cb] bg-[#efece4] px-4 pb-5 pt-3 md:hidden shadow-md"
        >
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="panel-tactile flex min-h-[44px] items-center justify-between px-3.5 py-2.5 font-mono text-[12px] tracking-[0.04em] text-[#111111]"
              >
                {link.label}
                <ArrowUpRight size={13} className="text-[#6f6759]" />
              </Link>
            ))}
          </div>
          <Link
            href="/studio"
            onClick={() => setOpen(false)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#4b63ff] px-4 py-3 font-mono text-[13px] font-semibold text-white shadow-sm"
          >
            Open studio <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </header>
  );
}

export default SiteNav;
