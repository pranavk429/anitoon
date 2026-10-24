"use client";

import { X } from "lucide-react";
import { MascotThumb } from "./MascotThumb";
import type { MascotSpec } from "@/lib/mascot/spec";

export function RecentsDrawer({
  open,
  onClose,
  recents,
  onLoad,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  recents: MascotSpec[];
  onLoad: (spec: MascotSpec) => void;
  onDelete: (index: number) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[65] flex justify-end bg-[#111111]/40 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="recents-title"
        className="toast flex h-full w-full max-w-[380px] flex-col border-l border-[#d7d4cb] bg-[#efece4] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#d7d4cb] px-5 py-3.5 bg-[#efece4]">
          <div>
            <p className="mono-label text-[10px]">Saved locally</p>
            <h2 id="recents-title" className="font-display text-xl font-extrabold text-[#111111]">
              Recent mascots
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] text-[#111111] hover:bg-[#e2d8c6]"
            aria-label="Close recent mascots"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {recents.length === 0 ? (
            <div className="mt-10 rounded-[17px] border border-dashed border-[#d7d4cb] bg-[#fefdf9] px-4 py-10 text-center">
              <p className="font-display text-lg font-bold text-[#111111]">No saved looks yet.</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#6f6759]">
                Generate a mascot, then hit “Save this look” to keep it here.
                Everything stays in this browser.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recents.map((spec, index) => (
                <li
                  key={`${spec.seed}-${index}-${spec.name}`}
                  className="group flex items-center gap-2 rounded-[13px] border border-[#d7d4cb] bg-[#fefdf9] p-2 shadow-sm transition hover:border-[#4b63ff]"
                >
                  <button
                    type="button"
                    onClick={() => onLoad(spec)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#d7d4cb] bg-[#efece4]">
                      <MascotThumb spec={spec} className="w-12" at={0.45} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-bold leading-tight text-[#111111]">
                        {spec.name || "Untitled"}
                      </span>
                      <span className="block truncate font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759]">
                        {spec.species} · {spec.vibe} · {spec.tagline}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7d4cb] text-[#6f6759] hover:border-[#ff5a45] hover:text-[#ff5a45]"
                    aria-label={`Delete ${spec.name}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-[#d7d4cb] px-5 py-3.5 bg-[#efece4]">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-[#6f6759]">
            Stored in localStorage only. No account, zero cloud lock-in.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default RecentsDrawer;
