"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { Check, Dices, Shuffle } from "lucide-react";
import { MascotThumb } from "./MascotThumb";
import {
  ACCESSORY_IDS,
  ACCESSORY_META,
  EYE_IDS,
  EYE_META,
  MOUTH_IDS,
  MOUTH_META,
  PALETTE_PRESETS,
  PATTERN_IDS,
  PATTERN_META,
  SPECIES_IDS,
  SPECIES_META,
  VIBE_IDS,
  VIBE_META,
  type MascotSpec,
} from "@/lib/mascot/spec";

export function CharacterPanel({
  spec,
  update,
  onShuffle,
  onSaveLook,
  onNotify,
}: {
  spec: MascotSpec;
  update: (patch: Partial<MascotSpec>) => void;
  onShuffle: () => void;
  onSaveLook: () => void;
  onNotify: (message: string) => void;
}) {
  const thumbSpecs = useMemo(
    () =>
      SPECIES_IDS.map((species) =>
        ({
          ...spec,
          species,
          seed: spec.seed,
        }) satisfies MascotSpec,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      spec.primary,
      spec.accent,
      spec.ink,
      spec.vibe,
      spec.eyes,
      spec.mouth,
      spec.pattern,
      spec.accessories.join(","),
      spec.seed,
    ],
  );

  const toggleAccessory = (accessory: MascotSpec["accessories"][number]) => {
    const has = spec.accessories.includes(accessory);
    if (!has && spec.accessories.length >= 4) {
      onNotify("Four accessories max — the mascot has to breathe.");
      return;
    }
    update({
      accessories: has
        ? spec.accessories.filter((a) => a !== accessory)
        : [...spec.accessories, accessory],
    });
  };

  return (
    <section
      aria-labelledby="character-heading"
      className="rounded-2xl border-2 border-ink bg-white p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-mint font-mono text-[9px] font-bold shadow-[1px_1px_0_#17151C]">
            02
          </span>
          <h2
            id="character-heading"
            className="font-display text-lg font-extrabold"
          >
            Character
          </h2>
        </div>
        <button
          type="button"
          onClick={onShuffle}
          className="chip !px-2 !py-1.5"
          title="Shuffle this mascot"
        >
          <Dices size={12} />
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mono-label mb-1 block">Name</span>
          <input
            className="field !px-2.5 !py-1.5 !text-[12px]"
            value={spec.name}
            maxLength={22}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Mochi"
          />
        </label>
        <label className="block">
          <span className="mono-label mb-1 block">Tagline</span>
          <input
            className="field !px-2.5 !py-1.5 !text-[12px]"
            value={spec.tagline}
            maxLength={48}
            onChange={(e) => update({ tagline: e.target.value })}
            placeholder="Chief good-vibes officer"
          />
        </label>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-label">Species</span>
          <span className="font-mono text-[9px] text-ink-soft">
            {SPECIES_META[spec.species].short}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {thumbSpecs.map((thumbSpec, i) => {
            const id = SPECIES_IDS[i];
            const active = spec.species === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update({ species: id })}
                aria-pressed={active}
                aria-label={SPECIES_META[id].label}
                className={clsx(
                  "group relative overflow-hidden rounded-lg border-2 bg-paper/70 p-0.5 transition-all",
                  active
                    ? "border-blue shadow-[2px_2px_0_#2B4BF2]"
                    : "border-ink/20 hover:border-ink",
                )}
              >
                <MascotThumb
                  spec={thumbSpec}
                  at={0.5}
                  className="[&>svg]:drop-shadow-none"
                />
                <span className="block bg-white/80 py-0.5 text-center font-mono text-[8px] uppercase tracking-[0.05em]">
                  {SPECIES_META[id].label}
                </span>
                {active && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue text-white">
                    <Check size={8} strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <span className="mono-label mb-1.5 block">Vibe</span>
        <div className="grid grid-cols-3 gap-1.5">
          {VIBE_IDS.map((vibe) => (
            <button
              key={vibe}
              type="button"
              onClick={() => update({ vibe })}
              aria-pressed={spec.vibe === vibe}
              title={VIBE_META[vibe].blurb}
              className={clsx(
                "flex items-center gap-1 rounded-lg border-2 px-1.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.04em] transition-colors",
                spec.vibe === vibe
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-paper/60 hover:border-ink",
              )}
            >
              <span aria-hidden="true">{VIBE_META[vibe].emoji}</span>
              {VIBE_META[vibe].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-label">Palette</span>
          <span className="font-mono text-[9px] text-ink-soft">
            presets + custom
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {PALETTE_PRESETS.map((preset) => {
            const active =
              spec.primary.toLowerCase() === preset.primary.toLowerCase() &&
              spec.accent.toLowerCase() === preset.accent.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  update({ primary: preset.primary, accent: preset.accent })
                }
                aria-pressed={active}
                title={preset.name}
                className={clsx(
                  "relative aspect-square overflow-hidden rounded-full border-2",
                  active
                    ? "border-blue shadow-[2px_2px_0_#2B4BF2]"
                    : "border-ink hover:scale-105",
                )}
                style={{
                  background: `linear-gradient(135deg, ${preset.primary} 0 55%, ${preset.accent} 55% 100%)`,
                }}
              >
                <span className="sr-only">{preset.name}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ["Body", spec.primary, "primary"],
            ["Accent", spec.accent, "accent"],
            ["Ink", spec.ink, "ink"],
          ].map(([label, value, key]) => (
            <label
              key={key}
              className="flex items-center gap-1.5 rounded-lg border border-ink/15 bg-paper/50 px-1.5 py-1"
            >
              <span
                className="color-swatch !h-6 !w-6 !rounded-md !shadow-none"
                style={{ background: value }}
              >
                <input
                  type="color"
                  value={value}
                  aria-label={`${label} color`}
                  onChange={(e) =>
                    update({ [key]: e.target.value } as Partial<MascotSpec>)
                  }
                />
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.08em]">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <span className="mono-label mb-1 block">Eyes</span>
          <div className="flex flex-wrap gap-1">
            {EYE_IDS.map((eye) => (
              <button
                key={eye}
                type="button"
                className="chip !px-2 !py-1 text-[9px]"
                aria-pressed={spec.eyes === eye}
                data-active={spec.eyes === eye}
                onClick={() => update({ eyes: eye })}
              >
                {EYE_META[eye].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mono-label mb-1 block">Mouth</span>
          <div className="flex flex-wrap gap-1">
            {MOUTH_IDS.map((mouth) => (
              <button
                key={mouth}
                type="button"
                className="chip !px-2 !py-1 text-[9px]"
                aria-pressed={spec.mouth === mouth}
                data-active={spec.mouth === mouth}
                onClick={() => update({ mouth })}
              >
                {MOUTH_META[mouth].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mono-label mb-1 block">Pattern</span>
          <div className="flex flex-wrap gap-1">
            {PATTERN_IDS.map((pattern) => (
              <button
                key={pattern}
                type="button"
                className="chip !px-2 !py-1 text-[9px]"
                aria-pressed={spec.pattern === pattern}
                data-active={spec.pattern === pattern}
                onClick={() => update({ pattern })}
              >
                {PATTERN_META[pattern].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-label">Accessories</span>
          <span className="font-mono text-[9px] text-ink-soft">
            {spec.accessories.length}/4
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {ACCESSORY_IDS.map((accessory) => {
            const active = spec.accessories.includes(accessory);
            return (
              <button
                key={accessory}
                type="button"
                onClick={() => toggleAccessory(accessory)}
                aria-pressed={active}
                className={clsx(
                  "relative rounded-lg border-2 px-1 py-1.5 font-mono text-[8px] uppercase leading-tight tracking-[0.03em] transition-colors",
                  active
                    ? "border-ink bg-butter"
                    : "border-ink/15 bg-paper/50 hover:border-ink",
                )}
              >
                {ACCESSORY_META[accessory].label}
                {active && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full border border-ink bg-white">
                    <Check size={7} strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onSaveLook}
        className="btn mt-3 w-full !min-h-[36px] !text-[10px]"
      >
        <Shuffle size={12} className="rotate-90" />
        Save this look
      </button>
    </section>
  );
}

export default CharacterPanel;
