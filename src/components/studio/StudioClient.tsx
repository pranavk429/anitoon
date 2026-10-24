"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  Check,
  Download,
  FileText,
  History,
  Loader2,
  Play,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { buildMascot } from "@/lib/mascot/art";
import {
  MOTION_BY_ID,
  type MotionId,
} from "@/lib/mascot/animate";
import { mapMotionTo3D } from "@/lib/three/mascot3d";
import { DEMO_SPEC } from "@/lib/mascot/presets";
import {
  createSpec,
  decodeSpec,
  encodeSpec,
  parsePrompt,
  randomSpec,
  SPECIES_META,
  VIBE_META,
  type MascotSpec,
  type ParsedPrompt,
} from "@/lib/mascot/spec";
import {
  buildSdkZip,
  downloadLottie,
  downloadPng,
  downloadSdk,
  downloadSvg,
  embedSnippet,
  svgFor,
} from "@/lib/mascot/export";
import { compileLottie, formatBytes, lottieBytes } from "@/lib/mascot/lottie";
import { BriefPanel } from "./BriefPanel";
import { CharacterPanel } from "./CharacterPanel";
import { StagePanel } from "./StagePanel";
import { Stage3DPanel } from "./Stage3DPanel";
import { ShipPanel, type ExportFormat } from "./ShipPanel";
import { ExportModal } from "./ExportModal";
import { RecentsDrawer } from "./RecentsDrawer";

const SPEC_KEY = "anitoon.spec.v1";
const RECENTS_KEY = "anitoon.recents.v1";
const DEFAULT_PROMPT = "A sunny orange cat named Mochi with a blue scarf";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function describeSpec(spec: MascotSpec) {
  return `A ${VIBE_META[spec.vibe].label.toLowerCase()} ${SPECIES_META[spec.species].label.toLowerCase()} mascot named ${spec.name}`;
}

function readSpec(raw: string | null): MascotSpec | null {
  if (!raw) return null;
  if (raw.trim().startsWith("{")) {
    try {
      return createSpec(JSON.parse(raw) as Partial<MascotSpec>);
    } catch {
      return null;
    }
  }
  return decodeSpec(raw);
}

type Tab = "brief" | "stage" | "ship";
type StageMode = "2d" | "3d";

