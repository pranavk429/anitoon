"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileArchive,
  FileCode2,
  FileImage,
  Film,
  Link2,
  Loader2,
  Play,
  Share2,
} from "lucide-react";
import type { MotionId } from "@/lib/mascot/animate";
import { MOTION_BY_ID } from "@/lib/mascot/animate";
import { formatBytes } from "@/lib/mascot/lottie";

export type ExportFormat = "lottie" | "svg" | "png" | "sdk";

const FORMATS: Array<{
  key: ExportFormat;
  name: string;
  desc: string;
  icon: typeof Film;
  color: string;
}> = [
  {
    key: "lottie",
    name: "Lottie",
    desc: "Animated JSON",
    icon: Film,
    color: "bg-blue text-white",
  },
  {
    key: "svg",
    name: "SVG",
    desc: "Vector still",
    icon: FileCode2,
    color: "bg-butter",
  },
  {
    key: "png",
    name: "PNG",
    desc: "1024 × 1024",
    icon: FileImage,
    color: "bg-mint",
  },
  {
    key: "sdk",
    name: "SDK zip",
    desc: "6 files",
    icon: FileArchive,
    color: "bg-coral",
  },
];

export function ShipPanel({
  motion,
  onMotion,
  lottieSize,
  svgSize,
  onDownload,
  onPreview,
  exporting,
  studioUrl,
  publicUrl,
  embed,
  onCopy,
  onNew,
  onSaveLook,
}: {
  motion: MotionId;
  onMotion: (m: MotionId) => void;
  lottieSize: number;
  svgSize: number;
  onDownload: (format: ExportFormat, transparent: boolean) => void;
  onPreview: () => void;
  exporting: ExportFormat | null;
  studioUrl: string;
  publicUrl: string;
  embed: string;
  onCopy: (text: string, label: string) => void;
  onNew: () => void;
  onSaveLook: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("lottie");
  const [transparent, setTransparent] = useState(false);
  const def = MOTION_BY_ID[motion];
  const selected = FORMATS.find((f) => f.key === format) ?? FORMATS[0];
  const busy = exporting === format;

  return (
    <section
      aria-labelledby="ship-heading"
      className="flex flex-col gap-3"
    >
      <div className="rounded-2xl border-2 border-ink bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-coral font-mono text-[9px] font-bold shadow-[1px_1px_0_#17151C]">
              03
            </span>
            <h2 id="ship-heading" className="font-display text-lg font-extrabold">
              Ship
            </h2>
          </div>
          <span className="mono-label">pick a format</span>
        </div>

        <label className="mb-2 block">
          <span className="mono-label mb-1 block">Motion baked into export</span>
          <select
            className="field !px-2.5 !py-2 !text-[12px]"
            value={motion}
            onChange={(e) => onMotion(e.target.value as MotionId)}
          >
            {Object.values(MOTION_BY_ID).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.duration}s
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-1.5">
          {FORMATS.map((f) => {
            const active = format === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFormat(f.key)}
                aria-pressed={active}
                className={clsx(
                  "relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-2 text-left transition-all",
                  active
                    ? "border-ink bg-paper shadow-[2px_2px_0_#17151C]"
                    : "border-ink/15 bg-paper/40 hover:border-ink",
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink",
                    f.color,
                  )}
                >
                  <f.icon size={13} strokeWidth={2.4} />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-bold leading-none">
                    {f.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.06em] text-ink-soft">
                    {f.desc}
                  </span>
                </span>
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue text-white">
                    <Check size={9} strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 rounded-lg border border-ink/15 bg-paper/50 px-2 py-1.5">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.08em]">
            <span className="text-ink-soft">
              {selected.name} · {def.name}
            </span>
            <span>
              {format === "lottie"
                ? formatBytes(lottieSize)
                : format === "svg"
                  ? formatBytes(svgSize)
                  : format === "png"
                    ? "1024²"
                    : "6 files"}
            </span>
          </div>
          {(format === "png" || format === "svg") && (
            <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[10px] text-ink/65">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-3 w-3 accent-blue"
              />
              Transparent background
            </label>
          )}
        </div>

        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => onDownload(format, transparent)}
            disabled={Boolean(exporting)}
            className="btn btn-primary flex-1 !min-h-[38px] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            {busy
              ? format === "sdk"
                ? "Zipping…"
                : "Rendering…"
              : `Download ${selected.name}`}
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="btn !min-h-[38px] !px-2.5"
            title="Preview the Lottie"
          >
            <Play size={13} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-white p-3">
        <div className="mb-2 flex items-center gap-2">
          <Share2 size={14} />
          <h3 className="font-display text-base font-extrabold">Share</h3>
        </div>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onCopy(studioUrl, "Studio link copied")}
            className="group flex w-full items-center gap-2 rounded-lg border border-ink/15 bg-paper/50 px-2 py-1.5 text-left hover:border-ink"
          >
            <Link2 size={12} className="shrink-0 text-blue" />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft">
                Editable studio link
              </span>
              <span className="block truncate text-[10px]">{studioUrl}</span>
            </span>
            <Copy size={12} className="shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onCopy(publicUrl, "Public link copied")}
            className="group flex w-full items-center gap-2 rounded-lg border border-ink/15 bg-paper/50 px-2 py-1.5 text-left hover:border-ink"
          >
            <ArrowUpRight size={12} className="shrink-0 text-coral" />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft">
                Public mascot page
              </span>
              <span className="block truncate text-[10px]">{publicUrl}</span>
            </span>
            <Copy size={12} className="shrink-0" />
          </button>
        </div>

        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-dashed border-ink/25 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] [&::-webkit-details-marker]:hidden">
            Embed snippet
            <span className="text-ink-soft transition-transform group-open:rotate-90">
              ›
            </span>
          </summary>
          <div className="mt-1.5">
            <pre className="scrollbar-thin max-h-32 overflow-auto rounded-lg border border-ink/20 bg-ink p-2 font-mono text-[8.5px] leading-relaxed text-paper/85">
              {embed}
            </pre>
            <button
              type="button"
              onClick={() => onCopy(embed, "Embed snippet copied")}
              className="chip mt-1.5 !py-1 text-[8px]"
            >
              <Copy size={10} /> Copy snippet
            </button>
          </div>
        </details>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-paper/60 p-3">
        <p className="font-display text-sm font-bold">Keep this one around.</p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink/55">
          Autosaves locally in this browser. No account, no cloud, no
          “upgrade to export”.
        </p>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={onSaveLook}
            className="btn btn-sm flex-1"
          >
            Save look
          </button>
          <button type="button" onClick={onNew} className="btn btn-sm flex-1">
            New mascot
          </button>
        </div>
      </div>
    </section>
  );
}

export default ShipPanel;
