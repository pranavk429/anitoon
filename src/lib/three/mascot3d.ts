import type { ExpressionId } from "@/lib/mascot/spec";

export type Motion3DId =
  | "idle"
  | "wave"
  | "jump"
  | "dance"
  | "think"
  | "celebrate";

export type Move3D = {
  id: Motion3DId;
  name: string;
  blurb: string;
  duration: number;
};

export const MOVES_3D: Move3D[] = [
  {
    id: "idle",
    name: "Idle",
    blurb: "Breathing, weight shifts, ear and tail follow-through.",
    duration: 4,
  },
  {
    id: "wave",
    name: "Wave",
    blurb: "A soft hello with palm out, head tilt, and a tail reply.",
    duration: 3.6,
  },
  {
    id: "jump",
    name: "Jump",
    blurb: "Anticipation, hang time, pointed toes, landing squash.",
    duration: 3,
  },
  {
    id: "dance",
    name: "Dance",
    blurb: "Hip-led groove with alternating arms and overlap.",
    duration: 4,
  },
  {
    id: "think",
    name: "Think",
    blurb: "Paw to chin, gaze up, a held pose that keeps moving.",
    duration: 4,
  },
  {
    id: "celebrate",
    name: "Celebrate",
    blurb: "Both paws up, bounce, ears and tail cheering along.",
    duration: 3.2,
  },
];

export const MOVE_3D_BY_ID: Record<string, Move3D> = Object.fromEntries(
  MOVES_3D.map((move) => [move.id, move]),
);

export const MOTION_3D_IDS = MOVES_3D.map((move) => move.id) as Motion3DId[];

export function asMotion3D(id: string | null | undefined): Motion3DId {
  if (id && id in MOVE_3D_BY_ID) return id as Motion3DId;
  return "idle";
}

/** The 2D rail has 11 moves; 3D ships a curated six. */
export function mapMotionTo3D(id: string): Motion3DId {
  const direct = MOVE_3D_BY_ID[id];
  if (direct) return direct.id;
  switch (id) {
    case "nod":
      return "idle";
    case "walk":
      return "dance";
    case "spin":
    case "laugh":
      return "celebrate";
    case "bow":
      return "think";
    default:
      return "idle";
  }
}

export type Expression3D = {
  id: ExpressionId;
  name: string;
  emoji: string;
  eyeOpen: number;
  wink: "L" | "R" | null;
  irisScale: number;
  gaze: [number, number];
  browTilt: number;
  browRaise: number;
  browAsym: number;
  mouth: {
    smile?: number;
    grin?: number;
    o?: number;
    smirk?: number;
    flat?: number;
  };
  blush: number;
  head: { pitch: number; yaw: number; roll: number };
  ear: number;
  tail: number;
};

export const EXPRESSIONS_3D: Record<ExpressionId, Expression3D> = {
  happy: {
    id: "happy",
    name: "Happy",
    emoji: "✿",
    eyeOpen: 0.68,
    wink: null,
    irisScale: 1.01,
    gaze: [0.003, -0.001],
    browTilt: -0.04,
    browRaise: 0.008,
    browAsym: 0,
    mouth: { smile: 1 },
    blush: 0.45,
    head: { pitch: 0.01, yaw: 0, roll: 0 },
    ear: 0.02,
    tail: 0.4,
  },
  excited: {
    id: "excited",
    name: "Excited",
    emoji: "★",
    eyeOpen: 1.04,
    wink: null,
    irisScale: 1.06,
    gaze: [0.004, 0.002],
    browTilt: -0.02,
    browRaise: 0.026,
    browAsym: 0,
    mouth: { grin: 1 },
    blush: 0.55,
    head: { pitch: -0.04, yaw: 0, roll: 0.015 },
    ear: 0.08,
    tail: 1,
  },
  shy: {
    id: "shy",
    name: "Shy",
    emoji: "♡",
    eyeOpen: 0.64,
    wink: null,
    irisScale: 0.98,
    gaze: [-0.008, -0.002],
    browTilt: -0.16,
    browRaise: 0.006,
    browAsym: 0.004,
    mouth: { smile: 1 },
    blush: 0.9,
    head: { pitch: 0.055, yaw: -0.06, roll: -0.035 },
    ear: -0.06,
    tail: 0.15,
  },
  sleepy: {
    id: "sleepy",
    name: "Sleepy",
    emoji: "☾",
    eyeOpen: 0.5,
    wink: null,
    irisScale: 1.02,
    gaze: [0, 0.006],
    browTilt: -0.09,
    browRaise: -0.012,
    browAsym: 0,
    mouth: { flat: 1 },
    blush: 0.28,
    head: { pitch: 0.045, yaw: 0.01, roll: 0.03 },
    ear: -0.1,
    tail: 0.05,
  },
  determined: {
    id: "determined",
    name: "Determined",
    emoji: "◆",
    eyeOpen: 0.94,
    wink: null,
    irisScale: 1,
    gaze: [0.002, -0.002],
    browTilt: 0.22,
    browRaise: -0.006,
    browAsym: 0,
    mouth: { flat: 1 },
    blush: 0.12,
    head: { pitch: 0.02, yaw: 0, roll: 0 },
    ear: 0.04,
    tail: 0.22,
  },
  mischievous: {
    id: "mischievous",
    name: "Mischievous",
    emoji: "⚡",
    eyeOpen: 1,
    wink: "R",
    irisScale: 1,
    gaze: [0.008, 0.002],
    browTilt: -0.03,
    browRaise: 0.02,
    browAsym: 0.018,
    mouth: { smirk: 1 },
    blush: 0.35,
    head: { pitch: -0.015, yaw: 0.055, roll: 0.06 },
    ear: 0.06,
    tail: 0.8,
  },
  surprised: {
    id: "surprised",
    name: "Surprised",
    emoji: "○",
    eyeOpen: 1.12,
    wink: null,
    irisScale: 1.02,
    gaze: [0, 0.003],
    browTilt: -0.02,
    browRaise: 0.038,
    browAsym: 0,
    mouth: { o: 1 },
    blush: 0.32,
    head: { pitch: -0.07, yaw: 0, roll: 0 },
    ear: 0.12,
    tail: 0.5,
  },
};

export const EXPRESSIONS_3D_LIST = Object.values(EXPRESSIONS_3D);

export const MODEL_URL = "/three/mochi.glb";

export function formatMB(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
