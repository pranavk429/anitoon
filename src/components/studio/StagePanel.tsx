"use client";

import { useCallback, useRef, useState } from "react";
import clsx from "clsx";
import {
  Grid3x3,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { MascotStage } from "@/components/mascot/MascotStage";
import { MOTIONS, MOTION_BY_ID, type MotionId } from "@/lib/mascot/animate";
import type { Build } from "@/lib/mascot/art";
import type { MascotSpec } from "@/lib/mascot/spec";
import { formatBytes } from "@/lib/mascot/lottie";

type StageBg = "paper" | "grid" | "halftone" | "none";

export function StagePanel({
  spec,
  build,
  motion,
  onMotion,
  compiling,
  compileStatus,
  lottieSize,
}: {
  spec: MascotSpec;
  build: Build;
  motion: MotionId;
  onMotion: (m: MotionId) => void;
  compiling: boolean;
  compileStatus: string;
  lottieSize: number;
}) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showRig, setShowRig] = useState(false);
  const [bg, setBg] = useState<StageBg>("paper");
  const [time, setTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrub, setScrub] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const lastTime = useRef(0);
  const def = MOTION_BY_ID[motion];

  const handleTime = useCallback((t: number) => {
    if (Math.abs(t - lastTime.current) < 0.035) return;
    lastTime.current = t;
    setTime(t);
  }, []);

  const pct = def.duration > 0 ? Math.min(1, time / def.duration) : 0;

  return (
    <section
      aria-label="Live mascot stage"
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="relative overflow-hidden rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-[#d7d4cb] bg-[#efece4]/70 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#4b63ff] blink-dot" />
            <span className="mono-label !text-[#111111]">Stage</span>
            <span className="rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823]">
              live · {def.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f6759]">
            <span className="hidden sm:inline">{build.layers.length} layers</span>
            <span className="hidden sm:inline">·</span>
            <span>{formatBytes(lottieSize)}</span>
          </div>
        </div>

        <div className="relative flex justify-center bg-[#efece4]/40 p-3 sm:p-5">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-40" />
          <div
            className={clsx(
              "relative w-full max-w-[520px] overflow-hidden rounded-[13px] border border-[#d7d4cb]",
              bg === "paper" && "bg-[#fefdf9]",
              bg === "grid" && "bg-[#fefdf9]",
              bg === "halftone" && "bg-[#fefdf9]",
              bg === "none" && "border-transparent bg-transparent",
            )}
          >
            {bg === "grid" && (
              <div className="pointer-events-none absolute inset-0 grid-paper opacity-60" />
            )}
            {bg === "halftone" && (
              <div className="pointer-events-none absolute inset-0 halftone opacity-30" />
            )}
            <MascotStage
              spec={spec}
              build={build}
              motion={motion}
              playing={playing && !scrubbing}
              speed={speed}
              scrub={scrubbing ? scrub : null}
              showRig={showRig}
              background="none"
              resetKey={resetKey}
              onTime={handleTime}
              className="relative z-10"
            />
            <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#2c2823] shadow-sm">
              {spec.eyes} eyes
              {showRig && <span className="text-[#ff5a45]">· rig</span>}
            </div>
            {compiling && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#efece4]/90 backdrop-blur-[2px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#ffc53d] shadow-sm">
                  <Sparkles size={20} className="animate-pulse text-[#111111]" />
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#111111]">
                  {compileStatus || "Compiling"}
                </p>
                <div className="h-1.5 w-32 overflow-hidden rounded-full border border-[#d7d4cb] bg-[#fefdf9]">
                  <div className="h-full w-1/2 animate-[marquee_1.2s_linear_infinite] bg-[#4b63ff]" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#d7d4cb] px-3.5 py-3 bg-[#fefdf9]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#4b63ff] bg-[#4b63ff] text-white shadow-sm transition hover:bg-[#3850f3]"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause size={15} fill="currentColor" />
              ) : (
                <Play size={15} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setResetKey((v) => v + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] text-[#111111] transition hover:bg-[#e2d8c6]"
              aria-label="Restart move"
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
                value={scrubbing ? scrub : pct}
                aria-label="Scrub animation"
                onPointerDown={() => {
                  setScrubbing(true);
                  setScrub(pct);
                }}
                onPointerUp={() => setScrubbing(false)}
                onTouchEnd={() => setScrubbing(false)}
                onChange={(e) => {
                  setScrubbing(true);
                  setScrub(Number(e.target.value));
                }}
                onKeyUp={() => setScrubbing(false)}
              />
              <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                <span>
                  {time.toFixed(1)}s / {def.duration.toFixed(1)}s
                </span>
                <span>{def.loop ? "loops" : "one-shot"}</span>
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
                    speed === value ? "bg-[#4b63ff] text-white" : "text-[#2c2823] hover:text-[#111111]",
                  )}
                  aria-pressed={speed === value}
                >
                  {value}×
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowRig((v) => !v)}
              className="chip !px-2.5 !py-1 min-h-[32px]"
              aria-pressed={showRig}
              title="Toggle bone rig"
            >
              <Waypoints size={12} />
              <span className="hidden sm:inline">Rig</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setBg((current) =>
                  current === "paper"
                    ? "grid"
                    : current === "grid"
                      ? "halftone"
                      : current === "halftone"
                        ? "none"
                        : "paper",
                )
              }
              className="chip !px-2.5 !py-1 min-h-[32px]"
              title={`Background: ${bg}`}
            >
              <Grid3x3 size={12} />
              <span className="hidden sm:inline capitalize">{bg}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-2.5 shadow-sm">
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto px-0.5 py-0.5">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onMotion(m.id);
                setTime(0);
                setPlaying(true);
                setResetKey((v) => v + 1);
              }}
              className="chip shrink-0 min-h-[32px]"
              aria-pressed={motion === m.id}
              data-active={motion === m.id}
              title={m.blurb}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold leading-none text-[#111111]">
            {spec.name}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f6759] sm:inline">
            {spec.species} · {spec.vibe} · {spec.tagline}
          </span>
        </div>
        <span className="mono-label text-[10px]">
          {def.name} · {def.label}
        </span>
      </div>
    </section>
  );
}

export default StagePanel;
