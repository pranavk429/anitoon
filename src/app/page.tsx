import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  FileArchive,
  FileCode2,
  FileImage,
  Play,
  Share2,
  Zap,
} from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { HeroStage } from "@/components/site/HeroStage";
import { Logo } from "@/components/site/Logo";
import { MascotStill } from "@/components/mascot/MascotStill";
import { DEMO_SPEC, GALLERY, SAMPLE_PROMPTS } from "@/lib/mascot/presets";
import { MOTIONS } from "@/lib/mascot/animate";
import { sizeReport } from "@/lib/mascot/export";
import { renderStill } from "@/lib/mascot/svg";

const report = sizeReport(DEMO_SPEC, "wave");

const MARQUEE_ITEMS_1 = [
  "18 bones",
  "11 authored moves",
  "0 image credits",
  "Lottie ready",
  "SVG forever",
  "100% vector",
  "Drop-in React SDK",
  "Deterministic rig",
  "30fps motion",
];

const MARQUEE_ITEMS_2 = [
  "WeMakeDevs × Wispr Flow",
  "Track 2: No-Code",
  "Vectors, not pixels",
  "Zero runtime APIs",
  "Local browser compiler",
  "Clean bezier art",
  "No keyframing required",
];

const CAPABILITIES = [
  {
    name: "Lottie JSON",
    icon: Play,
    detail: `${report.lottieLabel} · ${report.layerCount} layers · 30fps`,
    note: "Web, iOS, Android",
  },
  {
    name: "Layered SVG",
    icon: FileCode2,
    detail: `${report.svgLabel} · infinite scale · clean DOM`,
    note: "Crisp at billboard size",
  },
  {
    name: "Crisp PNG",
    icon: FileImage,
    detail: "1024 × 1024 · canvas rendered · transparent",
    note: "Ready for Figma & decks",
  },
  {
    name: "React SDK",
    icon: FileArchive,
    detail: "Mascot.tsx · drop-in component · 0 deps",
    note: "Instant dev integration",
  },
  {
    name: "Share Links",
    icon: Share2,
    detail: "URL-encoded spec · zero database dependency",
    note: "Instant remixing",
  },
  {
    name: "No-Code Core",
    icon: Zap,
    detail: "Natural voice & text parser · 0 API delay",
    note: "Runs 100% in browser",
  },
];

const WHERE_SHIPS = [
  {
    n: "01",
    title: "Landing pages & hero greeters",
    copy: "Delight visitors with a living brand face that waves, celebrates, or points to key actions without heavy video files.",
  },
  {
    n: "02",
    title: "Product tours & onboarding",
    copy: "Guide new users step-by-step with celebratory animations that feel responsive, lightweight, and human.",
  },
  {
    n: "03",
    title: "Empty states & error pages",
    copy: "Turn zero-data states and 404 screens into warm memorable interactions that build trust.",
  },
  {
    n: "04",
    title: "Pitch decks, docs & social",
    copy: "Consistent vector art that exports cleanly to Figma, slides, avatars, and video overlays with zero pixelation.",
  },
];

const FAQ = [
  {
    q: "Is Anitoon actually free?",
    a: "Yes. No account, no credits, no trial timer, and no credit card field. The compiler runs entirely in your browser and all exported files are yours.",
  },
  {
    q: "Do I need design or animation skills?",
    a: "No. You describe your character or choose species, palette, and accessories. The 18-bone rig, easing curves, and bezier cleanup are pre-authored.",
  },
  {
    q: "How is Anitoon different from an AI image mascot?",
    a: "An image generator outputs flat raster pixels. Anitoon compiles a real vector rig: layered SVG geometry, bone hierarchies, and 11 authored moves at kilobyte sizes.",
  },
  {
    q: "What formats can I export?",
    a: "Layered SVG, Lottie JSON with motion baked in, 1024×1024 transparent PNG, and a full SDK zip with Mascot.tsx, README, and an offline preview page.",
  },
  {
    q: "Can I use the mascots commercially?",
    a: "Yes — exported files come with no attribution requirement and no runtime service. You own what you create.",
  },
];

