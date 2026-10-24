import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileArchive,
  FileCode2,
  FileImage,
  Layers,
  Mic,
  MoveRight,
  Play,
  Sparkles,
  Unlock,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { HeroStage } from "@/components/site/HeroStage";
import { PixelMascot } from "@/components/site/PixelMascot";
import { Logo } from "@/components/site/Logo";
import { MascotStill } from "@/components/mascot/MascotStill";
import { DEMO_SPEC, GALLERY, SAMPLE_PROMPTS } from "@/lib/mascot/presets";
import { MOTIONS } from "@/lib/mascot/animate";
import { encodeSpec } from "@/lib/mascot/spec";
import { renderStill } from "@/lib/mascot/svg";
import { sizeReport } from "@/lib/mascot/export";

const report = sizeReport(DEMO_SPEC, "wave");
const pixelSvg = renderStill(DEMO_SPEC, {
  width: 84,
  height: 86,
  motion: "idle",
  at: 0.2,
});

const MARQUEE_ITEMS = [
  "No raster",
  "No keyframes",
  "No lock-in",
  "18 bones",
  "11 real moves",
  "Lottie ready",
  "SVG forever",
  "0 image credits",
  "30fps",
];

const HOW = [
  {
    n: "01",
    title: "Describe",
    copy: "One sentence. A vibe, a color, a species. Type it or say it out loud — the compiler extracts the signals and never asks you to prompt-engineer.",
    accent: "bg-butter",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "Direct",
    copy: "Swap species, palette, eyes, patterns, accessories. Every change recompiles the same deterministic rig, so the character never drifts.",
    accent: "bg-mint",
    icon: Waypoints,
  },
  {
    n: "03",
    title: "Ship",
    copy: "Pick a move and export. Lottie for the site, SVG for the deck, PNG for the deck you'll present anyway, and a zip your developer will forgive you for.",
    accent: "bg-coral",
    icon: FileArchive,
  },
];

const FORMATS = [
  {
    name: "Lottie JSON",
    icon: Play,
    detail: `${report.lottieLabel} · ${report.layerCount} layers · 30fps`,
    note: "Verified in lottie-web",
    color: "bg-blue text-white",
  },
  {
    name: "SVG",
    icon: FileCode2,
    detail: `${report.svgLabel} · infinite scale · editable`,
    note: "Crisp at any size",
    color: "bg-butter text-ink",
  },
  {
    name: "PNG",
    icon: FileImage,
    detail: "1024 × 1024 · paper or transparent",
    note: "Canvas-rendered",
    color: "bg-mint text-ink",
  },
  {
    name: "SDK ZIP",
    icon: FileArchive,
    detail: "JSON · SVG · PNG · Mascot.tsx · README · preview",
    note: "Six files, zero deps",
    color: "bg-coral text-ink",
  },
];

const FAQ = [
  {
    q: "Is it actually free?",
    a: "Yes. No account, no credits, no trial timer, no card field that mysteriously appears at export. The compiler runs in your browser and the files are yours.",
  },
  {
    q: "Do I need design or animation skills?",
    a: "No. You pick a species, a palette, and a face from labelled options. The rig, the motion curves, and the bezier cleanup are already done. Designers can still get under the hood with the exported SVG and Lottie JSON.",
  },
  {
    q: "What exactly can I export?",
    a: "A layered SVG, a Lottie JSON with the move baked in, a 1024×1024 PNG, and a zip with all of it plus a dependency-free React component, a README, and an offline preview page.",
  },
  {
    q: "How is this different from an AI image mascot?",
    a: "An image is a picture of a mascot. Toonify compiles a real vector rig: separate limbs, a bone hierarchy, and authored motion. It stays crisp at billboard size, weighs kilobytes instead of megabytes, and every part can be edited later.",
  },
  {
    q: "Does it work without an account?",
    a: "All of it. Your mascot autosaves to your browser's local storage. Share links encode the entire design in the URL, so nobody needs to sign in to open or remix one.",
  },
  {
    q: "Can I use the mascots commercially?",
    a: "Yes — the exported files come with no attribution requirement and no runtime service. You own what you make. (Standard lawyer caveat: don't upload someone else's trademark and call it yours.)",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow mb-4 flex items-center gap-2 text-ink-soft">
      <span className="inline-block h-2 w-2 rounded-full bg-coral" />
      {children}
    </p>
  );
}

