"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  Box,
  Check,
  Download,
  ExternalLink,
  Film,
  Loader2,
  Pause,
  Play,
  X,
} from "lucide-react";
import type { AnimationItem } from "lottie-web";
import type { Build } from "@/lib/mascot/art";
import { MOTIONS, MOTION_BY_ID, type MotionId } from "@/lib/mascot/animate";
import { compileLottie, formatBytes, lottieBytes } from "@/lib/mascot/lottie";
import type { MascotSpec } from "@/lib/mascot/spec";
import type { ExportFormat } from "./ShipPanel";

type PreviewBg = "paper" | "transparent" | "ink";

export function ExportModal({
  open,
  onClose,
  spec,
  build,
  motion,
  onMotion,
  onDownload,
  exporting,
  onCopy,
  studioUrl,
  publicUrl,
}: {
  open: boolean;
  onClose: () => void;
  spec: MascotSpec;
  build: Build;
  motion: MotionId;
  onMotion: (m: MotionId) => void;
  onDownload: (format: ExportFormat, transparent: boolean) => void;
  exporting: ExportFormat | null;
  onCopy: (text: string, label: string) => void;
  studioUrl: string;
  publicUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [bg, setBg] = useState<PreviewBg>("paper");
  const def = MOTION_BY_ID[motion];
  const animationData = useMemo(
    () => compileLottie(build, motion),
    [build, motion],
  );
  const animationBytes = useMemo(() => lottieBytes(animationData), [animationData]);

  // Compiled from the same bone sampler as the live stage.
  const size = animationBytes;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const container = containerRef.current;
    queueMicrotask(() => {
      setLoaded(false);
      setPlaying(true);
    });
    if (!container) return;
    container.innerHTML = "";
    import("lottie-web")
      .then((mod) => {
        if (cancelled || !container) return;
        const lottie = mod.default;
        const anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData,
        });
        animationRef.current = anim;
        anim.addEventListener("DOMLoaded", () => {
          if (!cancelled) setLoaded(true);
        });
        setTimeout(() => {
          if (!cancelled) setLoaded(true);
        }, 250);
      })
      .catch(() => {
        if (!cancelled) setLoaded(false);
      });
    return () => {
      cancelled = true;
      animationRef.current?.destroy();
      animationRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [open, animationData]);

  if (!open) return null;

  const toggle = () => {
    const anim = animationRef.current;
    if (!anim) return;
    if (playing) anim.pause();
    else anim.play();
    setPlaying((v) => !v);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111111]/50 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        aria-describedby="export-desc"
        className="relative max-h-[94vh] w-full max-w-[980px] overflow-y-auto rounded-[24px] border border-[#d7d4cb] bg-[#efece4] shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#d7d4cb] bg-[#efece4]/95 px-5 py-3.5 backdrop-blur">
          <div>
            <p className="mono-label text-[10px]">Export · preview</p>
            <h2 id="export-title" className="font-display text-xl font-extrabold text-[#111111]">
              {spec.name} · {def.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "chip !py-1 text-[9px] min-h-[28px]",
                loaded ? "bg-[#6fd6a8] text-[#111111]" : "bg-[#fefdf9]",
              )}
            >
              <span
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  loaded ? "bg-[#111111]" : "bg-[#ff5a45] blink-dot",
                )}
              />
              {loaded ? "lottie-web ok" : "loading"}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] text-[#111111] hover:bg-[#e2d8c6]"
              aria-label="Close export preview"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="min-w-0 border-b border-[#d7d4cb] p-4 md:border-b-0 md:border-r">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="mono-label flex items-center gap-1.5 text-[10px]">
                <Film size={12} className="text-[#4b63ff]" /> Lottie render
              </span>
              <div className="flex items-center gap-1">
                {(["paper", "transparent", "ink"] as PreviewBg[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBg(b)}
                    className="rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-[#111111] hover:border-[#4b63ff]"
                    aria-pressed={bg === b}
                  >
                    {b === "transparent" ? "none" : b}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={clsx(
                "relative overflow-hidden rounded-[17px] border border-[#d7d4cb]",
                bg === "paper" && "grid-paper bg-[#fefdf9]",
                bg === "transparent" &&
                  "bg-[repeating-conic-gradient(#e2d8c6_0%_25%,#fefdf9_0%_50%)] bg-[length:24px_24px]",
                bg === "ink" && "bg-[#111111]",
              )}
            >
              <div
                ref={containerRef}
                className="relative z-10 aspect-[420/430] w-full"
                aria-label={`Lottie preview of ${spec.name}`}
              />
              {!loaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-[#6f6759]" />
                </div>
              )}
              <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9]/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a45] blink-dot" />
                {def.duration}s · 30fps
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4b63ff] bg-[#4b63ff] text-white shadow-sm"
                  aria-label={playing ? "Pause preview" : "Play preview"}
                >
                  {playing ? (
                    <Pause size={13} fill="currentColor" />
                  ) : (
                    <Play size={13} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f6759]">
                  {formatBytes(size)} · {(animationData as { layers?: unknown[] }).layers?.length ?? 0}{" "}
                  layers
                </span>
              </div>
              <span className="chip !py-0.5 text-[9px] bg-[#fefdf9] min-h-[24px]">
                <Check size={9} strokeWidth={3} className="text-[#4b63ff]" /> same rig as stage
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {MOTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMotion(m.id)}
                  className={clsx(
                    "flex min-h-[30px] items-center justify-between rounded-[8px] border px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.06em] transition-colors",
                    motion === m.id
                      ? "border-[#4b63ff] bg-[#4b63ff] text-white"
                      : "border-[#d7d4cb] bg-[#fefdf9] text-[#111111] hover:border-[#4b63ff]",
                  )}
                  aria-pressed={motion === m.id}
                >
                  {m.name}
                  <span className="opacity-70">{m.duration}s</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 p-5">
            <p id="export-desc" className="break-words text-[13px] leading-relaxed text-[#2c2823]">
              This is the actual exported Lottie, loaded with lottie-web from a
              string — no server, no re-render. If it moves here, it will move
              on your site.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  ["lottie", "Lottie JSON", formatBytes(size)],
                  ["svg", "SVG", "vector still"],
                  ["png", "PNG", "1024 × 1024"],
                  ["sdk", "SDK zip", "6 files"],
                ] as Array<[ExportFormat, string, string]>
              ).map(([fmt, label, detail]) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onDownload(fmt, false)}
                  disabled={Boolean(exporting)}
                  className="flex min-w-0 flex-col items-start gap-1 rounded-[13px] border border-[#d7d4cb] bg-[#fefdf9] p-3 text-left shadow-sm transition hover:border-[#4b63ff] disabled:opacity-60 min-h-[64px]"
                >
                  <Download size={14} className="text-[#4b63ff]" />
                  <span className="font-display text-sm font-bold leading-none text-[#111111]">
                    {label}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#6f6759]">
                    {exporting === fmt ? "working…" : detail}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[17px] border border-[#4b63ff]/25 bg-[#eef0ff] p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#4b63ff]/30 bg-[#fefdf9] text-[#4b63ff]">
                  <Box size={15} strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="mono-label !text-[#4b63ff]">3D flagship · separate asset</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#2c2823]">
                    Mochi is a hand-built GLB with a 27-joint skeleton, six
                    clips, and seven expression blendshapes. Your 2D spec and
                    exports stay exactly as they are.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <a
                  href="/three/mochi.glb"
                  download="mochi-anitoon.glb"
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-[#4b63ff] bg-[#4b63ff] px-3 font-mono text-[9px] uppercase tracking-[0.06em] text-white hover:bg-[#3850f3]"
                >
                  <Download size={11} /> Download GLB
                </a>
                <a
                  href="/studio?mode=3d&move=wave"
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-[#d7d4cb] bg-[#fefdf9] px-3 font-mono text-[9px] uppercase tracking-[0.06em] text-[#111111] hover:border-[#4b63ff]"
                >
                  Open 3D stage <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="mt-4 rounded-[17px] border border-dashed border-[#d7d4cb] bg-[#fefdf9] p-3.5">
              <p className="mono-label mb-2 text-[10px]">Share it</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onCopy(studioUrl, "Studio link copied")}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border border-[#d7d4cb] bg-[#efece4]/40 px-2.5 py-2 text-left hover:border-[#4b63ff]"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] text-[#111111]">{studioUrl}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase text-[#4b63ff]">
                    copy
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(publicUrl, "Public link copied")}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border border-[#d7d4cb] bg-[#efece4]/40 px-2.5 py-2 text-left hover:border-[#4b63ff]"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] text-[#111111]">{publicUrl}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase text-[#4b63ff]">
                    copy
                  </span>
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4b63ff] hover:underline pt-1"
                >
                  Open public page <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="mt-4 rounded-[17px] border border-[#d7d4cb] bg-[#efece4]/50 p-3.5">
              <p className="font-display text-sm font-bold text-[#111111]">
                {spec.name} ships with:
              </p>
              <ul className="mt-2 grid gap-1 text-[12px] text-[#2c2823]">
                <li>· {build.layers.length} layered shapes, {build.bones.length} bones</li>
                <li>· no external assets, zero runtime API dependencies</li>
                <li>· the same deterministic motion you just watched</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ExportModal;
