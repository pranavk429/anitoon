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
    color: "bg-[#4b63ff] text-white",
  },
  {
    key: "svg",
    name: "SVG",
    desc: "Vector still",
    icon: FileCode2,
    color: "bg-[#ffc53d] text-[#111111]",
  },
  {
    key: "png",
    name: "PNG",
    desc: "1024 × 1024",
    icon: FileImage,
    color: "bg-[#6fd6a8] text-[#111111]",
  },
  {
    key: "sdk",
    name: "SDK zip",
    desc: "6 files",
    icon: FileArchive,
    color: "bg-[#ff5a45] text-white",
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
      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#efece4] font-mono text-[10px] font-bold text-[#111111]">
              03
            </span>
            <h2 id="ship-heading" className="font-display text-lg font-extrabold text-[#111111]">
              Ship
            </h2>
          </div>
          <span className="mono-label text-[10px]">pick a format</span>
        </div>

        <label className="mb-2.5 block">
          <span className="mono-label mb-1 block text-[10px]">Motion baked into export</span>
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

        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => {
            const active = format === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFormat(f.key)}
                aria-pressed={active}
                className={clsx(
                  "relative flex flex-col items-start gap-1.5 rounded-[13px] border p-2.5 text-left transition-all",
                  active
                    ? "border-[#4b63ff] bg-[#efece4]/50 shadow-[0_0_0_2px_rgba(75,99,255,0.2)]"
                    : "border-[#d7d4cb] bg-[#efece4]/30 hover:border-[#4b63ff]",
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#d7d4cb]",
                    f.color,
                  )}
                >
                  <f.icon size={13} strokeWidth={2.4} />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-bold leading-none text-[#111111]">
                    {f.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.06em] text-[#6f6759]">
                    {f.desc}
                  </span>
                </span>
                {active && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#4b63ff] text-white">
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-[10px] border border-[#d7d4cb] bg-[#efece4]/40 px-2.5 py-2">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.08em]">
            <span className="text-[#6f6759]">
              {selected.name} · {def.name}
            </span>
            <span className="text-[#111111] font-semibold">
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
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-[#2c2823]">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#4b63ff]"
              />
              Transparent background
            </label>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onDownload(format, transparent)}
            disabled={Boolean(exporting)}
            className="btn btn-primary flex-1 !min-h-[40px] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
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
            className="btn !min-h-[40px] !px-3"
            title="Preview the Lottie"
          >
            <Play size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-4 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2">
          <Share2 size={14} className="text-[#4b63ff]" />
          <h3 className="font-display text-base font-extrabold text-[#111111]">Share</h3>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onCopy(studioUrl, "Studio link copied")}
            className="group flex w-full items-center gap-2 rounded-[10px] border border-[#d7d4cb] bg-[#efece4]/40 px-2.5 py-2 text-left hover:border-[#4b63ff]"
          >
            <Link2 size={13} className="shrink-0 text-[#4b63ff]" />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[#6f6759]">
                Editable studio link
              </span>
              <span className="block truncate text-[11px] text-[#111111]">{studioUrl}</span>
            </span>
            <Copy size={13} className="shrink-0 text-[#6f6759]" />
          </button>
          <button
            type="button"
            onClick={() => onCopy(publicUrl, "Public link copied")}
            className="group flex w-full items-center gap-2 rounded-[10px] border border-[#d7d4cb] bg-[#efece4]/40 px-2.5 py-2 text-left hover:border-[#4b63ff]"
          >
            <ArrowUpRight size={13} className="shrink-0 text-[#ff5a45]" />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[#6f6759]">
                Public mascot page
              </span>
              <span className="block truncate text-[11px] text-[#111111]">{publicUrl}</span>
            </span>
            <Copy size={13} className="shrink-0 text-[#6f6759]" />
          </button>
        </div>

        <details className="group mt-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-[10px] border border-dashed border-[#d7d4cb] px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#2c2823] [&::-webkit-details-marker]:hidden">
            Embed snippet
            <span className="text-[#6f6759] transition-transform group-open:rotate-90">
              ›
            </span>
          </summary>
          <div className="mt-2">
            <pre className="scrollbar-thin max-h-32 overflow-auto rounded-[10px] border border-[#d7d4cb] bg-[#111111] p-2.5 font-mono text-[9px] leading-relaxed text-[#fefdf9]">
              {embed}
            </pre>
            <button
              type="button"
              onClick={() => onCopy(embed, "Embed snippet copied")}
              className="chip mt-2 !py-1 text-[9px] min-h-[28px]"
            >
              <Copy size={11} /> Copy snippet
            </button>
          </div>
        </details>
      </div>

      <div className="rounded-[17px] border border-[#d7d4cb] bg-[#efece4]/50 p-4">
        <p className="font-display text-sm font-bold text-[#111111]">Keep this one around.</p>
        <p className="mt-0.5 text-[12px] leading-snug text-[#6f6759]">
          Autosaves locally in this browser. No account, no cloud, no “upgrade to export”.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSaveLook}
            className="btn btn-sm flex-1 !min-h-[36px]"
          >
            Save look
          </button>
          <button type="button" onClick={onNew} className="btn btn-sm flex-1 !min-h-[36px]">
            New mascot
          </button>
        </div>
      </div>
    </section>
  );
}

export default ShipPanel;
