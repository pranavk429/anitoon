"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bone, Pause, Play, ScanEye } from "lucide-react";
import { MascotStage } from "@/components/mascot/MascotStage";
import {
  MOTIONS,
  MOTION_BY_ID,
  type MotionId,
} from "@/lib/mascot/animate";
import { createSpec } from "@/lib/mascot/spec";

const HERO_SPEC = createSpec({
  name: "Mochi",
  species: "cat",
  primary: "#F59E56",
  accent: "#2B4BF2",
  ink: "#17151F",
  vibe: "sunny",
  eyes: "sparkle",
  mouth: "grin",
  pattern: "none",
  accessories: ["scarf"],
  tagline: "Chief good-vibes officer",
  seed: 26,
});

const FEATURED: MotionId[] = ["wave", "jump", "dance", "spin", "celebrate"];

export function HeroStage() {
  const [motion, setMotion] = useState<MotionId>("wave");
  const [playing, setPlaying] = useState(true);
  const [showRig, setShowRig] = useState(false);
  const def = MOTION_BY_ID[motion];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -left-7 top-14 z-20 hidden -rotate-6 sm:block">
        <span className="chip border-ink bg-butter shadow-[3px_3px_0_#17151C]">
          <Bone size={12} strokeWidth={2.6} /> 18-bone rig
        </span>
      </div>
      <div className="pointer-events-none absolute right-2 top-6 z-20 rotate-6 sm:-right-5 sm:top-24">
        <span className="chip bg-mint shadow-[3px_3px_0_#17151C]">
          100% vector
        </span>
      </div>
      <div className="pointer-events-none absolute -bottom-4 -left-3 z-20 -rotate-3">
        <span className="chip bg-coral text-ink shadow-[3px_3px_0_#17151C]">
          11 real moves
        </span>
      </div>

      <div className="card relative overflow-hidden p-2 shadow-[10px_10px_0_#17151C] sm:p-3">
        <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-0.5">
          <span className="mono-label flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-coral blink-dot" />
            Live rig · proof 004
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowRig((v) => !v)}
              className="chip !py-1.5"
              aria-pressed={showRig}
              title="Toggle bone rig"
            >
              <ScanEye size={12} strokeWidth={2.4} />
              {showRig ? "Rig on" : "Rig"}
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="chip !px-2 !py-1.5"
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[14px] border-2 border-ink bg-white">
          <div className="pointer-events-none absolute inset-0 halftone opacity-40" />
          <MascotStage
            spec={HERO_SPEC}
            motion={motion}
            playing={playing}
            showRig={showRig}
            background="none"
            shadow
            className="relative z-10"
            respectReducedMotion
          />
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-full border-2 border-ink bg-white/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            {def.name} · {def.duration}s · {def.loop ? "loop" : "once"}
          </div>
        </div>

        <div className="scrollbar-thin mt-2 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
          {FEATURED.map((id) => {
            const m = MOTION_BY_ID[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMotion(id);
                  setPlaying(true);
                }}
                className="chip shrink-0"
                aria-pressed={motion === id}
                data-active={motion === id}
              >
                {m.name}
              </button>
            );
          })}
          <Link
            href={`/studio?move=${motion}`}
            className="chip shrink-0 border-dashed bg-paper"
          >
            All 11 <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-ink/20 px-1 pt-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold leading-none">
              {HERO_SPEC.name}
            </p>
            <p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
              {HERO_SPEC.tagline}
            </p>
          </div>
          <Link
            href="/studio?prompt=a%20sunny%20orange%20cat%20mascot%20named%20Mochi%20with%20a%20blue%20scarf"
            className="btn btn-primary btn-sm shrink-0"
          >
            Remix <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <div className="float-soft pointer-events-none absolute -bottom-7 right-4 z-20 hidden rotate-[4deg] sm:block">
        <span className="chip bg-white shadow-[3px_3px_0_#17151C]">
          No image credits
        </span>
      </div>
    </div>
  );
}

export default HeroStage;
