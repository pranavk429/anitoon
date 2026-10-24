"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
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
    setLoaded(false);
    setPlaying(true);
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 p-3 backdrop-blur-sm sm:p-6"
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
        className="relative max-h-[94vh] w-full max-w-[980px] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[10px_10px_0_#17151C]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-ink bg-paper/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="mono-label">Export · preview</p>
            <h2 id="export-title" className="font-display text-xl font-extrabold">
              {spec.name} · {def.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "chip !py-1.5 text-[9px]",
                loaded ? "bg-mint" : "bg-white",
              )}
            >
              <span
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  loaded ? "bg-ink" : "bg-coral blink-dot",
                )}
              />
              {loaded ? "lottie-web ok" : "loading"}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white hover:bg-coral"
              aria-label="Close export preview"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="min-w-0 border-b-2 border-ink p-3 md:border-b-0 md:border-r-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="mono-label flex items-center gap-1.5">
                <Film size={11} /> Lottie render
              </span>
              <div className="flex items-center gap-1">
                {(["paper", "transparent", "ink"] as PreviewBg[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBg(b)}
                    className="rounded-full border border-ink/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em] hover:border-ink"
                    aria-pressed={bg === b}
                  >
                    {b === "transparent" ? "none" : b}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={clsx(
                "relative overflow-hidden rounded-xl border-2 border-ink",
                bg === "paper" && "halftone bg-white",
                bg === "transparent" &&
                  "bg-[repeating-conic-gradient(#e7ddc9_0%_25%,#fffdf7_0%_50%)] bg-[length:24px_24px]",
                bg === "ink" && "bg-ink",
              )}
            >
              <div
                ref={containerRef}
                className="relative z-10 aspect-[420/430] w-full"
                aria-label={`Lottie preview of ${spec.name}`}
              />
              {!loaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-ink/40" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-full border border-ink bg-white/90 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em]">
                <span className="h-1.5 w-1.5 rounded-full bg-coral blink-dot" />
                {def.duration}s · 30fps
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-blue text-white"
                  aria-label={playing ? "Pause preview" : "Play preview"}
                >
                  {playing ? (
                    <Pause size={13} fill="currentColor" />
                  ) : (
                    <Play size={13} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                  {formatBytes(size)} · {(animationData as { layers?: unknown[] }).layers?.length ?? 0}{" "}
                  layers
                </span>
              </div>
              <span className="chip !py-1 text-[8px] bg-white">
                <Check size={9} strokeWidth={4} /> same rig as stage
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {MOTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMotion(m.id)}
                  className={clsx(
                    "flex items-center justify-between rounded-lg border px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.06em]",
                    motion === m.id
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white hover:border-ink",
                  )}
                  aria-pressed={motion === m.id}
                >
                  {m.name}
                  <span className="opacity-60">{m.duration}s</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 p-4">
            <p id="export-desc" className="break-words text-[13px] leading-relaxed text-ink/65">
              This is the actual exported Lottie, loaded with lottie-web from a
              string — no server, no re-render. If it moves here, it will move
              on your site.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-1.5">
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
                  className="flex min-w-0 flex-col items-start gap-1 rounded-xl border-2 border-ink bg-white p-2.5 text-left shadow-[2px_2px_0_#17151C] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Download size={14} />
                  <span className="font-display text-sm font-bold leading-none">
                    {label}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-soft">
                    {exporting === fmt ? "working…" : detail}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border-2 border-dashed border-ink/25 bg-white/70 p-3">
              <p className="mono-label mb-1.5">Share it</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onCopy(studioUrl, "Studio link copied")}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-left hover:border-ink"
                >
                  <span className="min-w-0 flex-1 truncate text-[10px]">{studioUrl}</span>
                  <span className="shrink-0 font-mono text-[8px] uppercase">
                    copy
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(publicUrl, "Public link copied")}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-left hover:border-ink"
                >
                  <span className="min-w-0 flex-1 truncate text-[10px]">{publicUrl}</span>
                  <span className="shrink-0 font-mono text-[8px] uppercase">
                    copy
                  </span>
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-blue hover:underline"
                >
                  Open public page <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-ink/15 bg-paper/70 p-3">
              <p className="font-display text-sm font-bold">
                {spec.name} ships with:
              </p>
              <ul className="mt-1.5 grid gap-1 text-[11px] text-ink/60">
                <li>· {build.layers.length} layered shapes, {build.bones.length} bones</li>
                <li>· no external assets, no runtime API</li>
                <li>· the same motion you just watched</li>
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
