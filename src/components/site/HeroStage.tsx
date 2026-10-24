"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bone, Pause, Play, ScanEye } from "lucide-react";
import { MascotStage } from "@/components/mascot/MascotStage";
import {
  MOTION_BY_ID,
  type MotionId,
} from "@/lib/mascot/animate";
import { createSpec } from "@/lib/mascot/spec";

const HERO_SPEC = createSpec({
  name: "Mochi",
  species: "cat",
  primary: "#F59E56",
  accent: "#4B63FF",
  ink: "#111111",
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
      <div className="pointer-events-none absolute -left-5 top-12 z-20 hidden -rotate-6 sm:block">
        <span className="chip border-[#d7d4cb] bg-[#fefdf9] text-[#111111] shadow-sm">
          <Bone size={13} strokeWidth={2.4} className="text-[#4b63ff]" /> 18-bone rig
        </span>
      </div>
      <div className="pointer-events-none absolute right-2 top-4 z-20 rotate-6 sm:-right-4 sm:top-20">
        <span className="chip border-[#d7d4cb] bg-[#fefdf9] text-[#111111] shadow-sm">
          100% vector
        </span>
      </div>
      <div className="pointer-events-none absolute -bottom-3 -left-2 z-20 -rotate-3">
        <span className="chip border-[#d7d4cb] bg-[#fefdf9] text-[#111111] shadow-sm">
          11 real moves
        </span>
      </div>

      <div className="card relative overflow-hidden rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-1 pb-3 pt-0.5">
          <span className="mono-label flex items-center gap-1.5 text-[11px] text-[#2c2823]">
            <span className="h-2 w-2 rounded-full bg-[#4b63ff] blink-dot" />
            Live stage · proof 001
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowRig((v) => !v)}
              className="chip !py-1 min-h-[30px]"
              aria-pressed={showRig}
              title="Toggle bone rig"
            >
              <ScanEye size={13} strokeWidth={2.2} />
              {showRig ? "Rig on" : "Rig"}
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="chip !px-2.5 !py-1 min-h-[30px]"
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[17px] border border-[#d7d4cb] bg-[#efece4]/70">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-50" />
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
          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/95 px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] text-[#111111] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4b63ff]" />
            {def.name} · {def.duration}s · {def.loop ? "loop" : "once"}
          </div>
        </div>

        <div className="scrollbar-thin mt-3 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
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
                className="chip shrink-0 min-h-[30px]"
                aria-pressed={motion === id}
                data-active={motion === id}
              >
                {m.name}
              </button>
            );
          })}
          <Link
            href={`/studio?move=${motion}`}
            className="chip shrink-0 border-dashed bg-[#efece4] text-[#111111] min-h-[30px]"
          >
            All 11 <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#d7d4cb]/80 px-1 pt-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[19px] font-extrabold leading-none text-[#111111]">
              {HERO_SPEC.name}
            </p>
            <p className="truncate font-mono text-[11px] tracking-[0.04em] text-[#6f6759]">
              {HERO_SPEC.tagline}
            </p>
          </div>
          <Link
            href="/studio?prompt=a%20sunny%20orange%20cat%20mascot%20named%20Mochi%20with%20a%20blue%20scarf"
            className="btn btn-primary btn-sm shrink-0 min-h-[34px] font-mono text-[11px]"
          >
            Remix <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <div className="float-soft pointer-events-none absolute -bottom-6 right-4 z-20 hidden rotate-[3deg] sm:block">
        <span className="chip border-[#d7d4cb] bg-[#fefdf9] text-[#111111] shadow-sm">
          No image credits
        </span>
      </div>
    </div>
  );
}

export default HeroStage;
