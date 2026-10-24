import { Suspense } from "react";
import type { Metadata } from "next";
import StudioClient from "@/components/studio/StudioClient";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Compile a layered vector mascot, direct its rig, preview 11 authored moves, and export Lottie, SVG, PNG, or an SDK.",
};

function StudioSkeleton() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="card flex max-w-sm flex-col items-center gap-3 p-6 text-center">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-ink bg-butter" />
        <p className="font-display text-xl font-extrabold">Warming the press…</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Loading the studio locally
        </p>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <StudioClient />
    </Suspense>
  );
}
