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
    <div className="min-h-screen bg-paper">
      <header className="border-b-2 border-ink bg-paper/90">
        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Toonify home">
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
            <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#17151C]">
              <p className="mono-label">Mascot</p>
              <h1 className="mt-1 text-[2.4rem] leading-[0.92]">{spec.name}</h1>
              <p className="mt-1 text-[14px] leading-snug text-ink/65">
                {spec.tagline}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="chip !py-1 text-[9px] bg-butter">
                  {spec.species}
                </span>
                <span className="chip !py-1 text-[9px] bg-lilac">{spec.vibe}</span>
                <span className="chip !py-1 text-[9px]">
                  {spec.eyes} eyes
                </span>
                {spec.accessories.map((a) => (
                  <span key={a} className="chip !py-1 text-[9px] bg-mint">
                    {ACCESSORY_META[a].label}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[spec.primary, spec.accent, spec.ink].map((color) => (
                  <div
                    key={color}
                    className="h-8 rounded-lg border-2 border-ink"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-white p-4">
              <p className="mono-label mb-2">Take it with you</p>
              <div className="grid gap-1.5">
                <button
                  type="button"
                  onClick={() => copy(window.location.href, "Link copied")}
                  className="btn btn-sm w-full justify-between"
                >
                  Copy share link <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => downloadLottie(spec, motion)}
                  className="btn btn-sm w-full justify-between"
                >
                  Lottie · {formatBytes(lottieSize)} <Download size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => downloadSvg(spec, motion)}
                  className="btn btn-sm w-full justify-between"
                >
                  SVG still <Download size={12} />
                </button>
                <Link
                  href={`/studio?m=${code}`}
                  className="btn btn-primary btn-sm w-full justify-between"
                >
                  Remix in studio <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-ink/30 p-4">
              <p className="font-display text-base font-bold">
                This is a real vector rig.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink/55">
                {build.bones.length} bones, {build.layers.length} layers, 11
                authored moves. No image credits, no account, no lock-in.
              </p>
              <Link
                href="/"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-blue hover:underline"
              >
                <Sparkles size={10} /> Make your own
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
