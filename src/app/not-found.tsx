import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { MascotStill } from "@/components/mascot/MascotStill";
import { DEMO_SPEC } from "@/lib/mascot/presets";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Toonify home">
            <Logo />
          </Link>
          <Link href="/studio" className="btn btn-primary btn-sm">
            Studio <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">404 · off-stage</p>
          <h1 className="text-[clamp(2.8rem,6vw,5rem)]">
            This page
            <br />
            missed the cue.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/65">
            The URL doesn&apos;t point to a mascot, a move, or a page. The rig is
            fine. The link is not. Head back to the studio and compile something
            that waves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="btn">
              <ArrowLeft size={13} /> Home
            </Link>
            <Link href="/studio" className="btn btn-primary">
              Open studio <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[340px]">
          <div className="card rotate-2 bg-white p-2">
            <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-butter">
              <div className="absolute inset-0 halftone opacity-30" />
              <MascotStill
                spec={{ ...DEMO_SPEC, mouth: "o" }}
                motion="idle"
                at={0.4}
                shadow="none"
                className="relative z-10"
              />
            </div>
          </div>
          <span className="absolute -left-3 -top-3 -rotate-6 rounded-full border-2 border-ink bg-coral px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em]">
            Not in the scene
          </span>
        </div>
      </div>
      <footer className="border-t-2 border-ink px-4 py-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
        Toonify · 18 bones, zero broken links (mostly)
      </footer>
    </main>
  );
}
