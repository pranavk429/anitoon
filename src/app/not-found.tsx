import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { MascotStill } from "@/components/mascot/MascotStill";
import { DEMO_SPEC } from "@/lib/mascot/presets";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-[#efece4] text-[#111111]">
      <header className="border-b border-[#d7d4cb] bg-[#efece4]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1140px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Anitoon home" className="rounded-[13px] inline-flex items-center">
            <Logo />
          </Link>
          <Link href="/studio" className="btn btn-primary btn-sm min-h-[38px] font-mono text-[12px]">
            Studio <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1140px] flex-1 items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ff5a45]" />
            404 · OFF-STAGE
          </p>
          <h1 className="type-h2-68 text-[#111111]">
            This page
            <br />
            missed the cue.
          </h1>
          <p className="mt-4 max-w-md type-body text-[#2c2823]">
            The URL doesn&apos;t point to a mascot, a move, or a page. The rig is
            fine. The link is not. Head back to the studio and compile something
            that waves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/" className="btn min-h-[44px]">
              <ArrowLeft size={14} /> Home
            </Link>
            <Link href="/studio" className="btn btn-primary min-h-[44px]">
              Open studio <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[340px]">
          <div className="card rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-3 shadow-md">
            <div className="relative overflow-hidden rounded-[17px] border border-[#d7d4cb] bg-[#ffc53d]/30 p-4">
              <div className="absolute inset-0 grid-paper opacity-50" />
              <MascotStill
                spec={{ ...DEMO_SPEC, mouth: "o" }}
                motion="idle"
                at={0.4}
                shadow="none"
                className="relative z-10"
              />
            </div>
          </div>
          <span className="absolute -left-3 -top-3 -rotate-6 rounded-full border border-[#d7d4cb] bg-[#ff5a45] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
            Not in the scene
          </span>
        </div>
      </div>
      <footer className="border-t border-[#d7d4cb] px-4 py-5 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-[#6f6759]">
        Anitoon · 18 bones, zero broken links (mostly)
      </footer>
    </main>
  );
}
