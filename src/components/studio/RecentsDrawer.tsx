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
      className="fixed inset-0 z-[65] flex justify-end bg-ink/40 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="recents-title"
        className="toast flex h-full w-full max-w-[380px] flex-col border-l-2 border-ink bg-paper"
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <div>
            <p className="mono-label">Saved locally</p>
            <h2 id="recents-title" className="font-display text-xl font-extrabold">
              Recent mascots
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white"
            aria-label="Close recent mascots"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {recents.length === 0 ? (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 px-4 py-10 text-center">
              <p className="font-display text-lg font-bold">No saved looks yet.</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/55">
                Generate a mascot, then hit “Save this look” to keep it here.
                Everything stays in this browser.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recents.map((spec, index) => (
                <li
                  key={`${spec.seed}-${index}-${spec.name}`}
                  className="group flex items-center gap-2 rounded-xl border-2 border-ink bg-white p-1.5"
                >
                  <button
                    type="button"
                    onClick={() => onLoad(spec)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/20 bg-paper">
                      <MascotThumb spec={spec} className="w-12" at={0.45} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-bold leading-tight">
                        {spec.name || "Untitled"}
                      </span>
                      <span className="block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-ink-soft">
                        {spec.species} · {spec.vibe} · {spec.tagline}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink/50 hover:border-ink hover:text-coral"
                    aria-label={`Delete ${spec.name}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t-2 border-ink px-4 py-3">
          <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-ink-soft">
            Stored in localStorage only. No account, no sync, no “sign in to
            continue”.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default RecentsDrawer;