function PromptForm({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  return (
    <form action="/studio" method="get" className="relative">
      <label htmlFor={id} className="sr-only">
        Describe your mascot
      </label>
      <div
        className={`card-flat flex flex-col gap-2 bg-white p-2 sm:flex-row sm:items-center ${compact ? "" : "sm:p-2.5"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Sparkles
            size={18}
            strokeWidth={2.4}
            className="shrink-0 text-blue"
          />
          <input
            id={id}
            name="prompt"
            type="text"
            autoComplete="off"
            placeholder="A mischievous fox for our developer tool, cobalt accents…"
            className="min-w-0 flex-1 border-0 bg-transparent py-3 font-body text-[15px] text-ink outline-none placeholder:text-ink/40"
          />
        </div>
        <button type="submit" className="btn btn-primary shrink-0">
          Compile mascot
          <ArrowRight size={15} strokeWidth={2.6} />
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        {/* ---------------------------------------------------------- hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-20 h-[420px] w-[420px] rounded-full border-2 border-ink/10 halftone-blue opacity-50" />
          <div className="mx-auto grid min-w-0 max-w-[1240px] items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:gap-10 lg:pb-24 lg:pt-16">
            <div className="relative z-10 min-w-0">
              <p className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-2 shadow-[2px_2px_0_#17151C]">
                <span className="h-2 w-2 rounded-full bg-coral blink-dot" />
                Wispr Challenge · Track 2: No-Code
              </p>
              <h1 className="text-[clamp(2.55rem,6.2vw,5.6rem)]">
                Your brand,
                <br />
                but it{" "}
                <span className="scribble text-blue">waves back</span>.
              </h1>
              <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-ink/80 sm:text-lg">
                Type a sentence. Toonify compiles a{" "}
                <strong className="font-semibold text-ink">
                  layered vector mascot
                </strong>{" "}
                with a real bone rig and 11 authored moves — then hands you
                Lottie, SVG, PNG, and a drop-in SDK.
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                No image credits · No keyframes · No lock-in
              </p>

              <div className="mt-7">
                <PromptForm id="hero-prompt" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mono-label">Try:</span>
                {[
                  ["Sunny cat", 0],
                  ["Mischievous fox", 1],
                  ["Sleepy blob", 2],
                ].map(([label, index]) => (
                  <Link
                    key={label as string}
                    href={`/studio?prompt=${encodeURIComponent(SAMPLE_PROMPTS[index as number])}`}
                    className="chip bg-paper transition-colors hover:bg-butter"
                  >
                    {label}
                  </Link>
                ))}
                <span className="ml-1 hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft sm:inline-flex">
                  <Mic size={12} strokeWidth={2.4} /> or say it in the studio
                </span>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-dashed border-ink/20 pt-5">
                {[
                  ["8", "species"],
                  [String(report.boneCount), "bones"],
                  ["11", "moves"],
                  [report.svgLabel, "SVG"],
                ].map(([value, label]) => (
                  <div key={label} className="flex items-baseline gap-1.5">
                    <span className="font-display text-2xl font-black leading-none">
                      {value}
                    </span>
                    <span className="mono-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 min-w-0 lg:pl-4">
              <HeroStage />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- marquee */}
        <div className="relative overflow-hidden border-y-2 border-ink bg-blue py-3 text-white">
          <div className="marquee" aria-hidden="true">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="flex items-center gap-4 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em]"
                  >
                    {item}
                    <span className="text-butter">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------- difference */}
        <section className="relative border-b-2 border-ink bg-paper-2/50">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
              <div>
                <SectionLabel>The difference</SectionLabel>
                <h2 className="text-[clamp(2.4rem,4.4vw,4rem)]">
                  Stickers don&apos;t
                  <br />
                  build brands.
                </h2>
              </div>
              <p className="max-w-xl text-[16px] leading-[1.6] text-ink/75 lg:pb-2">
                Most mascot generators give you a raster image with three
                invisible bones and a motion preset. It looks fine until it
                needs to scale, wave, or be edited by anyone. Toonify compiles
                geometry and motion instead of drawing a picture.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="card relative flex h-full flex-col overflow-hidden bg-[#f1e8e3] p-5">
                <div className="flex items-center justify-between">
                  <span className="chip border-coral bg-white text-coral">
                    <X size={12} strokeWidth={3} /> Raster puppet
                  </span>
                  <span className="mono-label">ai-image-mascot.png</span>
                </div>
                <div className="relative mt-5 flex flex-1 items-center overflow-hidden rounded-xl border-2 border-ink/30 bg-white/70">
                  <div className="absolute inset-0 z-10 halftone opacity-30" />
                  <PixelMascot
                    svg={pixelSvg}
                    alt="A deliberately low-resolution mascot, representing a raster image"
                    pixels={84}
                    className="opacity-80 blur-[0.2px]"
                  />
                  <div className="absolute left-[50%] top-[30%] z-20 h-3 w-3 rounded-full border-2 border-white bg-coral" />
                  <div className="absolute left-[36%] top-[62%] z-20 h-3 w-3 rounded-full border-2 border-white bg-coral" />
                  <div className="absolute left-[64%] top-[68%] z-20 h-3 w-3 rounded-full border-2 border-white bg-coral" />
                  <span className="absolute bottom-2 left-2 z-20 rounded-full bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                    3 bones · 4.2 MB
                  </span>
                </div>
                <ul className="mt-5 grid gap-2 text-sm text-ink/65">
                  {[
                    "Blurry at billboard size",
                    "Limbs are baked into one image",
                    "Every edit needs a new generation",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X
                        size={14}
                        strokeWidth={3}
                        className="mt-0.5 shrink-0 text-coral"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card relative overflow-hidden border-blue p-5 shadow-[8px_8px_0_#2B4BF2]">
                <div className="flex items-center justify-between">
                  <span className="chip bg-mint">
                    <Waypoints size={12} strokeWidth={2.8} /> Real vector rig
                  </span>
                  <span className="mono-label">mochi-wave.svg</span>
                </div>
                <div className="relative mt-5 overflow-hidden rounded-xl border-2 border-ink bg-white">
                  <div className="absolute inset-0 halftone opacity-30" />
                  <MascotStill
                    spec={DEMO_SPEC}
                    motion="wave"
                    at={0.22}
                    showRig
                    className="relative z-10 w-full"
                  />
                  <span className="absolute bottom-2 left-2 z-20 rounded-full bg-blue px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                    {report.boneCount} bones · {report.svgLabel}
                  </span>
                </div>
                <ul className="mt-5 grid gap-2 text-sm text-ink/75">
                  {[
                    "Crisp at any size, forever",
                    "Limbs, tail and ears move independently",
                    "Lottie + SVG + React, all editable",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        size={14}
                        strokeWidth={3}
                        className="mt-0.5 shrink-0 text-blue"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Zap,
                  title: "Instant, deterministic",
                  copy: "Same sentence, same mascot. Zero render queues.",
                },
                {
                  icon: Layers,
                  title: "18 real joints",
                  copy: "A hierarchy, not a bendy JPEG.",
                },
                {
                  icon: FileCode2,
                  title: "Kilobytes, not megabytes",
                  copy: `${report.svgLabel} SVG · ${report.lottieLabel} Lottie.`,
                },
                {
                  icon: Unlock,
                  title: "Yours with no asterisk",
                  copy: "No attribution, no runtime API, no lock-in.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="card-flat flex gap-3 p-4 shadow-[3px_3px_0_#17151C]"
                >
                  <item.icon
                    size={18}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0 text-blue"
                  />
                  <div>
                    <p className="font-display text-[15px] font-bold leading-tight">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-snug text-ink/60">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- how it works */}
        <section id="how" className="border-b-2 border-ink bg-paper">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel>How it works</SectionLabel>
                <h2 className="max-w-[16ch] text-[clamp(2.4rem,4.4vw,4rem)]">
                  Three steps. One of them is a sentence.
                </h2>
              </div>
              <p className="max-w-sm text-[15px] leading-relaxed text-ink/65">
                The whole compile happens locally in under a second. No upload,
                no queue, no “generation failed, try again” screen.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {HOW.map((step, i) => (
                <div
                  key={step.n}
                  className={`card relative overflow-hidden p-5 ${i === 1 ? "lg:-translate-y-3" : ""} ${i === 2 ? "lg:translate-y-2" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink ${step.accent} shadow-[2px_2px_0_#17151C]`}
                    >
                      <step.icon size={19} strokeWidth={2.4} />
                    </div>
                    <span className="font-display text-5xl font-black leading-none text-ink/10">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
                    {step.copy}
                  </p>

                  <div className="mt-5 rounded-xl border-2 border-dashed border-ink/25 bg-paper/60 p-3">
                    {i === 0 && (
                      <div className="space-y-2">
                        <p className="mono-label">Your brief</p>
                        <p className="rounded-lg border-2 border-ink bg-white px-3 py-2 text-[13px] leading-snug">
                          A mischievous fox for our developer tool, cobalt
                          accents, sparkly eyes
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue align-middle" />
                        </p>
                        <div className="flex gap-1.5">
                          <span className="chip bg-butter">Fox detected</span>
                          <span className="chip bg-white">2 colors</span>
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      <div>
                        <p className="mono-label mb-2">Direct the rig</p>
                        <div className="flex items-center gap-2">
                          {GALLERY.slice(0, 4).map((g) => (
                            <span
                              key={g.spec.name}
                              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-white"
                            >
                              <MascotStill
                                spec={g.spec}
                                className="w-14"
                                shadow="none"
                              />
                            </span>
                          ))}
                          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-ink/40 font-mono text-[9px]">
                            +4
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {["#2B4BF2", "#FF5A45", "#FFC53D", "#6FD6A8"].map(
                            (c) => (
                              <span
                                key={c}
                                className="h-5 w-5 rounded-full border-2 border-ink"
                                style={{ background: c }}
                              />
                            ),
                          )}
                          <span className="chip ml-auto bg-white">
                            Sparkle eyes
                          </span>
                        </div>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="space-y-1.5">
                        <p className="mono-label mb-2">One click, four files</p>
                        {[
                          ["Lottie", report.lottieLabel, "bg-blue text-white"],
                          ["SVG", report.svgLabel, "bg-butter"],
                          ["PNG", "1024²", "bg-mint"],
                          ["SDK", "6 files", "bg-coral"],
                        ].map(([name, size, color]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-lg border-2 border-ink bg-white px-2.5 py-1.5"
                          >
                            <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
                              {name}
                            </span>
                            <span
                              className={`rounded-full border border-ink px-2 py-0.5 font-mono text-[9px] ${color}`}
                            >
                              {size}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/studio" className="btn btn-primary">
                Try it with your own sentence
                <ArrowUpRight size={15} />
              </Link>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                No account · autosaves locally · share by URL
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- moves */}
        <section
          id="moves"
          className="relative overflow-hidden border-b-2 border-ink bg-ink text-paper"
        >
          <div className="pointer-events-none absolute inset-0 halftone opacity-[0.07]" />
          <div className="relative mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow mb-4 flex items-center gap-2 text-paper/60">
                  <span className="inline-block h-2 w-2 rounded-full bg-butter" />
                  The move library
                </p>
                <h2 className="text-[clamp(2.4rem,4.4vw,4rem)] text-paper">
                  Eleven moves.
                  <br />
                  <span className="text-butter">No keyframes.</span>
                </h2>
              </div>
              <p className="max-w-sm text-[15px] leading-relaxed text-paper/60">
                Authored on a real skeleton, then baked at 30fps. Every move
                works on every species, every palette, every accessory. Click
                one to open it in the studio.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {MOTIONS.map((motion, i) => {
                const item = GALLERY[i % GALLERY.length];
                const href = `/studio?m=${encodeSpec(item.spec)}&move=${motion.id}`;
                return (
                  <Link
                    key={motion.id}
                    href={href}
                    className="group relative overflow-hidden rounded-2xl border-2 border-paper/80 bg-paper p-2 text-ink transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-1deg] focus-visible:-translate-y-1.5"
                  >
                    <div
                      className="relative overflow-hidden rounded-xl border-2 border-ink"
                      style={{ background: item.color }}
                    >
                      <MascotStill
                        spec={item.spec}
                        motion={motion.id}
                        at={0.32}
                        shadow="none"
                        className="transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <span className="absolute right-1.5 top-1.5 rounded-full border border-ink bg-white/90 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]">
                        {motion.duration}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-extrabold leading-none">
                          {motion.name}
                        </p>
                        <p className="mt-1 truncate font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-soft">
                          {motion.label}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={15}
                        strokeWidth={2.6}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </Link>
                );
              })}
              <div className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-paper/25 p-4">
                <Sparkles size={20} className="text-butter" />
                <div>
                  <p className="font-display text-xl font-bold leading-tight text-paper">
                    Need a move that isn&apos;t here?
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-paper/55">
                    The rig is standard Lottie. Animate it yourself, or remix
                    one of these.
                  </p>
                  <Link
                    href="/studio"
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-butter"
                  >
                    Open studio <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-paper/70">
              <span className="mono-label text-paper/40">Also included:</span>
              {MOTIONS.slice(0, 11).map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border border-paper/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]"
                >
                  {m.id}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- exports */}
        <section id="export" className="border-b-2 border-ink bg-paper">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <div>
                <SectionLabel>Ship it</SectionLabel>
                <h2 className="text-[clamp(2.4rem,4.4vw,4rem)]">
                  Export before
                  <br />
                  the meeting ends.
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
                  Every export comes from the same scene graph. The Lottie is
                  not a guess at the SVG — it&apos;s the same geometry and the
                  same sampled transforms, verified in lottie-web.
                </p>

                <div className="mt-7 rounded-2xl border-2 border-ink bg-ink p-1 shadow-[6px_6px_0_#FFC53D]">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/45">
                      mascot.tsx
                    </span>
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-coral" />
                      <span className="h-2 w-2 rounded-full bg-butter" />
                      <span className="h-2 w-2 rounded-full bg-mint" />
                    </span>
                  </div>
                  <pre className="scrollbar-thin overflow-x-auto rounded-xl bg-[#0f0e13] p-4 font-mono text-[11px] leading-[1.75] text-[#e8e2d5]">
                    <code>
                      <span className="text-[#8f88a0]">
                        {"// "}
                        {report.layerCount} layers · {report.lottieLabel} · 30fps
                      </span>
                      {"\n"}
                      <span className="text-[#c9b6ff]">import</span> lottie{" "}
                      <span className="text-[#c9b6ff]">from</span>{" "}
                      <span className="text-[#ffc53d]">&quot;lottie-web&quot;</span>;
                      {"\n"}
                      <span className="text-[#c9b6ff]">import</span> mascot{" "}
                      <span className="text-[#c9b6ff]">from</span>{" "}
                      <span className="text-[#ffc53d]">
                        &quot;./mochi-wave.json&quot;
                      </span>
                      ;{"\n\n"}
                      lottie.loadAnimation({`{`}
                      {"\n  "}container:{" "}
                      <span className="text-[#6fd6a8]">
                        document.querySelector(&quot;#mascot&quot;)
                      </span>
                      ,{"\n  "}renderer:{" "}
                      <span className="text-[#ffc53d]">&quot;svg&quot;</span>,
                      {"\n  "}loop:{" "}
                      <span className="text-[#ff5a45]">true</span>,{"\n  "}
                      autoplay: <span className="text-[#ff5a45]">true</span>,
                      {"\n  "}animationData: mascot,{"\n"}
                      {`}`});
                    </code>
                  </pre>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip bg-mint">
                    <Check size={12} strokeWidth={3} /> Verified in lottie-web
                  </span>
                  <span className="chip bg-white">
                    {report.boneCount} bones · {report.layerCount} layers
                  </span>
                  <span className="chip bg-white">No runtime calls</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {FORMATS.map((format, i) => (
                  <div
                    key={format.name}
                    className={`card flex flex-col justify-between p-4 sm:p-5 ${i === 0 ? "sm:-rotate-1" : ""} ${i === 3 ? "sm:rotate-1" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink ${format.color}`}
                      >
                        <format.icon size={18} strokeWidth={2.4} />
                      </span>
                      <span className="mono-label text-right">
                        {format.note}
                      </span>
                    </div>
                    <div className="mt-5 sm:mt-8">
                      <h3 className="text-lg sm:text-xl">{format.name}</h3>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                        {format.detail}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-ink/30 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold">
                        The zip a developer can actually open.
                      </p>
                      <p className="mt-1 text-[13px] leading-snug text-ink/60">
                        JSON, SVG, PNG, a typed React component, README, and a
                        preview page with the animation inlined.
                      </p>
                    </div>
                    <Link href="/studio" className="btn btn-sm">
                      Build yours <MoveRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- gallery */}
        <section id="gallery" className="border-b-2 border-ink bg-paper-2/40">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel>The gallery</SectionLabel>
                <h2 className="text-[clamp(2.4rem,4.4vw,4rem)]">
                  Eight mascots walk
                  <br />
                  into a brand.
                </h2>
              </div>
              <p className="max-w-sm text-[15px] leading-relaxed text-ink/65">
                Deterministic specs, no renders, no retouching. Open any one in
                the studio to change a color, a face, or an entire species.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {GALLERY.map((item, i) => (
                <Link
                  key={item.spec.name}
                  href={`/studio?m=${encodeSpec(item.spec)}`}
                  className={`group overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_#17151C] transition-transform duration-200 hover:-translate-y-1.5 ${
                    i % 3 === 0 ? "lg:-rotate-1" : i % 3 === 1 ? "lg:rotate-[0.5deg]" : ""
                  }`}
                >
                  <div
                    className="relative border-b-2 border-ink"
                    style={{ background: item.color }}
                  >
                    <div className="absolute inset-0 halftone opacity-30" />
                    <MascotStill
                      spec={item.spec}
                      motion={i % 2 === 0 ? "wave" : "idle"}
                      at={0.25 + (i % 3) * 0.06}
                      shadow="none"
                      className="relative z-10 p-1 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-2 top-2 z-20 rounded-full border-2 border-ink bg-white px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]">
                      {item.spec.species}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl font-extrabold leading-none">
                        {item.spec.name}
                      </p>
                      <p className="mt-1 line-clamp-2 font-mono text-[8.5px] uppercase leading-tight tracking-[0.09em] text-ink-soft">
                        {item.spec.tagline}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={2.6}
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- faq */}
        <section id="faq" className="border-b-2 border-ink bg-paper">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:py-24">
            <div>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-[clamp(2.4rem,4.4vw,4rem)]">
                Questions,
                <br />
                answered plainly.
              </h2>
              <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-ink/60">
                Still stuck? The studio has a one-click “Surprise me” and no
                way to break the renderer. That counts as support.
              </p>
            </div>
            <div className="divide-y-2 divide-ink/10 border-y-2 border-ink/10">
              {FAQ.map((item, i) => (
                <details key={item.q} className="group" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-lg font-bold leading-tight sm:text-xl">
                      {item.q}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white transition-transform group-open:rotate-45">
                      <span className="relative block h-3 w-3">
                        <span className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 bg-ink" />
                        <span className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 bg-ink" />
                      </span>
                    </span>
                  </summary>
                  <p className="max-w-[58ch] pb-5 pr-8 text-[14px] leading-relaxed text-ink/65">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- final cta */}
        <section className="bg-paper px-4 py-16 sm:px-6 lg:py-20">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border-2 border-ink bg-blue text-white shadow-[10px_10px_0_#17151C]">
            <div className="pointer-events-none absolute inset-0 halftone opacity-20" />
            <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-12">
              <div>
                <p className="eyebrow mb-4 text-white/60">
                  WeMakeDevs × Wispr Flow · Track 2
                </p>
                <h2 className="text-[clamp(2.6rem,5vw,4.6rem)] text-white">
                  Give your brand
                  <br />
                  a body.
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/75">
                  One sentence in. A rigged, waving, exportable mascot out.
                  Free, instant, and yours to keep.
                </p>
                <div className="mt-6 max-w-xl">
                  <PromptForm id="cta-prompt" />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
                  No sign-up · local-first · works on your phone
                </p>
              </div>
              <div className="relative mx-auto w-full max-w-[300px]">
                <div className="rotate-2 rounded-2xl border-2 border-ink bg-white p-2 shadow-[6px_6px_0_#17151C]">
                  <MascotStill
                    spec={DEMO_SPEC}
                    motion="celebrate"
                    at={0.3}
                    shadow="soft"
                  />
                </div>
                <span className="absolute -left-3 -top-3 -rotate-6 rounded-full border-2 border-ink bg-butter px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink">
                  Ready in 0.4s
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ----------------------------------------------------------- footer */}
      <footer className="border-t-2 border-ink bg-paper-2/60">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink/60">
              A vector mascot compiler for people who have a brand voice but
              not a motion designer.
            </p>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
              Built for the Wispr Challenge — Track 2: No-Code
            </p>
          </div>
          <div>
            <p className="mono-label mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/studio" className="hover:underline">
                  Studio
                </Link>
              </li>
              <li>
                <Link href="/#how" className="hover:underline">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#moves" className="hover:underline">
                  Move library
                </Link>
              </li>
              <li>
                <Link href="/#gallery" className="hover:underline">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mono-label mb-3">Details</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#faq" className="hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/#export" className="hover:underline">
                  Exports
                </Link>
              </li>
              <li>
                <Link href="/studio?prompt=surprise+me" className="hover:underline">
                  Surprise me
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink/15">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft sm:px-6">
            <span>© 2026 Toonify. No fake logos, no fake customers.</span>
            <span>Made from vectors, vectors, and more vectors.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
