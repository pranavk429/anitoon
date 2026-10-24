import { createSpec, type MascotSpec } from "./spec";

export type GalleryItem = {
  spec: MascotSpec;
  blurb: string;
  color: string;
};

const base = {
  ink: "#17151F",
  pattern: "none" as const,
  accessories: [] as MascotSpec["accessories"],
};

export const DEMO_SPEC: MascotSpec = createSpec({
  ...base,
  name: "Mochi",
  species: "cat",
  primary: "#F59E56",
  accent: "#2B4BF2",
  vibe: "sunny",
  expression: "happy",
  eyes: "sparkle",
  mouth: "grin",
  accessories: ["scarf"],
  tagline: "Chief good-vibes officer",
  seed: 26,
});

export const GALLERY: GalleryItem[] = [
  {
    spec: DEMO_SPEC,
    blurb: "Warm, upbeat, always glad to see you.",
    color: "#FFC53D",
  },
  {
    spec: createSpec({
      ...base,
      name: "Juno",
      species: "fox",
      primary: "#F26B4E",
      accent: "#2B4BF2",
      vibe: "mischievous",
      expression: "mischievous",
      eyes: "sparkle",
      mouth: "smirk",
      tagline: "Director of harmless trouble",
      seed: 41,
    }),
    blurb: "Clever, quick, a little smug.",
    color: "#2B4BF2",
  },
  {
    spec: createSpec({
      ...base,
      name: "Pixel",
      species: "robot",
      primary: "#5478FF",
      accent: "#FFC53D",
      vibe: "calm",
      expression: "determined",
      eyes: "visor",
      mouth: "flat",
      accessories: ["headphones"],
      tagline: "Head of shipping on Fridays",
      seed: 8,
    }),
    blurb: "Precise, helpful, slightly unhinged.",
    color: "#6FD6A8",
  },
  {
    spec: createSpec({
      ...base,
      name: "Clover",
      species: "frog",
      primary: "#6FBF73",
      accent: "#FF5A45",
      vibe: "sunny",
      expression: "excited",
      eyes: "sparkle",
      mouth: "grin",
      accessories: ["crown"],
      tagline: "Professional mood-lifter",
      seed: 17,
    }),
    blurb: "Weird little guy. Beloved by all.",
    color: "#C9B6FF",
  },
  {
    spec: createSpec({
      ...base,
      name: "Biscuit",
      species: "dog",
      primary: "#C98A5C",
      accent: "#FFC53D",
      vibe: "sunny",
      expression: "happy",
      eyes: "sparkle",
      mouth: "smile",
      accessories: ["scarf"],
      tagline: "Head of saying hello",
      seed: 5,
    }),
    blurb: "Loyal, loud, thrilled to be here.",
    color: "#FF5A45",
  },
  {
    spec: createSpec({
      ...base,
      name: "Nori",
      species: "bunny",
      primary: "#F2A2BC",
      accent: "#8B5CF6",
      vibe: "sleepy",
      expression: "shy",
      eyes: "happy",
      mouth: "smirk",
      accessories: ["flower"],
      tagline: "Director of cozy",
      seed: 33,
    }),
    blurb: "Sweet, springy, secretly chaotic.",
    color: "#FFC53D",
  },
  {
    spec: createSpec({
      ...base,
      name: "Cosmo",
      species: "bear",
      primary: "#A9714B",
      accent: "#FFC53D",
      vibe: "calm",
      expression: "sleepy",
      eyes: "sparkle",
      mouth: "smile",
      accessories: ["glasses"],
      tagline: "Chief calm officer",
      seed: 12,
    }),
    blurb: "Soft outside, steady inside.",
    color: "#6FD6A8",
  },
  {
    spec: createSpec({
      ...base,
      name: "Bubbles",
      species: "blob",
      primary: "#6FD6A8",
      accent: "#FF5A45",
      vibe: "chaotic",
      expression: "surprised",
      eyes: "sparkle",
      mouth: "grin",
      accessories: ["bowtie"],
      tagline: "VP of unhinged ideas",
      seed: 58,
    }),
    blurb: "No bones. All personality.",
    color: "#2B4BF2",
  },
];

export const SAMPLE_PROMPTS = [
  "A sunny orange cat named Mochi with a blue scarf",
  "A mischievous fox for a developer tool, sparkly eyes, cobalt accents",
  "A sleepy mint blob with a bow tie and freckles",
  "A brave robot mascot with a crown, yellow trim, visor eyes",
];

export const MOVE_PROMPTS: Record<string, string> = {
  idle: "A sunny orange cat named Mochi with a blue scarf",
  wave: "A friendly dog mascot for a coffee brand, butter yellow accents",
  jump: "A chaotic frog mascot for a gaming brand, sparkly eyes",
  dance: "A mischievous fox for a music app, coral and cobalt",
  nod: "A calm bear mascot for a finance product, glasses",
  walk: "A loyal dog mascot for a delivery startup, scarf",
  spin: "A heroic robot mascot for an AI tool, crown and visor",
  celebrate: "A bunny mascot for a launch, pastel pink and violet",
  think: "A clever fox mascot for a research tool, glasses",
  laugh: "A chaotic blob mascot for a meme app, mint and coral",
  bow: "A theatrical bear mascot for a theatre brand, bow tie",
};
