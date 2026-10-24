"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import {
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
import type { ExpressionId, MascotSpec } from "@/lib/mascot/spec";
import { useReducedMotion } from "@/lib/three/useReducedMotion";

const MascotThreeStage = dynamic(
  () =>
    import("@/components/three/MascotThreeStage").then(
      (mod) => mod.MascotThreeStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#efece4]/40">
        <div className="flex items-center gap-2 rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6f6759]">
          <Sparkles size={11} className="animate-pulse text-[#4b63ff]" />
          Preparing the 3D stage
        </div>
      </div>
    ),
  },
);

export function Stage3DPanel({
  spec,
  expression,
  onExpression,
  move,
  onMove,
}: {
  spec: MascotSpec;
  expression: ExpressionId;
  onExpression: (expression: ExpressionId) => void;
  move: Motion3DId;
  onMove: (move: Motion3DId) => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [time, setTime] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const [userStarted, setUserStarted] = useState(false);
  const [active, setActive] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const def = MOVE_3D_BY_ID[move] ?? MOVES_3D[0];

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleTime = useCallback((next: number) => {
    setTime(next);
  }, []);

  const chooseMove = useCallback(
    (next: Motion3DId) => {
      onMove(next);
      setTime(0);
      setScrub(null);
      setUserStarted(true);
      setPlaying(true);
      setResetKey((value) => value + 1);
    },
    [onMove],
  );

  const effectivePlaying = playing && (!reducedMotion || userStarted);
  const togglePlaying = () => {
    if (!effectivePlaying) {
      setUserStarted(true);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };
  const pct = def.duration > 0 ? Math.min(1, time / def.duration) : 0;
  const isMochi = spec.species === "cat";

  return (
    <section aria-label="3D flagship stage" className="flex min-w-0 flex-col gap-3">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#d7d4cb] bg-[#efece4]/70 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#ffc53d] blink-dot" />
            <span className="mono-label !text-[#111111]">3D flagship</span>
            <span className="truncate rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823]">
              Mochi · 001
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
            <span className="hidden sm:inline">27 joints</span>
            <span className="hidden sm:inline">·</span>
            <span>6 clips</span>
          </div>
        </div>

        <div className="relative bg-[#efece4]/35 p-2.5 sm:p-3">
          <div className="relative h-[clamp(400px,54vh,590px)] overflow-hidden rounded-[13px] border border-[#d7d4cb] bg-[radial-gradient(120%_92%_at_50%_16%,#fffdf7_0%,#f2e9d9_40%,#d5c8b2_100%)]">
            <div className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_130px_rgba(52,39,22,0.18)]" />
            <MascotThreeStage
              key={resetKey}
              move={move}
              expression={expression}
              playing={effectivePlaying}
              speed={speed}
              scrub={scrub}
              showSkeleton={showSkeleton}
              reducedMotion={reducedMotion}
              active={active}
              onTime={handleTime}
              className="absolute inset-0 z-0"
            />
            <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4b63ff]" />
              {showSkeleton ? "skeleton on" : "soft shadows · realtime"}
            </div>
            <div className="pointer-events-none absolute right-2.5 top-2.5 z-10 hidden items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] shadow-sm sm:flex">
              <Orbit size={10} /> drag to orbit
            </div>
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/95 px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-[#111111] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a45]" />
              {def.name} · {def.duration}s · loop
            </div>
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] shadow-sm">
              {expression} · {spec.name}
            </div>
          </div>
        </div>

        <div className="border-t border-[#d7d4cb] bg-[#fefdf9] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlaying}
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
                setTime(0);
                setScrub(null);
                setUserStarted(true);
                setPlaying(true);
                setResetKey((value) => value + 1);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] text-[#111111] transition hover:bg-[#e2d8c6]"
              aria-label="Restart 3D move"
            >
              <RotateCcw size={14} />
            </button>
            <div className="min-w-0 flex-1">
              <input
                className="scrub w-full"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={scrub !== null ? scrub / def.duration : pct}
                aria-label="Scrub 3D animation"
                onPointerDown={() => {
                  setUserStarted(true);
                  setScrub(time);
                  setPlaying(false);
                }}
                onPointerUp={() => {
                  setScrub(null);
                  setPlaying(true);
                }}
                onTouchEnd={() => {
                  setScrub(null);
                  setPlaying(true);
                }}
                onChange={(event) => {
                  setUserStarted(true);
                  setPlaying(false);
                  setScrub(Number(event.target.value) * def.duration);
                }}
                onKeyUp={() => {
                  setScrub(null);
                  setPlaying(true);
                }}
              />
              <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                <span>
                  {(scrub ?? time).toFixed(1)}s / {def.duration.toFixed(1)}s
                </span>
                <span>realtime · glb skeleton</span>
              </div>
            </div>
            <div className="hidden items-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] p-0.5 sm:flex">
              {[0.5, 1, 1.5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSpeed(value)}
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
              onClick={() => setShowSkeleton((value) => !value)}
              className="chip min-h-[32px] !px-2.5 !py-1"
              aria-pressed={showSkeleton}
              aria-label="Toggle 3D skeleton"
              title="Toggle the 27-joint 3D skeleton"
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

      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-2.5 shadow-sm">
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto px-0.5 py-0.5">
          {MOVES_3D.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseMove(item.id)}
              className="chip min-h-[32px] shrink-0"
              aria-pressed={move === item.id}
              data-active={move === item.id}
              title={item.blurb}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-3.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="mono-label text-[10px]">Expression</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
            morph targets + procedural blink
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 px-0.5 pb-0.5">
          {EXPRESSIONS_3D_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onExpression(item.id)}
              className="chip min-h-[32px] shrink-0"
              aria-pressed={expression === item.id}
              data-active={expression === item.id}
            >
              <span aria-hidden="true">{item.emoji}</span>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold leading-none text-[#111111]">
            Mochi
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f6759] sm:inline">
            flagship 3D mascot · {isMochi ? "cat" : "fixed model"}
          </span>
        </div>
        <span className="mono-label text-[10px]">
          {def.name} · {def.blurb}
        </span>
      </div>

      <p className="rounded-[13px] border border-dashed border-[#d7d4cb] bg-[#efece4]/55 px-3 py-2 text-[11px] leading-relaxed text-[#6f6759]">
        The 3D flagship is a fixed Mochi model. Your{" "}
        <span className="font-semibold text-[#111111]">{spec.species}</span>{" "}
        spec still drives the 2D compiler and every vector export; it is not
        used to generate 3D.
      </p>
    </section>
  );
}

export default Stage3DPanel;