function PromptForm({ id }: { id: string }) {
  return (
    <form action="/studio" method="get" className="relative w-full max-w-[620px]">
      <label htmlFor={id} className="sr-only">
        Describe your brand mascot
      </label>
      <div className="panel-tactile flex items-center gap-2 p-2 sm:p-2.5">
        <input
          id={id}
          type="text"
          name="prompt"
          defaultValue=""
          placeholder="A sunny orange cat named Mochi with a blue scarf…"
          className="min-h-[44px] flex-1 border-0 bg-transparent px-3 text-[15px] font-medium text-[#111111] outline-none placeholder:text-[#6f6759]"
        />
        <Link
          href="/studio"
          className="btn btn-primary min-h-[44px] shrink-0 px-5 font-mono text-[12px] font-semibold text-white shadow-sm"
        >
          Open studio <ArrowRight size={14} strokeWidth={2.4} />
        </Link>
      </div>
    </form>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[#efece4] text-[#111111]">
      <SiteNav />

      <main id="main" className="flex-1">
        {/* =========================================================================
            SECTION 1: HERO (Role: hero, Target Height: ~939px, Bg: #efece4)
        ========================================================================= */}
        <section
          role="region"
          aria-label="Hero"
          className="relative overflow-hidden border-b border-[#d7d4cb] bg-[#efece4] pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16"
        >
          {/* Subtle floating 3D props */}
          <div className="pointer-events-none absolute -left-10 top-16 z-0 hidden lg:block opacity-90 animate-pulse">
            <Image
              src="/art/prop-star.webp"
              alt=""
              width={140}
              height={140}
              unoptimized
              className="drop-shadow-[0_8px_16px_rgba(40,34,22,0.12)]"
            />
          </div>
          <div className="pointer-events-none absolute right-10 top-20 z-0 hidden lg:block opacity-90">
            <Image
              src="/art/prop-spark.webp"
              alt=""
              width={130}
              height={130}
              priority
              unoptimized
              className="float-soft drop-shadow-[0_8px_16px_rgba(40,34,22,0.12)]"
            />
          </div>
          <div className="pointer-events-none absolute left-1/4 bottom-8 z-0 hidden xl:block opacity-80">
            <Image
              src="/art/prop-squiggle.webp"
              alt=""
              width={160}
              height={160}
              unoptimized
              className="drop-shadow-[0_8px_16px_rgba(40,34,22,0.12)]"
            />
          </div>
          <div className="pointer-events-none absolute right-1/4 top-10 z-0 hidden xl:block opacity-85">
            <Image
              src="/art/prop-eye.webp"
              alt=""
              width={100}
              height={100}
              unoptimized
              className="drop-shadow-[0_8px_16px_rgba(40,34,22,0.12)]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="flex flex-col items-center text-center">
              {/* Eyebrow */}
              <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-4">
                <span className="inline-block h-2 w-2 rounded-full bg-[#4b63ff]" />
                VECTOR MASCOT COMPILER · NO-CODE ENGINE
              </p>

              {/* Giant 3D signature wordmark */}
              <div className="relative mb-3 flex items-center justify-center">
                <Image
                  src="/art/anitoon-wordmark.webp"
                  alt="ANITOON"
                  width={501}
                  height={180}
                  priority
                  unoptimized
                  className="max-h-[140px] w-auto object-contain mix-blend-multiply drop-shadow-[0_10px_14px_rgba(40,34,22,0.14)] sm:max-h-[170px] lg:max-h-[200px]"
                />
              </div>

              {/* Headline */}
              <h1 className="type-h2-68 text-[#111111] max-w-[900px] text-center mt-1 mb-4">
                Your brand, but it waves back.
              </h1>

              {/* Subhead */}
              <p className="type-body-lg text-[#2c2823] max-w-[680px] text-center mb-8">
                Describe or voice a character. Anitoon compiles a real layered vector
                mascot with 18 bones, 11 authored moves, and instant Lottie, SVG, PNG,
                and React SDK exports. No image credits, no runtime lock-in.
              </p>

              {/* Interactive prompt form */}
              <div className="mb-4 w-full flex justify-center">
                <PromptForm id="hero-prompt" />
              </div>

              {/* Sample prompt chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                <span className="type-body-xs text-[#6f6759]">Try:</span>
                {SAMPLE_PROMPTS.slice(0, 3).map((s) => (
                  <Link
                    key={s}
                    href={`/studio?prompt=${encodeURIComponent(s)}`}
                    className="chip radius-xs min-h-[30px] border-[#d7d4cb] bg-[#fefdf9] text-[#111111] hover:border-[#4b63ff]"
                  >
                    {s}
                  </Link>
                ))}
              </div>

              {/* Live interactive mascot stage */}
              <div className="w-full max-w-[760px]">
                <HeroStage />
              </div>
            </div>
          </div>

          {/* Giant background watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-0 select-none overflow-hidden opacity-[0.035]"
          >
            <span className="type-heading-300 text-[#111111]">ANITOON</span>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: SELECTED WORK (Role: hero, Target Height: ~1566px, 2 Cols)
        ========================================================================= */}
        <section
          id="work"
          role="region"
          aria-label="Selected compiled mascots"
          className="border-b border-[#d7d4cb] bg-[#efece4] py-16 sm:py-20 lg:py-[108px]"
        >
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#ff5a45]" />
                  SELECTED COMPILED MASCOTS
                </p>
                <h2 className="type-h2-60 text-[#111111]">
                  Things we&apos;ve compiled. Mascots with bones.
                </h2>
              </div>
              <Link
                href="/studio"
                className="btn btn-primary min-h-[44px] font-mono text-[12px] self-start md:self-end"
              >
                Compile your own <ArrowUpRight size={14} />
              </Link>
            </div>

            {/* 2-Column Mascot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {GALLERY.slice(0, 4).map((item, idx) => {
                const stillSvg = renderStill(item.spec, {
                  width: 320,
                  height: 330,
                  motion: idx % 2 === 0 ? "wave" : "jump",
                  at: 0.28,
                  shadow: "soft",
                });
                return (
                  <div
                    key={item.spec.name}
                    className="card card-xl group relative overflow-hidden rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-6 sm:p-8 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="panel-tactile px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#111111]">
                          0{idx + 1} · {item.spec.species}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6f6759]">
                          18 bones · 11 moves
                        </span>
                      </div>

                      <div className="relative flex justify-center py-6 bg-[#efece4]/50 rounded-[17px] border border-[#d7d4cb]/60 mb-6 group-hover:scale-[1.02] transition-transform duration-500">
                        <div
                          className="w-[260px] h-[270px] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: stillSvg }}
                        />
                      </div>

                      <h3 className="type-h2-48 text-[#111111] mb-2">{item.spec.name}</h3>
                      <p className="type-body text-[#2c2823] mb-4">{item.blurb}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#d7d4cb] pt-4 mt-2">
                      <span className="type-body-xs-12 text-[#6f6759]">
                        {item.spec.tagline}
                      </span>
                      <Link
                        href={`/studio?prompt=${encodeURIComponent(`${item.spec.name} the ${item.spec.vibe} ${item.spec.species}`)}`}
                        className="inline-flex min-h-[36px] items-center gap-1.5 font-mono text-[12.5px] font-semibold text-[#4b63ff] hover:underline"
                      >
                        Open in studio <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: TICKER 1 (Role: section, Target Height: ~48px, Bg: #efece4)
        ========================================================================= */}
        <section
          role="region"
          aria-label="Capabilities ticker"
          className="min-h-[120px] py-9 overflow-hidden border-b border-[#d7d4cb] bg-[#efece4] flex flex-col justify-center"
        >
          <div className="marquee flex items-center gap-8 whitespace-nowrap font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#2c2823]">
            {MARQUEE_ITEMS_1.concat(MARQUEE_ITEMS_1).map((item, i) => (
              <span key={i} className="flex items-center gap-8">
                <span>{item}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#4b63ff]" />
              </span>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: TICKER 2 (Role: section, Target Height: ~48px, Bg: #efece4)
        ========================================================================= */}
        <section
          role="region"
          aria-label="Hackathon ticker"
          className="min-h-[120px] py-9 overflow-hidden border-b border-[#d7d4cb] bg-[#efece4] flex flex-col justify-center"
        >
          <div className="marquee marquee-slow flex items-center gap-8 whitespace-nowrap font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#6f6759]">
            {MARQUEE_ITEMS_2.concat(MARQUEE_ITEMS_2).map((item, i) => (
              <span key={i} className="flex items-center gap-8">
                <span>{item}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffc53d]" />
              </span>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: MANIFESTO & MOTION SHEET (Role: section, ~1325px, 2 Cols)
        ========================================================================= */}
        <section
          id="moves"
          role="region"
          aria-label="Manifesto and 11 moves sheet"
          className="border-b border-[#d7d4cb] bg-[#efece4] py-16 sm:py-20 lg:py-[108px]"
        >
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Manifesto Card (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="card card-xl rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-6 sm:p-8 shadow-sm">
                  <div className="relative flex justify-center py-6 bg-[#efece4]/70 rounded-[17px] border border-[#d7d4cb] mb-6">
                    <span className="absolute -top-3 right-4 panel-pill radius-xs px-3 py-1 font-mono text-[11px] font-bold text-[#4b63ff] bg-[#fefdf9] shadow-sm">
                      That&apos;s Ani
                    </span>
                    <MascotStill
                      spec={DEMO_SPEC}
                      motion="wave"
                      className="w-[200px] h-[200px] drop-shadow-[0_4px_8px_rgba(40,34,22,0.1)]"
                    />
                  </div>

                  <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#4b63ff]" />
                    THE ANITOON MANIFESTO
                  </p>
                  <p className="type-body-lg-17 text-[#4b63ff] font-bold mb-2">
                    Living Vector Mascot Compiler
                  </p>
                  <h3 className="type-h2 text-[#111111] mb-2">
                    Why real bones beat raster stickers.
                  </h3>
                  <p className="type-body-lg-19 text-[#111111] mb-4">
                    100% Client-Side Vector Generation · Zero API Delay
                  </p>
                  <div className="space-y-4 text-[#2c2823] type-body">
                    <p>
                      Generative AI gave us millions of static pictures of mascots: flat bitmaps that blur when scaled, stay frozen in one posture, and require monthly credit top-ups.
                    </p>
                    <p>
                      Anitoon compiles real vector bones. The character has limbs, eyes, a spine, and an 18-bone rig with authored motion. When you need it to wave, it waves. When you need it in your mobile app, it exports as a single Lottie file.
                    </p>
                    <p className="font-medium text-[#111111]">
                      No raster artifacts. No keyframe misery. No runtime bill.
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#d7d4cb] flex items-center justify-between">
                    <span className="type-body-xs text-[#6f6759]">100% Client-Side Engine</span>
                    <Link
                      href="/studio"
                      className="btn btn-primary min-h-[38px] font-mono text-[11px]"
                    >
                      Open Studio <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: 11-Move Motion Sheet (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="mb-6">
                  <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#6fd6a8]" />
                    11-MOVE CONTACT SHEET
                  </p>
                  <h3 className="type-h2-48 text-[#111111]">
                    Authored moves. Ready to ship.
                  </h3>
                  <p className="type-body text-[#2c2823] mt-2">
                    Every mascot compiles with 11 authored motion curves. Click any pose to load it in the studio.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {MOTIONS.map((m) => {
                    const poseSvg = renderStill(DEMO_SPEC, {
                      width: 140,
                      height: 140,
                      motion: m.id,
                      at: 0.35,
                      shadow: "none",
                    });
                    return (
                      <Link
                        key={m.id}
                        href={`/studio?move=${m.id}`}
                        className="card group rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-3 text-center transition hover:border-[#4b63ff] hover:shadow-md flex flex-col items-center justify-between min-h-[180px]"
                      >
                        <div
                          className="w-[110px] h-[110px] flex items-center justify-center py-1 group-hover:scale-105 transition-transform"
                          dangerouslySetInnerHTML={{ __html: poseSvg }}
                        />
                        <div className="w-full border-t border-[#d7d4cb]/70 pt-2 flex items-center justify-between px-1">
                          <span className="type-body-xs font-semibold uppercase text-[#111111]">
                            {m.name}
                          </span>
                          <span className="type-body-xs-12 text-[#6f6759]">
                            {m.duration}s
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: SHIPS WITH (Role: section, Target Height: ~223px, Bg: #efece4)
        ========================================================================= */}
        <section
          role="region"
          aria-label="Capabilities and export formats"
          className="border-b border-[#d7d4cb] bg-[#efece4] py-14 sm:py-16"
        >
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div>
                <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#4b63ff]" />
                  SHIPS WITH EVERY MASCOT
                </p>
                <h3 className="type-body-xl-24 text-[#111111]">
                  Zero-lock-in exports that your engineers will thank you for.
                </h3>
              </div>
              <span className="type-body-xs text-[#6f6759] font-mono">
                Lottie · SVG · PNG · React TSX
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.name}
                    className="panel-tactile radius-md border border-[#d7d4cb] bg-[#fefdf9] p-3.5 flex flex-col justify-between min-h-[120px]"
                  >
                    <div className="flex items-center justify-between">
                      <Icon size={18} className="text-[#4b63ff]" />
                      <span className="type-body-xs text-[#6f6759]">0 deps</span>
                    </div>
                    <div>
                      <p className="type-body-15 font-semibold text-[#111111]">{c.name}</p>
                      <p className="type-body-xs text-[#6f6759] mt-0.5 truncate">{c.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: WHERE MASCOTS SHIP & FAQ (Role: section, ~1204px, 2 Cols)
        ========================================================================= */}
        <section
          id="how"
          role="region"
          aria-label="Where mascots ship and FAQ"
          className="border-b border-[#d7d4cb] bg-[#efece4] py-16 sm:py-20 lg:py-[108px]"
        >
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Where Mascots Ship (6 Cols) */}
              <div className="lg:col-span-6">
                <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#ff5a45]" />
                  DEPLOYMENT TOUCHPOINTS
                </p>
                <h3 className="type-h2-48 text-[#111111] mb-8">
                  Where mascots ship in real products.
                </h3>

                <div className="divide-y divide-[#d7d4cb]">
                  {WHERE_SHIPS.map((item) => (
                    <div
                      key={item.n}
                      className="py-6 first:pt-0 last:pb-0 group transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <span className="panel-tactile radius-xs px-2.5 py-1 font-mono text-[11px] font-bold text-[#4b63ff] bg-[#fefdf9]">
                          {item.n}
                        </span>
                        <div>
                          <h4 className="type-body-xl-22 text-[#111111] mb-1.5">
                            {item.title}
                          </h4>
                          <p className="type-body text-[#2c2823]">{item.copy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: FAQ (6 Cols) */}
              <div id="faq" className="lg:col-span-6">
                <p className="type-body-xs uppercase tracking-[1.1px] text-[#6f6759] flex items-center gap-2 mb-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#ffc53d]" />
                  COMMONLY ASKED
                </p>
                <h3 className="type-h2-48 text-[#111111] mb-8">
                  Frequently asked questions.
                </h3>

                <div className="space-y-3.5">
                  {FAQ.map((item) => (
                    <div
                      key={item.q}
                      className="card rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-5 shadow-sm"
                    >
                      <h4 className="type-body-16 font-semibold text-[#111111] mb-2">
                        {item.q}
                      </h4>
                      <p className="type-body text-[#2c2823]">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 8: CTA & FOOTER (Role: section, Target Height: ~747px, Bg: #efece4)
        ========================================================================= */}
        <section
          role="region"
          aria-label="Call to action and footer"
          className="bg-[#efece4] pt-16 pb-12 sm:pt-20 sm:pb-16"
        >
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            {/* Big CTA Card */}
            <div className="card card-2xl rounded-[28px] border border-[#d7d4cb] bg-[#fefdf9] p-8 sm:p-14 text-center shadow-md mb-16 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-8 -top-8 z-0 opacity-40">
                <Image
                  src="/art/prop-star.webp"
                  alt=""
                  width={130}
                  height={130}
                  unoptimized
                />
              </div>
              <div className="pointer-events-none absolute -left-8 -bottom-8 z-0 opacity-40">
                <Image
                  src="/art/prop-spark.webp"
                  alt=""
                  width={130}
                  height={130}
                  unoptimized
                />
              </div>

              {/* Watermark 2026 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 select-none overflow-hidden opacity-[0.025]"
              >
                <span className="type-heading-300 text-[#111111]">2026</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <p className="type-body-xs uppercase tracking-[1.1px] text-[#4b63ff] font-semibold mb-3">
                  WEMAKEDEVS × WISPR FLOW · TRACK 2: NO-CODE
                </p>
                <h2 className="type-h2-60 text-[#111111] max-w-[720px] mb-4">
                  Give your brand a face worth remembering.
                </h2>
                <p className="type-body-lg text-[#2c2823] max-w-[560px] mb-8">
                  Type a sentence or voice your idea. Anitoon compiles a living vector character in seconds with 11 real moves.
                </p>

                <PromptForm id="cta-prompt" />
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-[#d7d4cb] pt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <Logo />
                  <p className="type-body-xs text-[#6f6759] mt-2">
                    Built for the Wispr Challenge — Track 2: No-Code. Vectors, not pixels.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <Link
                    href="/#work"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center"
                  >
                    Work
                  </Link>
                  <Link
                    href="/studio"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center"
                  >
                    Studio
                  </Link>
                  <Link
                    href="/#moves"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center"
                  >
                    Moves
                  </Link>
                  <Link
                    href="/#how"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center"
                  >
                    How it works
                  </Link>
                  <Link
                    href="/#faq"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center"
                  >
                    FAQ
                  </Link>
                  <a
                    href="https://github.com/pranavk429/anitoon"
                    target="_blank"
                    rel="noreferrer"
                    className="type-link text-[#2c2823] hover:text-[#4b63ff] min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center gap-1"
                  >
                    GitHub <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#d7d4cb]/60 pt-4">
                <span className="type-body-xs text-[#6f6759]">
                  © 2026 Anitoon. No fake logos, no fake customers.
                </span>
                <span className="type-body-xs-12 text-[#6f6759]">
                  18 bones · 11 moves · Lottie · SVG · PNG · React TSX
                </span>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
