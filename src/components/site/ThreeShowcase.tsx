"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import {
  ArrowUpRight,
  Download,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Waypoints,
} from "lucide-react";
import {
  EXPRESSIONS_3D_LIST,
  MOVE_3D_BY_ID,
  MOVES_3D,
  type Motion3DId,
} from "@/lib/three/mascot3d";
import type { ExpressionId } from "@/lib/mascot/spec";
import { useReducedMotion } from "@/lib/three/useReducedMotion";

const MascotThreeStage = dynamic(
  () =>
    import("@/components/three/MascotThreeStage").then(
      (mod) => mod.MascotThreeStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6f6759] shadow-sm">
          <Sparkles size={11} className="animate-pulse text-[#4b63ff]" />
          Lighting the stage
        </div>
      </div>
    ),
  },
);

const STATS = [
  ["27", "joints"],
  ["6", "authored clips"],
  ["7", "expressions"],
  ["60", "fps target"],
];

export function ThreeShowcase() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [move, setMove] = useState<Motion3DId>("wave");
  const [expression, setExpression] = useState<ExpressionId>("happy");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [userStarted, setUserStarted] = useState(false);
  const reducedMotion = useReducedMotion();
  const def = MOVE_3D_BY_ID[move] ?? MOVES_3D[1];
  const effectivePlaying = playing && (!reducedMotion || userStarted);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio > 0.12) {
          setShouldMount(true);
        }
      },
      { threshold: [0, 0.12, 0.5] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ensureLive = useCallback(() => {
    setShouldMount(true);
  }, []);

  const handleTime = useCallback((time: number, duration: number) => {
    if (progressRef.current) {
      const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
      progressRef.current.style.width = `${pct}%`;
    }
  }, []);

  const chooseMove = useCallback(
    (next: Motion3DId) => {
      ensureLive();
      setMove(next);
      setUserStarted(true);
      setPlaying(true);
    },
    [ensureLive],
  );

  return (
    <div
      id="three"
      ref={cardRef}
      className="relative overflow-hidden border-b border-[#d7d4cb] bg-[#efece4] py-16 sm:py-20 lg:py-[104px]"
    >
      <div className="pointer-events-none absolute inset-0 grid-paper opacity-35" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-24 select-none font-heading text-[220px] leading-none text-[#111111]/[0.025] lg:text-[320px]"
      >
        3D
      </div>

      <div className="relative mx-auto max-w-[1140px] px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="type-body-xs mb-3 flex flex-wrap items-center gap-2 uppercase tracking-[1.1px] text-[#6f6759]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#ffc53d]" />
              3D flagship · Mochi 001
              <span className="rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-2 py-0.5 text-[9px] text-[#111111]">
                live in the browser
              </span>
            </p>
            <h2 className="type-h2-60 max-w-[760px] text-[#111111]">
              A mascot with real bones. Actual light.
            </h2>
            <p className="type-body-lg mt-4 max-w-[640px] text-[#2c2823]">
              Mochi is a hand-built 3D character: a real skeleton, soft
              shadows, seven expression blendshapes, and six authored moves.
              Drag the stage, watch the ears lag, then take the GLB anywhere.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="panel-tactile grid grid-cols-2 gap-px overflow-hidden p-0">
              {STATS.map(([value, label]) => (
                <div key={label} className="bg-[#fefdf9] px-4 py-3">
                  <p className="font-display text-[26px] font-extrabold leading-none text-[#111111]">
                    {value}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6f6759]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <div className="overflow-hidden rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#d7d4cb] bg-[#efece4]/70 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#4b63ff] blink-dot" />
                  <span className="mono-label !text-[#111111]">3D stage</span>
                  <span className="truncate rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823]">
                    Mochi · GLB · 27 joints
                  </span>
                </div>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] sm:inline">
                  {ready ? "realtime · soft shadows" : "loading the set"}
                </span>
              </div>

              <div className="p-2.5 sm:p-3">
                <div className="relative h-[clamp(440px,60vh,650px)] overflow-hidden rounded-[17px] border border-[#d7d4cb] bg-[radial-gradient(120%_92%_at_50%_16%,#fffdf7_0%,#f2e9d9_40%,#d3c6b0_100%)]">
                  <div className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_140px_rgba(52,39,22,0.2)]" />

                  {shouldMount && (
                    <MascotThreeStage
                      key={resetKey}
                      move={move}
                      expression={expression}
                      playing={effectivePlaying}
                      speed={speed}
                      showSkeleton={showSkeleton}
                      reducedMotion={reducedMotion}
                      active={active}
                      onTime={handleTime}
                      onReady={() => setReady(true)}
                      onError={() => setFailed(true)}
                      className="absolute inset-0 z-[3]"
                    />
                  )}

                  <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823] shadow-sm">
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#4b63ff]" />
                      {shouldMount ? (ready ? "live 3d" : "warming up") : "flagship still"}
                    </span>
                    <span className="hidden rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] shadow-sm sm:inline-flex sm:items-center sm:gap-1">
                      <Orbit size={10} /> drag to orbit
                    </span>
                  </div>

                  {!shouldMount && (
                    <button
                      type="button"
                      onClick={() => {
                        ensureLive();
                        setUserStarted(true);
                        setPlaying(true);
                      }}
                      className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-white bg-[#4b63ff] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-white shadow-lg transition hover:bg-[#3850f3]"
                    >
                      <Play size={13} fill="currentColor" />
                      Load live 3D
                    </button>
                  )}

                  {failed && (
                    <div className="absolute inset-x-4 bottom-16 z-10 rounded-[13px] border border-[#d7d4cb] bg-[#fefdf9]/95 p-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f6759]">
                      The live stage could not load. The GLB and 3D studio
                      are still available.
                    </div>
                  )}

                  <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/95 px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-[#111111] shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a45]" />
                    {def.name} · {def.duration}s · loop
                  </div>
                  <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] shadow-sm sm:block">
                    {expression}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#d7d4cb] bg-[#fefdf9] px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      ensureLive();
                      if (!effectivePlaying) {
                        setUserStarted(true);
                        setPlaying(true);
                      } else {
                        setPlaying(false);
                      }
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#4b63ff] bg-[#4b63ff] text-white shadow-sm transition hover:bg-[#3850f3]"
                    aria-label={effectivePlaying ? "Pause 3D animation" : "Play 3D animation"}
                  >
                    {effectivePlaying ? (
                      <Pause size={15} fill="currentColor" />
                    ) : (
                      <Play size={15} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      ensureLive();
                      setUserStarted(true);
                      setPlaying(true);
                      setResetKey((value) => value + 1);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] text-[#111111] transition hover:bg-[#e2d8c6]"
                    aria-label="Restart 3D move"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <div className="min-w-0 flex-1 px-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e2d8c6]/80">
                      <div
                        ref={progressRef}
                        className="h-full w-0 rounded-full bg-[#4b63ff] transition-[width] duration-100"
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                      <span>{def.name} · six authored clips</span>
                      <span>60fps target</span>
                    </div>
                  </div>
                  <div className="hidden items-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] p-0.5 sm:flex">
                    {[0.5, 1, 1.5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          ensureLive();
                          setSpeed(value);
                        }}
                        className={clsx(
                          "rounded-full px-2 py-1 font-mono text-[9px] uppercase transition-colors",
                          speed === value
                            ? "bg-[#4b63ff] text-white"
                            : "text-[#2c2823] hover:text-[#111111]",
                        )}
                        aria-pressed={speed === value}
                      >
                        {value}×
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ensureLive();
                      setShowSkeleton((value) => !value);
                    }}
                    className="chip min-h-[32px] !px-2.5 !py-1"
                    aria-pressed={showSkeleton}
                    aria-label="Toggle 3D skeleton"
                    title="Toggle the skeleton"
                  >
                    <Waypoints size={12} />
                    <span className="hidden sm:inline">Rig</span>
                  </button>
                  <a
                    href="/three/mochi.glb"
                    download="mochi-anitoon.glb"
                    className="chip min-h-[32px] !px-2.5 !py-1"
                    title="Download the animated GLB"
                  >
                    <Download size={12} />
                    <span className="hidden md:inline">GLB</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3 lg:col-span-4">
            <div className="rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="mono-label text-[10px]">Six moves</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                  pick one
                </span>
              </div>
              <div className="divide-y divide-[#e6e1d7]">
                {MOVES_3D.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseMove(item.id)}
                    className={clsx(
                      "group flex w-full items-center gap-2.5 py-2 text-left transition-colors",
                      "min-h-[36px]",
                    )}
                    aria-pressed={move === item.id}
                  >
                    <span
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px]",
                        move === item.id
                          ? "bg-[#4b63ff] text-white"
                          : "bg-[#efece4] text-[#6f6759]",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "block font-display text-[15px] font-bold leading-none",
                          move === item.id ? "text-[#4b63ff]" : "text-[#111111]",
                        )}
                      >
                        {item.name}
                      </span>
                      {move === item.id && (
                        <span className="mt-0.5 block truncate text-[10px] leading-snug text-[#6f6759]">
                          {item.blurb}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-[#6f6759]">
                      {item.duration}s
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="mono-label text-[10px]">Expressions</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                  blendshapes
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXPRESSIONS_3D_LIST.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      ensureLive();
                      setExpression(item.id);
                    }}
                    className="chip min-h-[30px] !px-2.5 !py-1"
                    aria-pressed={expression === item.id}
                    data-active={expression === item.id}
                  >
                    <span aria-hidden="true">{item.emoji}</span>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#4b63ff]/30 bg-[#eef0ff] p-4">
              <p className="type-body-xl text-[#111111]">
                Take Mochi with you.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#2c2823]">
                A real GLB with skin, clips, and morph targets. One file, no
                runtime APIs, no licence roulette.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="/three/mochi.glb"
                  download="mochi-anitoon.glb"
                  className="btn btn-primary btn-sm min-h-[36px] font-mono text-[10px]"
                >
                  <Download size={12} /> Download GLB
                </a>
                <Link
                  href="/studio?mode=3d&move=wave"
                  className="btn btn-sm min-h-[36px] font-mono text-[10px]"
                >
                  Open 3D studio <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            <p className="px-1 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-[#6f6759]">
              Built in Blender 5.2 · 27-joint rig · six 60fps clips · seven
              blendshapes · GLB 0.7MB
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#d7d4cb] pt-5">
          <p className="max-w-[600px] text-[12px] leading-relaxed text-[#2c2823]">
            The 2D compiler has not moved. Every prompt still produces layered
            SVG, Lottie, PNG, and a React SDK; the 3D flagship is a second
            surface, not a replacement.
          </p>
          <Link
            href="/#work"
            className="inline-flex min-h-[36px] items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2f45c8] hover:underline"
          >
            See the 2D mascots <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ThreeShowcase;
