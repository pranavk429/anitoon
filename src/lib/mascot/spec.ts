import {
  converter,
  formatHex,
  parse,
  wcagContrast,
  wcagLuminance,
} from "culori";
import { hashString, mulberry32, pick, clamp } from "./geometry";

export const SPECIES_IDS = [
  "cat",
  "dog",
  "fox",
  "bear",
  "bunny",
  "frog",
  "robot",
  "blob",
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export const VIBE_IDS = [
  "sunny",
  "chaotic",
  "calm",
  "heroic",
  "sleepy",
  "mischievous",
] as const;
export type Vibe = (typeof VIBE_IDS)[number];

export const EYE_IDS = ["sparkle", "dot", "sleepy", "happy", "visor"] as const;
export type EyeStyle = (typeof EYE_IDS)[number];

export const MOUTH_IDS = ["smile", "grin", "smirk", "o", "flat"] as const;
export type MouthStyle = (typeof MOUTH_IDS)[number];

export const PATTERN_IDS = [
  "none",
  "spots",
  "stripes",
  "patch",
  "freckles",
] as const;
export type Pattern = (typeof PATTERN_IDS)[number];

export const EXPRESSION_IDS = [
  "happy",
  "excited",
  "shy",
  "sleepy",
  "determined",
  "mischievous",
  "surprised",
] as const;
export type ExpressionId = (typeof EXPRESSION_IDS)[number];

export const ACCESSORY_IDS = [
  "glasses",
  "cap",
  "scarf",
  "headphones",
  "bowtie",
  "cape",
  "crown",
  "flower",
] as const;
export type Accessory = (typeof ACCESSORY_IDS)[number];

export type MascotSpec = {
  v: 1;
  name: string;
  species: SpeciesId;
  primary: string;
  accent: string;
  ink: string;
  vibe: Vibe;
  expression: ExpressionId;
  eyes: EyeStyle;
  mouth: MouthStyle;
  pattern: Pattern;
  accessories: Accessory[];
  tagline: string;
  seed: number;
};

export const SPECIES_META: Record<
  SpeciesId,
  {
    label: string;
    short: string;
    blurb: string;
    defaultPrimary: string;
    defaultAccent: string;
  }
> = {
  cat: {
    label: "Cat",
    short: "Cool, curious, quietly in charge.",
    blurb: "Pointy ears, whiskers, and a tail with opinions.",
    defaultPrimary: "#F59E56",
    defaultAccent: "#2B4BF2",
  },
  dog: {
    label: "Dog",
    short: "Loyal, loud, thrilled to be here.",
    blurb: "Floppy ears, a big snoot, and zero chill.",
    defaultPrimary: "#C98A5C",
    defaultAccent: "#FFC53D",
  },
  fox: {
    label: "Fox",
    short: "Clever, quick, a little smug.",
    blurb: "Big ears and a tail that could sell anything.",
    defaultPrimary: "#F26B4E",
    defaultAccent: "#2B4BF2",
  },
  bear: {
    label: "Bear",
    short: "Soft outside, steady inside.",
    blurb: "Round ears, a warm muzzle, built for hugs.",
    defaultPrimary: "#A9714B",
    defaultAccent: "#FFC53D",
  },
  bunny: {
    label: "Bunny",
    short: "Sweet, springy, secretly chaotic.",
    blurb: "Tall ears, buck teeth, and a cotton tail.",
    defaultPrimary: "#F2A2BC",
    defaultAccent: "#8B5CF6",
  },
  frog: {
    label: "Frog",
    short: "Weird little guy. Beloved by all.",
    blurb: "Eye bumps, a wide grin, maximum meme potential.",
    defaultPrimary: "#6FBF73",
    defaultAccent: "#FF7A59",
  },
  robot: {
    label: "Robot",
    short: "Precise, helpful, slightly unhinged.",
    blurb: "A glossy chassis, antenna, and LED feelings.",
    defaultPrimary: "#5478FF",
    defaultAccent: "#FFC53D",
  },
  blob: {
    label: "Blob",
    short: "No bones. All personality.",
    blurb: "A squishy little friend with big feelings.",
    defaultPrimary: "#6FD6A8",
    defaultAccent: "#FF5A45",
  },
};

export const VIBE_META: Record<
  Vibe,
  { label: string; emoji: string; blurb: string }
> = {
  sunny: { label: "Sunny", emoji: "☀", blurb: "Warm, upbeat, always glad to see you." },
  chaotic: { label: "Chaotic", emoji: "⚡", blurb: "Fast, loud, one idea away from a montage." },
  calm: { label: "Calm", emoji: "◌", blurb: "Slow blinks. Steady energy. No notes." },
  heroic: { label: "Heroic", emoji: "★", blurb: "Chin up. Cape optional. Always ready." },
  sleepy: { label: "Sleepy", emoji: "☾", blurb: "Lowercase energy. Runs on naps." },
  mischievous: { label: "Mischievous", emoji: "◆", blurb: "Knows exactly what it's doing." },
};

export const EXPRESSION_META: Record<
  ExpressionId,
  { label: string; emoji: string; blurb: string }
> = {
  happy: { label: "Happy", emoji: "✿", blurb: "Warm open smile & gentle eye sparkle." },
  excited: { label: "Excited", emoji: "★", blurb: "Starry eyes & joyful wide grin!" },
  shy: { label: "Shy", emoji: "♡", blurb: "Rosy cheek blush & sweet delicate smile." },
  sleepy: { label: "Sleepy", emoji: "☾", blurb: "Cozy half-lids and peaceful rest." },
  determined: { label: "Determined", emoji: "◆", blurb: "Focused perked brows and confident smirk." },
  mischievous: { label: "Mischievous", emoji: "⚡", blurb: "Cheeky wink & sly anime grin." },
  surprised: { label: "Surprised", emoji: "○", blurb: "Wide glossy eyes & cute open mouth." },
};

/** The face defaults an expression should snap to when chosen. */
export const EXPRESSION_FACE: Record<
  ExpressionId,
  { eyes: EyeStyle; mouth: MouthStyle }
> = {
  happy: { eyes: "sparkle", mouth: "smile" },
  excited: { eyes: "sparkle", mouth: "grin" },
  shy: { eyes: "dot", mouth: "smile" },
  sleepy: { eyes: "sleepy", mouth: "o" },
  determined: { eyes: "dot", mouth: "flat" },
  mischievous: { eyes: "sparkle", mouth: "smirk" },
  surprised: { eyes: "sparkle", mouth: "o" },
};

export const ACCESSORY_META: Record<Accessory, { label: string }> = {
  glasses: { label: "Glasses" },
  cap: { label: "Cap" },
  scarf: { label: "Scarf" },
  headphones: { label: "Headphones" },
  bowtie: { label: "Bow tie" },
  cape: { label: "Cape" },
  crown: { label: "Crown" },
  flower: { label: "Flower" },
};

export const EYE_META: Record<EyeStyle, { label: string }> = {
  sparkle: { label: "Sparkle" },
  dot: { label: "Dot" },
  sleepy: { label: "Sleepy" },
  happy: { label: "Happy" },
  visor: { label: "Visor" },
};

export const MOUTH_META: Record<MouthStyle, { label: string }> = {
  smile: { label: "Smile" },
  grin: { label: "Grin" },
  smirk: { label: "Smirk" },
  o: { label: "Surprised" },
  flat: { label: "Chill" },
};

export const PATTERN_META: Record<Pattern, { label: string }> = {
  none: { label: "Plain" },
  spots: { label: "Spots" },
  stripes: { label: "Stripes" },
  patch: { label: "Eye patch" },
  freckles: { label: "Freckles" },
};

export const PALETTE_PRESETS: Array<{
  id: string;
  name: string;
  primary: string;
  accent: string;
}> = [
  { id: "tangerine", name: "Tangerine", primary: "#F59E56", accent: "#2B4BF2" },
  { id: "blueprint", name: "Blueprint", primary: "#5478FF", accent: "#FFC53D" },
  { id: "matcha", name: "Matcha", primary: "#6FBF73", accent: "#FF5A45" },
  { id: "bubblegum", name: "Bubblegum", primary: "#F2A2BC", accent: "#8B5CF6" },
  { id: "cocoa", name: "Cocoa", primary: "#A9714B", accent: "#FFC53D" },
  { id: "ink", name: "Ink", primary: "#3A3547", accent: "#FF5A45" },
];

export type Palette = {
  ink: string;
  inkSoft: string;
  primary: string;
  primaryDeep: string;
  secondary: string;
  accent: string;
  paper: string;
  blush: string;
};

const toHex = (value: string, fallback: string): string => {
  try {
    const parsed = parse(value);
    return parsed ? formatHex(parsed) : fallback;
  } catch {
    return fallback;
  }
};

/* ------------------------------------------------------------------ */
/* Palette derivation                                                  */
/* ------------------------------------------------------------------ */

const oklchColor = converter("oklch");

function mixHex(a: string, b: string, t: number): string {
  const ca = oklchColor(toHex(a, "#000000"));
  const cb = oklchColor(toHex(b, "#ffffff"));
  if (!ca || !cb) return a;
  const hueA = ca.h ?? cb.h ?? 0;
  const hueB = cb.h ?? ca.h ?? 0;
  let dh = hueB - hueA;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const c = {
    mode: "oklch" as const,
    l: ca.l + (cb.l - ca.l) * t,
    c: ca.c + (cb.c - ca.c) * t,
    h: hueA + dh * t,
  };
  return formatHex(c);
}

function rotateHue(hex: string, deg: number, chromaBoost = 1, lightness?: number) {
  const c = oklchColor(toHex(hex, "#888888"));
  if (!c) return hex;
  return formatHex({
    mode: "oklch",
    l: clamp(lightness ?? c.l, 0.18, 0.94),
    c: clamp(c.c * chromaBoost, 0, 0.32),
    h: (c.h ?? 0) + deg,
  });
}

/**
 * Turn 3 user-facing colors into a full print palette. Dark bodies get lifted
 * so the ink outline always reads; pale bodies get a slightly deeper secondary.
 */
export function derivePalette(
  primaryRaw: string,
  accentRaw: string,
  inkRaw = "#17141F",
): Palette {
  let primary = toHex(primaryRaw, "#F59E56");
  const accent = toHex(accentRaw, "#2B4BF2");
  const ink = toHex(inkRaw, "#17141F");

  const lum = wcagLuminance(primary);
  if (lum < 0.09) {
    primary = rotateHue(primary, 0, 0.9, 0.55);
  }
  if (wcagContrast(primary, ink) < 1.35) {
    primary = mixHex(primary, "#FFFFFF", 0.28);
  }

  const secondary =
    wcagLuminance(primary) < 0.42
      ? mixHex(primary, "#FFF6E8", 0.46)
      : mixHex(primary, "#FFF6E8", 0.58);
  const primaryDeep = rotateHue(primary, -8, 1, Math.max(0.22, wcagLuminance(primary) * 0.55));
  const blush = mixHex(rotateHue(primary, 26, 1.15, 0.72), "#FF6B8A", 0.42);
  const inkSoft = mixHex(ink, "#FFF9EF", 0.32);

  return {
    ink,
    inkSoft,
    primary,
    primaryDeep,
    secondary,
    accent,
    paper: "#FFF9EF",
    blush,
  };
}

/* ------------------------------------------------------------------ */
/* Named colors                                                        */
/* ------------------------------------------------------------------ */

const COLOR_WORDS: Array<[string, string]> = [
  ["tangerine", "#F59E56"],
  ["coral", "#FF6B57"],
  ["orange", "#F59E56"],
  ["peach", "#FFB48A"],
  ["mustard", "#E5A93D"],
  ["butter", "#FFC53D"],
  ["lemon", "#FFD84D"],
  ["gold", "#E7B23B"],
  ["yellow", "#FFC53D"],
  ["lime", "#A8D64F"],
  ["matcha", "#8DBE6A"],
  ["mint", "#6FD6A8"],
  ["teal", "#2FB3A8"],
  ["cyan", "#4BC9E8"],
  ["sky", "#62B6FF"],
  ["cobalt", "#2B4BF2"],
  ["blue", "#4F7CFF"],
  ["navy", "#27346B"],
  ["indigo", "#4B3FBF"],
  ["violet", "#8B5CF6"],
  ["purple", "#8B5CF6"],
  ["lavender", "#C9B6FF"],
  ["lilac", "#C9B6FF"],
  ["magenta", "#E750B8"],
  ["pink", "#F2A2BC"],
  ["rose", "#F27C9B"],
  ["red", "#EF4B3F"],
  ["crimson", "#D93A4A"],
  ["brown", "#A9714B"],
  ["cocoa", "#8B5A3C"],
  ["tan", "#D2A679"],
  ["beige", "#E8D5B5"],
  ["cream", "#F6E7C8"],
  ["white", "#FFF9EF"],
  ["silver", "#C9CDD6"],
  ["grey", "#9CA3AF"],
  ["gray", "#9CA3AF"],
  ["charcoal", "#3A3547"],
  ["black", "#2A2633"],
];

const OCCUPATIONS: Array<[RegExp, string, Partial<MascotSpec>]> = [
  [/coffee|cafe|barista|espresso/, "coffee", { mouth: "grin" }],
  [/bakery|baker|bread|pastry/, "bakery", { accessories: ["cap"], pattern: "freckles" }],
  [/developer|devtool|code|coding|software|engineer/, "dev tools", { accessories: ["glasses"] }],
  [/gaming|game|esports|arcade|streamer/, "gaming", { accessories: ["headphones"], eyes: "sparkle" }],
  [/music|band|label|podcast|audio/, "music", { accessories: ["headphones"] }],
  [/fitness|gym|run|sport|yoga/, "fitness", { accessories: ["cap"], mouth: "grin" }],
  [/finance|bank|money|fintech|crypto/, "finance", { accessories: ["glasses"], mouth: "smirk" }],
  [/weather|climate|forecast/, "weather", { accessories: ["scarf"] }],
  [/ai|robot|assistant|automation/, "AI", { accessories: ["headphones"] }],
  [/plant|garden|floral|flower/, "plants", { accessories: ["flower"] }],
  [/space|cosmic|galaxy|rocket|astronaut/, "space", { pattern: "freckles", eyes: "sparkle" }],
  [/pet|animal|vet|shelter/, "pets", { accessories: ["scarf"] }],
  [/book|library|read|publish/, "books", { accessories: ["glasses"] }],
  [/fashion|style|beauty|skincare/, "fashion", { accessories: ["bowtie"], eyes: "sparkle" }],
  [/travel|airline|hotel|trip/, "travel", { accessories: ["cap"] }],
  [/food|delivery|restaurant|snack/, "food", { mouth: "grin" }],
  [/eco|green|sustainab|climate/, "the planet", { pattern: "spots" }],
];

/* ------------------------------------------------------------------ */
/* Prompt parsing                                                      */
/* ------------------------------------------------------------------ */

const NAMES = [
  "Mochi", "Biscuit", "Juno", "Pixel", "Nova", "Bean", "Pepper", "Miso",
  "Clover", "Ziggy", "Tofu", "Rocket", "Maple", "Echo", "Poppy", "Cosmo",
  "Nori", "Bubbles", "Waffles", "Sesame", "Pip", "Mango", "Clementine",
  "Olive", "Peanut", "Sprocket", "Marmalade", "Fig", "Taro", "Domino",
] as const;

const TAGLINES: Record<Vibe, string[]> = {
  sunny: [
    "Chief good-vibes officer",
    "Director of first impressions",
    "Head of saying hello",
    "Professional mood-lifter",
  ],
  chaotic: [
    "Chief chaos officer",
    "VP of unhinged ideas",
    "Senior snack officer",
    "Head of the group chat",
  ],
  calm: [
    "Chief calm officer",
    "Head of taking it easy",
    "Wellness department, solo",
    "Director of deep breaths",
  ],
  heroic: [
    "Official brand guardian",
    "Captain of the comeback",
    "Chief courage officer",
    "Head of saving the day",
  ],
  sleepy: [
    "Professional nap enthusiast",
    "Head of horizontal operations",
    "Chief slow-morning officer",
    "Director of cozy",
  ],
  mischievous: [
    "Director of harmless trouble",
    "Chief mischief officer",
    "Head of suspicious ideas",
    "VP of plausible deniability",
  ],
};

export type ParsedPrompt = {
  spec: MascotSpec;
  signals: {
    species: boolean;
    colors: number;
    vibe: boolean;
    accessories: number;
    occupation?: string;
  };
};

const speciesPatterns: Array<[SpeciesId, RegExp]> = [
  ["cat", /\b(cat|kitty|kitten|feline|meow)\b/],
  ["dog", /\b(dog|puppy|pup|pooch|woof|retriever|corgi)\b/],
  ["fox", /\b(fox|vixen|fennec)\b/],
  ["bear", /\b(bear|teddy|panda|grizzly)\b/],
  ["bunny", /\b(bunny|rabbit|hare|lop)\b/],
  ["frog", /\b(frog|toad|ribbit|amphibian)\b/],
  ["robot", /\b(robot|bot|android|droid|machine|cyborg)\b/],
  ["blob", /\b(blob|bean|squish|slime|goo|jelly)\b/],
];

const vibePatterns: Array<[Vibe, RegExp]> = [
  ["chaotic", /\b(chaotic|chaos|hyper|feral|unhinged|wild|energetic|manic)\b/],
  ["sleepy", /\b(sleepy|tired|lazy|cozy|cosy|nap|drowsy|chill|lowkey)\b/],
  ["heroic", /\b(hero|heroic|brave|super|mighty|champion|guardian|bold)\b/],
  ["mischievous", /\b(mischievous|sly|cheeky|smug|trouble|sneaky|rascal)\b/],
  ["calm", /\b(calm|zen|serene|gentle|soft|quiet|peaceful|mindful)\b/],
  ["sunny", /\b(happy|sunny|cheerful|friendly|warm|bright|joyful|optimistic)\b/],
];

const eyePatterns: Array<[EyeStyle, RegExp]> = [
  ["visor", /\b(visor|laser|cyber|led|scan)\b/],
  ["happy", /\b(happy eyes|smiling eyes|squint)\b/],
  ["sleepy", /\b(sleepy|half.?closed|sleepy eyes)\b/],
  ["sparkle", /\b(sparkle|sparkly|star.?eyed|big eyes|anime eyes|glossy)\b/],
  ["dot", /\b(dot eyes|beady|simple eyes)\b/],
];

const mouthPatterns: Array<[MouthStyle, RegExp]> = [
  ["grin", /\b(grin|big smile|toothy|smiling|cheese|beam)\b/],
  ["smirk", /\b(smirk|smug|cheeky|side smile)\b/],
  ["o", /\b(surprised|shocked|o mouth|gasp)\b/],
  ["flat", /\b(flat mouth|unbothered|deadpan|no mouth|neutral)\b/],
];

const patternPatterns: Array<[Pattern, RegExp]> = [
  ["spots", /\b(spotted|spots|polka|dotted)\b/],
  ["stripes", /\b(striped|stripes|tiger|zebra)\b/],
  ["patch", /\b(eye patch|patch|pirate)\b/],
  ["freckles", /\b(freckles|speckled|starry|stars)\b/],
];

const accessoryPatterns: Array<[Accessory, RegExp]> = [
  ["glasses", /\b(glasses|spectacles|shades|nerdy|eyewear)\b/],
  ["cap", /\b(cap|hat|beanie|snapback|baseball cap|chef hat)\b/],
  ["scarf", /\b(scarf|bandana|neckerchief|cozy)\b/],
  ["headphones", /\b(headphones|headset|cans|gamer)\b/],
  ["bowtie", /\b(bow ?tie|formal|dapper)\b/],
  ["cape", /\b(cape|superhero|hero suit)\b/],
  ["crown", /\b(crown|king|queen|royal|tiara)\b/],
  ["flower", /\b(flower|floral|daisy|bloom)\b/],
];

function findSpecies(text: string): SpeciesId | null {
  for (const [id, re] of speciesPatterns) if (re.test(text)) return id;
  return null;
}

function findColors(text: string): string[] {
  const found: Array<{ idx: number; hex: string }> = [];
  for (const [word, hex] of COLOR_WORDS) {
    const idx = text.indexOf(word);
    if (idx >= 0) found.push({ idx, hex });
  }
  // keep earliest mention of each hue family, in prompt order
  found.sort((a, b) => a.idx - b.idx);
  const unique: string[] = [];
  for (const f of found) {
    if (!unique.includes(f.hex)) unique.push(f.hex);
  }
  return unique.slice(0, 2);
}

function findSpecialColors(text: string) {
  const lower = text.toLowerCase();
  return {
    pastel: /\bpastel\b/.test(lower),
    neon: /\bneon\b/.test(lower),
    dark: /\bdark\b|\bmidnight\b/.test(lower),
  };
}

function findName(raw: string): string | null {
  const named = raw.match(
    /(?:named|called|name(?:d)?\s+it|call\s+it)\s+["“']?([A-Za-z][A-Za-z0-9'-]{1,17})/i,
  );
  if (named) {
    const n = named[1];
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  return null;
}

const expressionPatterns: Array<[ExpressionId, RegExp]> = [
  ["excited", /\b(excited|hyped|pumped|thrilled|sparkly|hyper|ecstatic)\b/],
  ["sleepy", /\b(sleepy|tired|drowsy|napping|cozy|exhausted|lazy)\b/],
  ["shy", /\b(shy|bashful|timid|blushing|sweet|gentle|cute|modest)\b/],
  ["determined", /\b(determined|heroic|brave|confident|focused|fierce|resolute|bold)\b/],
  ["mischievous", /\b(mischievous|sneaky|sly|smug|cheeky|cunning|trouble|rascal)\b/],
  ["surprised", /\b(surprised|shocked|amazed|astonished|gasp|in shock|wow)\b/],
  ["happy", /\b(happy|cheerful|joyful|sunny|smiling|glad|delighted|pleased)\b/],
];

export function defaultExpression(vibe: Vibe, species?: SpeciesId): ExpressionId {
  if (species === "robot") return "determined";
  if (vibe === "sunny") return "happy";
  if (vibe === "chaotic") return "excited";
  if (vibe === "calm") return "shy";
  if (vibe === "heroic") return "determined";
  if (vibe === "sleepy") return "sleepy";
  if (vibe === "mischievous") return "mischievous";
  return "happy";
}

export function createSpec(partial: Partial<MascotSpec> = {}): MascotSpec {
  const seed = partial.seed ?? 1;
  const rand = mulberry32(seed);
  const species = partial.species ?? pick(rand, SPECIES_IDS);
  const meta = SPECIES_META[species];
  const vibe = partial.vibe ?? pick(rand, VIBE_IDS);
  const expression = partial.expression ?? defaultExpression(vibe, species);
  const face = EXPRESSION_FACE[expression];
  return {
    v: 1,
    name: partial.name ?? pick(rand, NAMES),
    species,
    primary: partial.primary ?? meta.defaultPrimary,
    accent: partial.accent ?? meta.defaultAccent,
    ink: partial.ink ?? "#17141F",
    vibe,
    expression,
    eyes: partial.eyes ?? (species === "robot" ? "visor" : face.eyes),
    mouth: partial.mouth ?? face.mouth,
    pattern: partial.pattern ?? "none",
    accessories: partial.accessories ?? [],
    tagline: partial.tagline ?? pick(rand, TAGLINES[vibe]),
    seed,
  };
}

export function randomSpec(seed = Math.floor(Math.random() * 2 ** 31)): MascotSpec {
  const rand = mulberry32(seed);
  const species = pick(rand, SPECIES_IDS);
  const meta = SPECIES_META[species];
  const palette = pick(rand, PALETTE_PRESETS);
  const vibe = pick(rand, VIBE_IDS);
  const expression = pick(rand, EXPRESSION_IDS);
  const usePreset = rand() > 0.5;
  const accessories: Accessory[] = [];
  const accessoryPool = ACCESSORY_IDS.filter(
    (a) => !(species === "robot" && a === "headphones"),
  );
  const accessoryCount = rand() > 0.58 ? (rand() > 0.82 ? 2 : 1) : 0;
  while (accessories.length < accessoryCount) {
    const a = pick(rand, accessoryPool);
    if (!accessories.includes(a)) accessories.push(a);
  }
  const patterns: Pattern[] = ["none", "none", "spots", "stripes", "patch", "freckles"];
  return createSpec({
    name: pick(rand, NAMES),
    species,
    primary: usePreset ? palette.primary : meta.defaultPrimary,
    accent: usePreset ? palette.accent : meta.defaultAccent,
    vibe,
    expression,
    pattern: pick(rand, patterns),
    accessories,
    tagline: pick(rand, TAGLINES[vibe]),
    seed,
  });
}

export function parsePrompt(promptRaw: string, seedOverride?: number): ParsedPrompt {
  const prompt = promptRaw.trim();
  const seed = seedOverride ?? hashString(prompt.toLowerCase() || "anitoon");
  const rand = mulberry32(seed);
  const lower = prompt.toLowerCase();

  const matchedSpecies = findSpecies(lower);
  const species = matchedSpecies ?? pick(rand, SPECIES_IDS);
  const meta = SPECIES_META[species];

  const colors = findColors(lower);
  const special = findSpecialColors(lower);
  let primary = colors[0] ?? meta.defaultPrimary;

  if (special.pastel) primary = rotateHue(primary, 0, 0.8, 0.78);
  if (special.neon) primary = rotateHue(primary, 0, 1.35, 0.66);
  if (special.dark) primary = rotateHue(primary, 0, 0.9, 0.34);

  let accent = colors[1] ?? meta.defaultAccent;
  if (colors.length === 1) {
    accent = rotateHue(colors[0], 150, 1.05, undefined);
  }

  let vibe: Vibe | null = null;
  for (const [id, re] of vibePatterns) if (re.test(lower)) { vibe = id; break; }
  if (!vibe) {
    if (species === "robot") vibe = "calm";
    else if (species === "blob") vibe = "sunny";
    else vibe = pick(rand, ["sunny", "chaotic", "calm", "mischievous"] as Vibe[]);
  }

  let expression: ExpressionId | null = null;
  for (const [id, re] of expressionPatterns) if (re.test(lower)) { expression = id; break; }

  let eyes: EyeStyle | null = null;
  for (const [id, re] of eyePatterns) if (re.test(lower)) { eyes = id; break; }
  let mouth: MouthStyle | null = null;
  for (const [id, re] of mouthPatterns) if (re.test(lower)) { mouth = id; break; }
  let pattern: Pattern = "none";
  for (const [id, re] of patternPatterns) if (re.test(lower)) { pattern = id; break; }

  const accessories: Accessory[] = [];
  for (const [id, re] of accessoryPatterns) {
    if (re.test(lower) && !accessories.includes(id)) accessories.push(id);
  }

  let occupation: string | undefined;
  for (const [re, label, extras] of OCCUPATIONS) {
    if (re.test(lower)) {
      occupation = label;
      if (extras.mouth && !mouth) mouth = extras.mouth;
      if (extras.eyes && !eyes) eyes = extras.eyes;
      if (extras.pattern && pattern === "none") pattern = extras.pattern;
      if (extras.accessories) {
        for (const a of extras.accessories as string[]) {
          if (ACCESSORY_IDS.includes(a as Accessory) && !accessories.includes(a as Accessory)) {
            accessories.push(a as Accessory);
          }
        }
      }
      break;
    }
  }

  const name = findName(prompt) ?? pick(rand, NAMES);
  const tagline = pick(rand, TAGLINES[vibe]);
  const finalExpression = expression ?? defaultExpression(vibe, species);
  const face = EXPRESSION_FACE[finalExpression];
  const finalEyes = eyes ?? (species === "robot" ? "visor" : face.eyes);
  const finalMouth = mouth ?? face.mouth;

  const spec = createSpec({
    name,
    species,
    primary,
    accent,
    ink: "#17141F",
    vibe,
    expression: finalExpression,
    eyes: finalEyes,
    mouth: finalMouth,
    pattern,
    accessories: accessories.slice(0, 3),
    tagline,
    seed,
  });

  return {
    spec,
    signals: {
      species: Boolean(matchedSpecies),
      colors: colors.length,
      vibe: Boolean(vibePatterns.find(([, re]) => re.test(lower))),
      accessories: accessories.length,
      occupation,
    },
  };
}

/* ------------------------------------------------------------------ */
/* URL-safe sharing                                                    */
/* ------------------------------------------------------------------ */

type Pack = {
  n: string;
  s: SpeciesId;
  p: string;
  a: string;
  i: string;
  v: Vibe;
  e: EyeStyle;
  m: MouthStyle;
  t: Pattern;
  x: Accessory[];
  g: string;
  d: number;
  ex?: ExpressionId;
};

export function encodeSpec(spec: MascotSpec): string {
  const pack: Pack = {
    n: spec.name,
    s: spec.species,
    p: spec.primary,
    a: spec.accent,
    i: spec.ink,
    v: spec.vibe,
    e: spec.eyes,
    m: spec.mouth,
    t: spec.pattern,
    x: spec.accessories,
    g: spec.tagline,
    d: spec.seed,
    ex: spec.expression,
  };
  const json = JSON.stringify(pack);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSpec(param: string): MascotSpec | null {
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const p = JSON.parse(json) as Partial<Pack>;
    if (!p || !p.s || !SPECIES_IDS.includes(p.s)) return null;
    return createSpec({
      name: typeof p.n === "string" ? p.n.slice(0, 24) : undefined,
      species: p.s,
      primary: typeof p.p === "string" ? p.p : undefined,
      accent: typeof p.a === "string" ? p.a : undefined,
      ink: typeof p.i === "string" ? p.i : undefined,
      vibe: VIBE_IDS.includes(p.v as Vibe) ? (p.v as Vibe) : undefined,
      expression: (p.ex && EXPRESSION_IDS.includes(p.ex as ExpressionId)) ? (p.ex as ExpressionId) : undefined,
      eyes: EYE_IDS.includes(p.e as EyeStyle) ? (p.e as EyeStyle) : undefined,
      mouth: MOUTH_IDS.includes(p.m as MouthStyle) ? (p.m as MouthStyle) : undefined,
      pattern: PATTERN_IDS.includes(p.t as Pattern) ? (p.t as Pattern) : undefined,
      accessories: Array.isArray(p.x)
        ? p.x.filter((a): a is Accessory => ACCESSORY_IDS.includes(a as Accessory)).slice(0, 4)
        : [],
      tagline: typeof p.g === "string" ? p.g.slice(0, 60) : undefined,
      seed: typeof p.d === "number" ? p.d : 1,
    });
  } catch {
    return null;
  }
}
