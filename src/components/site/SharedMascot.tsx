"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { MascotStage } from "@/components/mascot/MascotStage";
import { StagePanel } from "@/components/studio/StagePanel";
import { buildMascot } from "@/lib/mascot/art";
import { compileLottie, formatBytes, lottieBytes } from "@/lib/mascot/lottie";
import type { MotionId } from "@/lib/mascot/animate";
import { downloadLottie, downloadSvg } from "@/lib/mascot/export";
import { ACCESSORY_META, type MascotSpec } from "@/lib/mascot/spec";

export function SharedMascot({
  spec,
  code,
  embed = false,
}: {
  spec: MascotSpec;
  code: string;
  embed?: boolean;
}) {
  const build = useMemo(() => buildMascot(spec), [spec]);
  const [motion, setMotion] = useState<MotionId>("wave");
  const [toast, setToast] = useState<string | null>(null);
  const lottieSize = useMemo(() => {
    try {
      return lottieBytes(compileLottie(build, motion));
    } catch {
      return 0;
    }
  }, [build, motion]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setToast(label);
    setTimeout(() => setToast(null), 2400);
  };

  if (embed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-2">
        <MascotStage
          spec={spec}
          build={build}
          motion="wave"
          className="w-full max-w-[520px]"
          background="none"
          shadow
          respectReducedMotion
          ariaLabel={`${spec.name} the ${spec.species}, waving`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efece4] text-[#111111]">
      <header className="border-b border-[#d7d4cb] bg-[#efece4]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1140px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Anitoon home" className="rounded-[13px] inline-flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="mono-label hidden sm:block">Shared mascot</span>
            <Link href={`/studio?m=${code}`} className="btn btn-primary btn-sm">
              Remix <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          <StagePanel
            spec={spec}
            build={build}
            motion={motion}
            onMotion={setMotion}
            compiling={false}
            compileStatus=""
            lottieSize={lottieSize}
          />

          <aside className="space-y-3">
            <div className="rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-5 shadow-sm">
              <p className="mono-label text-[10px]">Mascot</p>
              <h1 className="mt-1 font-display text-[2.2rem] font-extrabold leading-[1] text-[#111111]">{spec.name}</h1>
              <p className="mt-1 text-[14px] leading-snug text-[#6f6759]">
                {spec.tagline}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <span className="chip !py-0.5 text-[9px] bg-[#ffc53d] text-[#111111] border-[#ffc53d]">
                  {spec.species}
                </span>
                <span className="chip !py-0.5 text-[9px] bg-[#c9b6ff] text-[#111111] border-[#c9b6ff]">{spec.vibe}</span>
                <span className="chip !py-0.5 text-[9px] bg-[#fefdf9]">
                  {spec.eyes} eyes
                </span>
                {spec.accessories.map((a) => (
                  <span key={a} className="chip !py-0.5 text-[9px] bg-[#6fd6a8] text-[#111111] border-[#6fd6a8]">
                    {ACCESSORY_META[a].label}
                  </span>
                ))}
              </div>
              <div className="mt-3.5 grid grid-cols-3 gap-1.5">
                {[spec.primary, spec.accent, spec.ink].map((color) => (
                  <div
                    key={color}
                    className="h-8 rounded-[8px] border border-[#d7d4cb]"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d7d4cb] bg-[#fefdf9] p-5 shadow-sm">
              <p className="mono-label mb-2.5 text-[10px]">Take it with you</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => copy(window.location.href, "Link copied")}
                  className="btn btn-sm w-full justify-between !min-h-[36px]"
                >
                  Copy share link <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => downloadLottie(spec, motion)}
                  className="btn btn-sm w-full justify-between !min-h-[36px]"
                >
                  Lottie · {formatBytes(lottieSize)} <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => downloadSvg(spec, motion)}
                  className="btn btn-sm w-full justify-between !min-h-[36px]"
                >
                  SVG still <Download size={13} />
                </button>
                <Link
                  href={`/studio?m=${code}`}
                  className="btn btn-primary btn-sm w-full justify-between !min-h-[36px]"
                >
                  Remix in studio <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-[#d7d4cb] bg-[#efece4]/50 p-4">
              <p className="font-display text-base font-bold text-[#111111]">
                This is a real vector rig.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6f6759]">
                {build.bones.length} bones, {build.layers.length} layers, 11
                authored moves. No image credits, no account, zero lock-in.
              </p>
              <Link
                href="/"
                className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#4b63ff] hover:underline"
              >
                <Sparkles size={11} /> Make your own
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className="toast fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-white bg-ink px-3.5 py-2 text-[11px] text-white"
        >
          <Check size={12} className="text-mint" /> {toast}
        </div>
      )}
    </div>
  );
}

export default SharedMascot;