export function StudioClient() {
  const searchParams = useSearchParams();
  const [spec, setSpec] = useState<MascotSpec>(DEMO_SPEC);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [motion, setMotion] = useState<MotionId>("wave");
  const [signals, setSignals] = useState<ParsedPrompt["signals"] | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [saveTime, setSaveTime] = useState("");
  const [recents, setRecents] = useState<MascotSpec[]>([]);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("stage");
  const [stageMode, setStageMode] = useState<StageMode>("2d");
  const [origin, setOrigin] = useState("");
  const booted = useRef(false);
  const genId = useRef(0);

  const notify = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setOrigin(window.location.origin);

    let nextSpec: MascotSpec = DEMO_SPEC;
    let nextPrompt = DEFAULT_PROMPT;
    let nextSignals: ParsedPrompt["signals"] | null = null;
    let nextMotion: MotionId = "wave";

    const qCode = searchParams.get("m");
    const qPrompt = searchParams.get("prompt");
    const qMove = searchParams.get("move") as MotionId | null;
    const qMode = searchParams.get("mode");

    if (qCode) {
      const decoded = decodeSpec(qCode);
      if (decoded) {
        nextSpec = decoded;
        nextPrompt = describeSpec(decoded);
      }
    } else if (qPrompt && qPrompt.trim()) {
      try {
        const parsed = parsePrompt(qPrompt);
        nextSpec = parsed.spec;
        nextPrompt = qPrompt;
        nextSignals = parsed.signals;
      } catch {
        nextSpec = randomSpec();
        nextPrompt = qPrompt;
      }
    } else {
      try {
        const saved = readSpec(window.localStorage.getItem(SPEC_KEY));
        if (saved) {
          nextSpec = saved;
          nextPrompt = describeSpec(saved);
        }
      } catch {
        /* localStorage can be unavailable in private modes */
      }
    }

    if (qMove && qMove in MOTION_BY_ID) nextMotion = qMove;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (qMode === "3d") setStageMode("3d");

    const recentCodes = window.localStorage.getItem(RECENTS_KEY);
    if (recentCodes) {
      try {
        const parsed = JSON.parse(recentCodes) as unknown;
        if (Array.isArray(parsed)) {
          const loaded = parsed
            .map((code) => (typeof code === "string" ? decodeSpec(code) : null))
            .filter((value): value is MascotSpec => Boolean(value));
          queueMicrotask(() => setRecents(loaded));
        }
      } catch {
        /* ignore malformed recents */
      }
    }

    setSpec(nextSpec);
    setPrompt(nextPrompt);
    setSignals(nextSignals);
    setMotion(nextMotion);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the working spec, debounced. Sharing still uses the URL.
  useEffect(() => {
    if (!hydrated) return;
    queueMicrotask(() => setSaveState("saving"));
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(SPEC_KEY, encodeSpec(spec));
        setSaveTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setSaveState("saved");
      } catch {
        setSaveState("saved");
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [spec, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        RECENTS_KEY,
        JSON.stringify(recents.map((item) => encodeSpec(item))),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [recents, hydrated]);

  const build = useMemo(() => buildMascot(spec), [spec]);
  const lottie = useMemo(() => compileLottie(build, motion), [build, motion]);
  const lottieSize = useMemo(() => lottieBytes(lottie), [lottie]);
  const svgSize = useMemo(
    () => new TextEncoder().encode(svgFor(build, motion)).byteLength,
    [build, motion],
  );
  const code = useMemo(() => encodeSpec(spec), [spec]);
  const studioParams = useMemo(() => {
    const params = new URLSearchParams({ m: code, move: motion });
    if (stageMode === "3d") params.set("mode", "3d");
    return params.toString();
  }, [code, motion, stageMode]);
  const studioUrl = origin ? `${origin}/studio?${studioParams}` : `/studio?${studioParams}`;
  const publicUrl = origin ? `${origin}/m/${code}` : `/m/${code}`;
  const motion3d = useMemo(() => mapMotionTo3D(motion), [motion]);
  const embed = useMemo(
    () => embedSnippet(spec, origin || "https://your-site.com", code),
    [spec, origin, code],
  );

  const addRecent = useCallback((next: MascotSpec) => {
    setRecents((prev) => {
      const nextCode = encodeSpec(next);
      const filtered = prev.filter((item) => encodeSpec(item) !== nextCode);
      return [next, ...filtered].slice(0, 10);
    });
  }, []);

  const update = useCallback((patch: Partial<MascotSpec>) => {
    setSpec((prev) => ({ ...prev, ...patch }));
  }, []);

  const generate = useCallback(
    async (text?: string) => {
      const raw = (text ?? prompt).trim();
      if (!raw) {
        notify("Give the compiler a sentence first.");
        return;
      }
      if (compiling) return;
      const id = ++genId.current;
      setPrompt(raw);
      setCompiling(true);
      setCompileStatus("Reading the brief");
      await sleep(130);
      if (id !== genId.current) return;
      setCompileStatus("Rigging the skeleton");
      await sleep(150);
      if (id !== genId.current) return;
      setCompileStatus("Baking 11 moves");
      await sleep(130);
      if (id !== genId.current) return;

      try {
        const parsed = parsePrompt(raw);
        setSpec(parsed.spec);
        setSignals(parsed.signals);
        addRecent(parsed.spec);
        setCompiling(false);
        setCompileStatus("Compiled");
        notify(
          `Compiled ${parsed.spec.name} the ${parsed.spec.species} in 0.4s.`,
        );
        try {
          window.history.replaceState(
            null,
            "",
            `/studio?m=${encodeSpec(parsed.spec)}`,
          );
        } catch {
          /* history is best-effort */
        }
      } catch {
        const fallback = randomSpec();
        setSpec(fallback);
        setSignals(null);
        addRecent(fallback);
        setCompiling(false);
        notify("The brief was unusual; here's a solid fallback.");
      }
    },
    [prompt, compiling, notify, addRecent],
  );

  const surprise = useCallback(() => {
    const next = randomSpec(Math.floor(Math.random() * 2 ** 31));
    const text = describeSpec(next);
    setSpec(next);
    setPrompt(text);
    setSignals(null);
    setMotion("wave");
    addRecent(next);
    notify(`Surprise: ${next.name} the ${next.species}.`);
    try {
      window.history.replaceState(null, "", `/studio?m=${encodeSpec(next)}`);
    } catch {
      /* best-effort */
    }
  }, [addRecent, notify]);

  const shuffleLook = useCallback(() => {
    const next = randomSpec(Math.floor(Math.random() * 2 ** 31));
    next.name = spec.name || next.name;
    next.tagline = spec.tagline || next.tagline;
    setSpec(next);
    notify("Shuffled the look. The name stayed.");
  }, [spec.name, spec.tagline, notify]);

  const newMascot = useCallback(() => {
    const next = createSpec({
      seed: Math.floor(Math.random() * 2 ** 31),
      name: "New mascot",
      species: "blob",
      primary: "#6FD6A8",
      accent: "#FF5A45",
      vibe: "sunny",
      eyes: "sparkle",
      mouth: "grin",
      tagline: "Fresh out of the compiler",
    });
    setSpec(next);
    setPrompt(describeSpec(next));
    setSignals(null);
    setMotion("wave");
    setExportOpen(false);
    setRecentsOpen(false);
    notify("New mascot. Same rig, clean slate.");
    try {
      window.history.replaceState(null, "", "/studio");
    } catch {
      /* best-effort */
    }
  }, [notify]);

  const saveLook = useCallback(() => {
    addRecent(spec);
    notify(`${spec.name || "Untitled"} saved to recent mascots.`);
  }, [addRecent, spec, notify]);

  const loadRecent = useCallback(
    (next: MascotSpec) => {
      setSpec(next);
      setPrompt(describeSpec(next));
      setSignals(null);
      setRecentsOpen(false);
      notify(`${next.name} loaded.`);
    },
    [notify],
  );

  const deleteRecent = useCallback((index: number) => {
    setRecents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const copy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify(label);
      } catch {
        try {
          const area = document.createElement("textarea");
          area.value = text;
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
          notify(label);
        } catch {
          notify("Copy failed — select the text manually.");
        }
      }
    },
    [notify],
  );

  const handleDownload = useCallback(
    async (format: ExportFormat, transparent: boolean) => {
      if (exporting) return;
      setExporting(format);
      try {
        let size = "";
        if (format === "lottie") {
          size = formatBytes(downloadLottie(spec, motion));
        } else if (format === "svg") {
          size = formatBytes(
            downloadSvg(spec, motion, transparent ? "transparent" : "paper"),
          );
        } else if (format === "png") {
          const bytes = await downloadPng(spec, {
            size: 1024,
            background: transparent ? "transparent" : "paper",
            motion,
          });
          size = formatBytes(bytes);
        } else {
          const bundle = await buildSdkZip(spec, motion);
          downloadSdk(bundle, spec);
          size = formatBytes(bundle.bytes);
        }
        addRecent(spec);
        notify(`${format.toUpperCase()} downloaded · ${size}`);
      } catch {
        notify("That export hit a snag. Try again — the rig is still here.");
      } finally {
        setExporting(null);
      }
    },
    [exporting, spec, motion, addRecent, notify],
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#d7d4cb] bg-[#efece4]/92 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1600px] items-center gap-2 px-2 sm:px-4">
          <Link href="/" aria-label="Anitoon home" className="shrink-0">
            <span className="sm:hidden">
              <Logo markOnly />
            </span>
            <span className="hidden sm:block">
              <Logo />
            </span>
          </Link>
          <span className="mx-1 hidden h-6 w-px bg-ink/20 sm:block" />
          <div className="min-w-0 flex-1 sm:flex-none">
            <label htmlFor="project-name" className="sr-only">
              Mascot project name
            </label>
            <input
              id="project-name"
              value={spec.name}
              maxLength={22}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Untitled mascot"
              className="w-full max-w-[190px] truncate rounded-md border-2 border-transparent bg-transparent px-1.5 py-1 font-display text-lg font-extrabold leading-none outline-none transition-colors hover:border-ink/20 focus:border-ink focus:bg-white sm:text-xl"
            />
            <p className="hidden px-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft sm:block">
              {spec.species} · {spec.vibe} · {spec.accessories.length} accessor
              {spec.accessories.length === 1 ? "y" : "ies"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="hidden items-center gap-1.5 pr-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft md:flex"
              role="status"
            >
              <span
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  saveState === "saving" ? "bg-coral blink-dot" : "bg-mint",
                )}
              />
              {saveState === "saving"
                ? "Saving…"
                : saveTime
                  ? `Saved ${saveTime}`
                  : "Saved locally"}
            </span>
            <button
              type="button"
              onClick={() => setRecentsOpen(true)}
              className="btn btn-sm !px-2.5"
              aria-label="Recent mascots"
            >
              <History size={14} />
              <span className="hidden xl:inline">Recents</span>
            </button>
            <button
              type="button"
              onClick={() => copy(studioUrl, "Studio link copied")}
              className="btn btn-sm !px-2.5"
              aria-label="Copy share link"
            >
              <Share2 size={14} />
              <span className="hidden lg:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="btn btn-primary btn-sm !px-2.5"
            >
              <Download size={14} />
              Export
            </button>
            <button
              type="button"
              onClick={newMascot}
              className="btn btn-sm !px-2.5"
              aria-label="New mascot"
            >
              <Plus size={14} />
              <span className="hidden xl:inline">New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-2 pb-28 pt-3 sm:px-4 lg:pb-8">
        <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)_320px] xl:grid-cols-[350px_minmax(0,1fr)_350px]">
          <aside
            aria-label="Brief and character"
            className={clsx(
              "scrollbar-thin space-y-3 lg:sticky lg:top-[76px] lg:block lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:pr-1",
              tab !== "brief" && "hidden",
            )}
          >
            <BriefPanel
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={generate}
              onSurprise={surprise}
              compiling={compiling}
              compileStatus={compileStatus}
              signals={signals}
              autoFocus
            />
            <CharacterPanel
              spec={spec}
              update={update}
              onShuffle={shuffleLook}
              onSaveLook={saveLook}
              onNotify={notify}
            />
            <div className="rounded-2xl border border-dashed border-ink/25 px-3 py-2.5">
              <p className="mono-label mb-1">Keyboard</p>
              <p className="text-[10px] leading-relaxed text-ink/55">
                <kbd className="rounded border border-ink/20 bg-white px-1">
                  ⌘
                </kbd>{" "}
                +{" "}
                <kbd className="rounded border border-ink/20 bg-white px-1">
                  ↵
                </kbd>{" "}
                compiles the brief. Everything else is a click.
              </p>
            </div>
          </aside>

          <div
            className={clsx(
              "min-w-0 lg:sticky lg:top-[76px] lg:block lg:self-start",
              tab !== "stage" && "hidden",
            )}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-full border border-[#d7d4cb] bg-[#fefdf9] p-1 pl-2.5 shadow-sm">
              <div
                role="group"
                aria-label="Stage renderer"
                className="flex items-center gap-1"
              >
                {(
                  [
                    ["2d", "2D vector", "Lottie · SVG"],
                    ["3d", "3D flagship", "GLB · live lights"],
                  ] as Array<[StageMode, string, string]>
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStageMode(value)}
                    aria-pressed={stageMode === value}
                    className={clsx(
                      "flex min-h-[32px] items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors",
                      stageMode === value
                        ? "bg-[#4b63ff] text-white"
                        : "text-[#2c2823] hover:bg-[#efece4]",
                    )}
                    title={hint}
                  >
                    {label}
                    {value === "3d" && (
                      <span
                        className={clsx(
                          "rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
                          stageMode === "3d"
                            ? "bg-white/20 text-white"
                            : "bg-[#ffc53d] text-[#111111]",
                        )}
                      >
                        new
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <span className="hidden pr-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6f6759] sm:inline">
                {stageMode === "3d"
                  ? "27 joints · 6 clips · morph targets"
                  : "18 bones · 11 moves · vector out"}
              </span>
            </div>

            {stageMode === "2d" ? (
              <StagePanel
                spec={spec}
                build={build}
                motion={motion}
                onMotion={setMotion}
                compiling={compiling}
                compileStatus={compileStatus}
                lottieSize={lottieSize}
              />
            ) : (
              <Stage3DPanel
                spec={spec}
                expression={spec.expression}
                onExpression={(expression) => update({ expression })}
                move={motion3d}
                onMove={(next) => setMotion(next)}
              />
            )}
          </div>

          <aside
            aria-label="Export and share"
            className={clsx(
              "scrollbar-thin space-y-3 lg:sticky lg:top-[76px] lg:block lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:pr-1",
              tab !== "ship" && "hidden",
            )}
          >
            <ShipPanel
              motion={motion}
              onMotion={setMotion}
              lottieSize={lottieSize}
              svgSize={svgSize}
              onDownload={handleDownload}
              onPreview={() => setExportOpen(true)}
              exporting={exporting}
              studioUrl={studioUrl}
              publicUrl={publicUrl}
              embed={embed}
              onCopy={copy}
              onNew={newMascot}
              onSaveLook={saveLook}
            />
          </aside>
        </div>
      </main>

      {/* mobile tab bar */}
      <nav
        aria-label="Studio sections"
        className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-full border border-[#d7d4cb] bg-[#fefdf9] p-1.5 shadow-md lg:hidden"
      >
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["brief", "Brief", FileText],
              ["stage", "Stage", Play],
              ["ship", "Ship", Download],
            ] as Array<[Tab, string, typeof FileText]>
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-pressed={tab === value}
              className={clsx(
                "flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-2 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
                tab === value ? "bg-[#4b63ff] text-white" : "text-[#2c2823] hover:text-[#111111]",
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        spec={spec}
        build={build}
        motion={motion}
        onMotion={setMotion}
        onDownload={handleDownload}
        exporting={exporting}
        onCopy={copy}
        studioUrl={studioUrl}
        publicUrl={publicUrl}
      />

      <RecentsDrawer
        open={recentsOpen}
        onClose={() => setRecentsOpen(false)}
        recents={recents}
        onLoad={loadRecent}
        onDelete={deleteRecent}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast fixed bottom-24 left-1/2 z-[80] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-full border-2 border-white bg-ink px-3.5 py-2 text-[11px] text-white shadow-[3px_3px_0_rgba(23,21,28,0.25)] lg:bottom-6"
        >
          <Check size={12} className="shrink-0 text-mint" />
          <span className="truncate">{toast.text}</span>
        </div>
      )}

      {compiling && (
        <div className="pointer-events-none fixed right-4 top-[76px] z-30 hidden items-center gap-2 rounded-full border-2 border-ink bg-butter px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] shadow-[2px_2px_0_#17151C] xl:flex">
          <Loader2 size={12} className="animate-spin" />
          {compileStatus}
        </div>
      )}

      {!hydrated && (
        <div className="pointer-events-none fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]">
          <Sparkles size={11} /> Warming the press…
        </div>
      )}
    </>
  );
}

export default StudioClient;
