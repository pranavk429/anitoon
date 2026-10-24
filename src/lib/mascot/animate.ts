import {
  compose,
  clamp,
  matRotate,
  matScale,
  matTranslate,
  multiply,
  easeInOut,
  type EaseName,
  type Mat,
} from "./geometry";
import { derivePalette, type MascotSpec, type Palette } from "./spec";
import type { Build, Bone } from "./art";

export type MotionId =
  | "idle"
  | "wave"
  | "jump"
  | "dance"
  | "nod"
  | "walk"
  | "spin"
  | "celebrate"
  | "think"
  | "laugh"
  | "bow";

type Prop = "x" | "y" | "rot" | "sx" | "sy";
type Key = { t: number } & Partial<Record<Prop, number>> & { ease?: EaseName };
type Track = { keys: Key[]; ease?: EaseName };
type GlobalTrack = Track;

export type Motion = {
  id: MotionId;
  name: string;
  label: string;
  blurb: string;
  duration: number;
  loop: boolean;
  tracks: Record<string, Track>;
  global?: GlobalTrack;
  energy?: number;
};

const K = (
  t: number,
  props: Partial<Record<Prop, number>> = {},
  ease: EaseName = "sine",
): Key => ({ t, ...props, ease });

export const MOTIONS: Motion[] = [
  {
    id: "idle",
    name: "Idle",
    label: "Just vibing",
    blurb: "Breathing, blinking, tail sway. The one that sells 'alive'.",
    duration: 3.4,
    loop: true,
    energy: 0.25,
    tracks: {
      body: {
        keys: [K(0, { x: 0, rot: 0 }), K(0.5, { x: 2, rot: 1 }), K(1, { x: 0, rot: 0 })],
      },
      head: {
        keys: [K(0, { rot: 0 }), K(0.35, { rot: -1.6, y: -1 }), K(0.7, { rot: 1.2 }), K(1, { rot: 0 })],
      },
    },
  },
  {
    id: "wave",
    name: "Wave",
    label: "The friendly hello",
    blurb: "Arm up, hand flapping, head tilted. Instant likability.",
    duration: 1.9,
    loop: true,
    energy: 0.7,
    tracks: {
      armR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: -148 }, "back"),
          K(0.3, { rot: -136 }),
          K(0.44, { rot: -152 }),
          K(0.58, { rot: -132 }),
          K(0.72, { rot: -150 }),
          K(0.86, { rot: -138 }),
          K(1, { rot: 0 }, "sine"),
        ],
      },
      foreR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -26 }),
          K(0.34, { rot: 18 }),
          K(0.48, { rot: -24 }),
          K(0.62, { rot: 16 }),
          K(0.76, { rot: -20 }),
          K(0.9, { rot: 8 }),
          K(1, { rot: 0 }),
        ],
      },
      head: {
        keys: [K(0, { rot: 0 }), K(0.25, { rot: -7, x: -4 }), K(0.7, { rot: -4, x: -2 }), K(1, { rot: 0 })],
      },
      body: {
        keys: [K(0, { rot: 0 }), K(0.3, { rot: 3 }), K(0.7, { rot: -2 }), K(1, { rot: 0 })],
      },
      earR: { keys: [K(0, { rot: 0 }), K(0.24, { rot: 8 }), K(0.5, { rot: -4 }), K(0.8, { rot: 5 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.3, { rot: 8 }), K(0.6, { rot: -6 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "jump",
    name: "Jump",
    label: "The crowd-pleaser",
    blurb: "Anticipation, squash, stretch, airtime, landing. Real physics.",
    duration: 1.55,
    loop: true,
    energy: 1,
    tracks: {
      root: {
        keys: [
          K(0, { y: 0 }),
          K(0.16, { y: 6 }),
          K(0.28, { y: 8 }),
          K(0.42, { y: -66 }, "sine"),
          K(0.56, { y: -70 }),
          K(0.74, { y: 0 }, "quad"),
          K(0.82, { y: 8 }, "quad"),
          K(0.92, { y: -2 }),
          K(1, { y: 0 }),
        ],
      },
      body: {
        keys: [
          K(0, { sx: 1, sy: 1, rot: 0 }),
          K(0.18, { sx: 1.12, sy: 0.86 }),
          K(0.3, { sx: 1.16, sy: 0.82 }),
          K(0.42, { sx: 0.92, sy: 1.09 }, "quad"),
          K(0.58, { sx: 1, sy: 1 }),
          K(0.78, { sx: 1.12, sy: 0.86 }, "quad"),
          K(0.9, { sx: 0.98, sy: 1.02 }),
          K(1, { sx: 1, sy: 1 }),
        ],
      },
      armL: {
        keys: [K(0, { rot: 0 }), K(0.2, { rot: -18 }), K(0.38, { rot: 142 }, "back"), K(0.62, { rot: 132 }), K(0.8, { rot: 20 }), K(1, { rot: 0 })],
      },
      armR: {
        keys: [K(0, { rot: 0 }), K(0.2, { rot: 18 }), K(0.38, { rot: -142 }, "back"), K(0.62, { rot: -132 }), K(0.8, { rot: -20 }), K(1, { rot: 0 })],
      },
      foreL: { keys: [K(0, { rot: 0 }), K(0.38, { rot: 16 }), K(0.7, { rot: 8 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.38, { rot: -16 }), K(0.7, { rot: -8 }), K(1, { rot: 0 })] },
      legL: { keys: [K(0, { rot: 0 }), K(0.28, { rot: -3 }), K(0.44, { rot: 18 }), K(0.68, { rot: 14 }), K(0.82, { rot: -2 }), K(1, { rot: 0 })] },
      legR: { keys: [K(0, { rot: 0 }), K(0.28, { rot: 3 }), K(0.44, { rot: -18 }), K(0.68, { rot: -14 }), K(0.82, { rot: 2 }), K(1, { rot: 0 })] },
      shinL: { keys: [K(0, { rot: 0 }), K(0.42, { rot: 42 }), K(0.66, { rot: 34 }), K(0.84, { rot: 2 }), K(1, { rot: 0 })] },
      shinR: { keys: [K(0, { rot: 0 }), K(0.42, { rot: 42 }), K(0.66, { rot: 34 }), K(0.84, { rot: 2 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.4, { rot: -10 }), K(0.6, { rot: -4 }), K(0.82, { rot: 8 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.4, { rot: 10 }), K(0.6, { rot: 4 }), K(0.82, { rot: -8 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.44, { rot: 14 }), K(0.7, { rot: -6 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "dance",
    name: "Dance",
    label: "The main character",
    blurb: "Hips, arms, ears, tail — the whole rig gets a turn.",
    duration: 2.6,
    loop: true,
    energy: 0.95,
    tracks: {
      body: {
        keys: [
          K(0, { x: 0, rot: 0 }),
          K(0.12, { x: -8, rot: -5 }),
          K(0.25, { x: 8, rot: 5 }),
          K(0.38, { x: -8, rot: -5 }),
          K(0.5, { x: 8, rot: 5 }),
          K(0.62, { x: -8, rot: -5 }),
          K(0.75, { x: 8, rot: 5 }),
          K(0.88, { x: -6, rot: -4 }),
          K(1, { x: 0, rot: 0 }),
        ],
      },
      head: {
        keys: [
          K(0, { rot: 0, x: 0 }),
          K(0.12, { rot: 7, x: -4 }),
          K(0.25, { rot: -7, x: 4 }),
          K(0.38, { rot: 7, x: -4 }),
          K(0.5, { rot: -7, x: 4 }),
          K(0.62, { rot: 7, x: -4 }),
          K(0.75, { rot: -7, x: 4 }),
          K(0.88, { rot: 5, x: 2 }),
          K(1, { rot: 0, x: 0 }),
        ],
      },
      armL: {
        keys: [K(0, { rot: 0 }), K(0.12, { rot: 138 }, "back"), K(0.24, { rot: 40 }), K(0.38, { rot: 150 }), K(0.5, { rot: 35 }), K(0.62, { rot: 146 }), K(0.75, { rot: 38 }), K(0.88, { rot: 120 }), K(1, { rot: 0 })],
      },
      armR: {
        keys: [K(0, { rot: 0 }), K(0.12, { rot: -40 }), K(0.24, { rot: -150 }), K(0.38, { rot: -35 }), K(0.5, { rot: -146 }), K(0.62, { rot: -38 }), K(0.75, { rot: -142 }), K(0.88, { rot: -120 }), K(1, { rot: 0 })],
      },
      foreL: {
        keys: [K(0, { rot: 0 }), K(0.12, { rot: -18 }), K(0.24, { rot: 40 }), K(0.38, { rot: -22 }), K(0.5, { rot: 36 }), K(0.62, { rot: -20 }), K(0.75, { rot: 34 }), K(0.88, { rot: -12 }), K(1, { rot: 0 })],
      },
      foreR: {
        keys: [K(0, { rot: 0 }), K(0.12, { rot: 38 }), K(0.24, { rot: -20 }), K(0.38, { rot: 40 }), K(0.5, { rot: -22 }), K(0.62, { rot: 36 }), K(0.75, { rot: -20 }), K(0.88, { rot: 12 }), K(1, { rot: 0 })],
      },
      legL: { keys: [K(0, { rot: 0 }), K(0.12, { rot: 6 }), K(0.25, { rot: -8 }), K(0.38, { rot: 6 }), K(0.5, { rot: -8 }), K(0.62, { rot: 6 }), K(0.75, { rot: -8 }), K(0.88, { rot: 3 }), K(1, { rot: 0 })] },
      legR: { keys: [K(0, { rot: 0 }), K(0.12, { rot: -8 }), K(0.25, { rot: 6 }), K(0.38, { rot: -8 }), K(0.5, { rot: 6 }), K(0.62, { rot: -8 }), K(0.75, { rot: 6 }), K(0.88, { rot: -3 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.16, { rot: -9 }), K(0.32, { rot: 5 }), K(0.48, { rot: -9 }), K(0.64, { rot: 5 }), K(0.8, { rot: -6 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.16, { rot: 5 }), K(0.32, { rot: -9 }), K(0.48, { rot: 5 }), K(0.64, { rot: -9 }), K(0.8, { rot: 6 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.15, { rot: 12 }), K(0.3, { rot: -10 }), K(0.45, { rot: 12 }), K(0.6, { rot: -10 }), K(0.75, { rot: 10 }), K(1, { rot: 0 })] },
      tail2: { keys: [K(0, { rot: 0 }), K(0.2, { rot: -14 }), K(0.4, { rot: 12 }), K(0.6, { rot: -14 }), K(0.8, { rot: 10 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "nod",
    name: "Nod",
    label: "The yes machine",
    blurb: "Two crisp nods. Perfect for approvals, CTAs, and agreement.",
    duration: 1.3,
    loop: true,
    energy: 0.4,
    tracks: {
      head: {
        keys: [
          K(0, { y: 0, rot: 0 }),
          K(0.15, { y: 2, rot: -3 }),
          K(0.28, { y: 9, rot: 8 }, "quad"),
          K(0.42, { y: 1, rot: 1 }),
          K(0.55, { y: 8, rot: 7 }, "quad"),
          K(0.7, { y: 0, rot: 0 }),
          K(1, { y: 0, rot: 0 }),
        ],
      },
      earL: { keys: [K(0, { rot: 0 }), K(0.28, { rot: -7 }), K(0.5, { rot: 4 }), K(0.7, { rot: -3 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.28, { rot: 7 }), K(0.5, { rot: -4 }), K(0.7, { rot: 3 }), K(1, { rot: 0 })] },
      body: { keys: [K(0, { y: 0 }), K(0.28, { y: 3 }), K(0.55, { y: 2 }), K(0.8, { y: 0 }), K(1, { y: 0 })] },
    },
  },
  {
    id: "walk",
    name: "Walk",
    label: "The entrance",
    blurb: "A proper stride cycle with counter-swinging arms and a bob.",
    duration: 2,
    loop: true,
    energy: 0.6,
    tracks: {
      root: {
        keys: [K(0, { y: 0 }), K(0.12, { y: -3 }), K(0.25, { y: 0 }), K(0.37, { y: -3 }), K(0.5, { y: 0 }), K(0.62, { y: -3 }), K(0.75, { y: 0 }), K(0.87, { y: -3 }), K(1, { y: 0 })],
      },
      body: { keys: [K(0, { x: 0, rot: 0 }), K(0.25, { x: 3, rot: 2 }), K(0.5, { x: 0, rot: 0 }), K(0.75, { x: -3, rot: -2 }), K(1, { x: 0, rot: 0 })] },
      head: { keys: [K(0, { y: 0 }), K(0.25, { y: -1 }), K(0.5, { y: 0 }), K(0.75, { y: -1 }), K(1, { y: 0 })] },
      legL: {
        keys: [K(0, { rot: 0 }), K(0.15, { rot: -22 }, "quad"), K(0.3, { rot: 0 }), K(0.5, { rot: 20 }, "quad"), K(0.65, { rot: 0 }), K(0.85, { rot: -14 }), K(1, { rot: 0 })],
      },
      legR: {
        keys: [K(0, { rot: 0 }), K(0.15, { rot: 20 }, "quad"), K(0.3, { rot: 0 }), K(0.5, { rot: -22 }, "quad"), K(0.65, { rot: 0 }), K(0.85, { rot: 14 }), K(1, { rot: 0 })],
      },
      shinL: {
        keys: [K(0, { rot: 0 }), K(0.15, { rot: 6 }), K(0.3, { rot: 0 }), K(0.5, { rot: 30 }), K(0.65, { rot: 4 }), K(0.85, { rot: 26 }), K(1, { rot: 0 })],
      },
      shinR: {
        keys: [K(0, { rot: 0 }), K(0.15, { rot: 30 }), K(0.3, { rot: 4 }), K(0.5, { rot: 6 }), K(0.65, { rot: 0 }), K(0.85, { rot: 0 }), K(1, { rot: 0 })],
      },
      armL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 18 }), K(0.5, { rot: 0 }), K(0.75, { rot: -16 }), K(1, { rot: 0 })] },
      armR: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -16 }), K(0.5, { rot: 0 }), K(0.75, { rot: 18 }), K(1, { rot: 0 })] },
      foreL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 10 }), K(0.5, { rot: 0 }), K(0.75, { rot: -12 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -12 }), K(0.5, { rot: 0 }), K(0.75, { rot: 10 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -4 }), K(0.5, { rot: 0 }), K(0.75, { rot: 4 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 4 }), K(0.5, { rot: 0 }), K(0.75, { rot: -4 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 8 }), K(0.5, { rot: 0 }), K(0.75, { rot: -8 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "spin",
    name: "Spin",
    label: "The mic drop",
    blurb: "A full pirouette with a hop. Use sparingly. Or don't.",
    duration: 1.8,
    loop: true,
    energy: 0.9,
    global: {
      keys: [K(0, { y: 0, rot: 0 }), K(0.2, { y: 4 }), K(0.48, { y: -52 }), K(0.72, { y: -46 }), K(0.86, { y: 0 }), K(1, { y: 0, rot: 360 })],
    },
    tracks: {
      body: { keys: [K(0, { sx: 1, sy: 1 }), K(0.25, { sx: 1.1, sy: 0.9 }), K(0.5, { sx: 0.94, sy: 1.06 }), K(0.85, { sx: 1.1, sy: 0.9 }), K(1, { sx: 1, sy: 1 })] },
      armL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 80 }), K(0.6, { rot: 72 }), K(0.85, { rot: 30 }), K(1, { rot: 0 })] },
      armR: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -80 }), K(0.6, { rot: -72 }), K(0.85, { rot: -30 }), K(1, { rot: 0 })] },
      foreL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 20 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -20 }), K(1, { rot: 0 })] },
      legL: { keys: [K(0, { rot: 0 }), K(0.35, { rot: 8 }), K(0.8, { rot: 4 }), K(1, { rot: 0 })] },
      legR: { keys: [K(0, { rot: 0 }), K(0.35, { rot: -8 }), K(0.8, { rot: -4 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.4, { rot: -14 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.4, { rot: 14 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.4, { rot: 30 }), K(0.8, { rot: 10 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "celebrate",
    name: "Celebrate",
    label: "The launch party",
    blurb: "Both arms up, double bounce, ears going feral. Ship it.",
    duration: 2.3,
    loop: true,
    energy: 1,
    tracks: {
      root: {
        keys: [K(0, { y: 0 }), K(0.12, { y: 5 }), K(0.28, { y: -38 }, "quad"), K(0.4, { y: 0 }, "quad"), K(0.52, { y: 5 }), K(0.66, { y: -26 }, "quad"), K(0.78, { y: 0 }, "quad"), K(1, { y: 0 })],
      },
      body: {
        keys: [K(0, { sx: 1, sy: 1 }), K(0.12, { sx: 1.1, sy: 0.9 }), K(0.3, { sx: 0.96, sy: 1.05 }), K(0.42, { sx: 1.08, sy: 0.93 }), K(0.55, { sx: 1.1, sy: 0.9 }), K(0.7, { sx: 0.98, sy: 1.03 }), K(0.82, { sx: 1.06, sy: 0.95 }), K(1, { sx: 1, sy: 1 })],
      },
      armL: { keys: [K(0, { rot: 0 }), K(0.16, { rot: 152 }, "back"), K(0.55, { rot: 142 }), K(0.8, { rot: 156 }), K(1, { rot: 0 })] },
      armR: { keys: [K(0, { rot: 0 }), K(0.16, { rot: -152 }, "back"), K(0.55, { rot: -142 }), K(0.8, { rot: -156 }), K(1, { rot: 0 })] },
      foreL: { keys: [K(0, { rot: 0 }), K(0.3, { rot: -12 }), K(0.6, { rot: 14 }), K(0.85, { rot: -10 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.3, { rot: 12 }), K(0.6, { rot: -14 }), K(0.85, { rot: 10 }), K(1, { rot: 0 })] },
      head: { keys: [K(0, { rot: 0, y: 0 }), K(0.28, { rot: -5, y: -3 }), K(0.5, { rot: 4 }), K(0.66, { rot: -5, y: -3 }), K(0.82, { rot: 2 }), K(1, { rot: 0, y: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.2, { rot: -16 }), K(0.4, { rot: 8 }), K(0.6, { rot: -14 }), K(0.8, { rot: 6 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.2, { rot: 16 }), K(0.4, { rot: -8 }), K(0.6, { rot: 14 }), K(0.8, { rot: -6 }), K(1, { rot: 0 })] },
      legL: { keys: [K(0, { rot: 0 }), K(0.3, { rot: 12 }), K(0.55, { rot: 0 }), K(0.7, { rot: 8 }), K(1, { rot: 0 })] },
      legR: { keys: [K(0, { rot: 0 }), K(0.3, { rot: -12 }), K(0.55, { rot: 0 }), K(0.7, { rot: -8 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 16 }), K(0.5, { rot: -12 }), K(0.75, { rot: 14 }), K(1, { rot: 0 })] },
      tail2: { keys: [K(0, { rot: 0 }), K(0.25, { rot: -18 }), K(0.5, { rot: 14 }), K(0.75, { rot: -16 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "think",
    name: "Think",
    label: "The strategy pose",
    blurb: "Hand to chin, eyes up, one thoughtful head tilt.",
    duration: 2.4,
    loop: true,
    energy: 0.3,
    tracks: {
      head: {
        keys: [K(0, { rot: 0, x: 0 }), K(0.2, { rot: 9, x: 5 }), K(0.55, { rot: 7, x: 4, y: -2 }), K(0.8, { rot: 9, x: 5 }), K(1, { rot: 0, x: 0 })],
      },
      eyeL: { keys: [K(0, { x: 0, y: 0 }), K(0.25, { x: -2, y: -3 }), K(0.65, { x: 1, y: -3 }), K(0.85, { x: -2, y: -2 }), K(1, { x: 0, y: 0 })] },
      eyeR: { keys: [K(0, { x: 0, y: 0 }), K(0.25, { x: -2, y: -3 }), K(0.65, { x: 1, y: -3 }), K(0.85, { x: -2, y: -2 }), K(1, { x: 0, y: 0 })] },
      armR: {
        keys: [K(0, { rot: 0 }), K(0.22, { rot: -118 }, "back"), K(0.55, { rot: -112 }), K(0.82, { rot: -120 }), K(1, { rot: 0 })],
      },
      foreR: {
        keys: [K(0, { rot: 0 }), K(0.24, { rot: 122 }, "back"), K(0.55, { rot: 118 }), K(0.82, { rot: 126 }), K(1, { rot: 0 })],
      },
      armL: { keys: [K(0, { rot: 0 }), K(0.25, { rot: 18 }), K(0.7, { rot: 12 }), K(1, { rot: 0 })] },
      body: { keys: [K(0, { rot: 0 }), K(0.3, { rot: -4 }), K(0.7, { rot: -3 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.3, { rot: 10 }), K(0.6, { rot: -6 }), K(0.85, { rot: 8 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.35, { rot: -5 }), K(0.8, { rot: 3 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.35, { rot: 5 }), K(0.8, { rot: -3 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "laugh",
    name: "Laugh",
    label: "The belly laugh",
    blurb: "Head back, squint, full-body shake. Chaotic good.",
    duration: 1.7,
    loop: true,
    energy: 0.9,
    tracks: {
      body: {
        keys: [K(0, { x: 0, rot: 0 }), K(0.12, { x: -4, rot: -2 }), K(0.24, { x: 4, rot: 2 }), K(0.36, { x: -4, rot: -2 }), K(0.48, { x: 4, rot: 2 }), K(0.6, { x: -3, rot: -2 }), K(0.72, { x: 3, rot: 1 }), K(0.85, { x: -2, rot: -1 }), K(1, { x: 0, rot: 0 })],
      },
      head: {
        keys: [K(0, { rot: 0, y: 0 }), K(0.14, { rot: -12, y: -3 }), K(0.3, { rot: -7, y: -1 }), K(0.48, { rot: -13, y: -4 }), K(0.66, { rot: -8, y: -2 }), K(0.85, { rot: -4 }), K(1, { rot: 0, y: 0 })],
      },
      eyeL: { keys: [K(0, { sy: 1 }), K(0.1, { sy: 0.3 }), K(0.7, { sy: 0.3 }), K(0.9, { sy: 1 }), K(1, { sy: 1 })] },
      eyeR: { keys: [K(0, { sy: 1 }), K(0.1, { sy: 0.3 }), K(0.7, { sy: 0.3 }), K(0.9, { sy: 1 }), K(1, { sy: 1 })] },
      armL: { keys: [K(0, { rot: 0 }), K(0.2, { rot: 40 }), K(0.45, { rot: 52 }), K(0.7, { rot: 42 }), K(1, { rot: 0 })] },
      armR: { keys: [K(0, { rot: 0 }), K(0.2, { rot: -40 }), K(0.45, { rot: -52 }), K(0.7, { rot: -42 }), K(1, { rot: 0 })] },
      foreL: { keys: [K(0, { rot: 0 }), K(0.2, { rot: 62 }), K(0.5, { rot: 54 }), K(0.8, { rot: 60 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.2, { rot: -62 }), K(0.5, { rot: -54 }), K(0.8, { rot: -60 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.15, { rot: -12 }), K(0.35, { rot: 5 }), K(0.55, { rot: -10 }), K(0.75, { rot: 4 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.15, { rot: 12 }), K(0.35, { rot: -5 }), K(0.55, { rot: 10 }), K(0.75, { rot: -4 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.2, { rot: 14 }), K(0.45, { rot: -10 }), K(0.7, { rot: 12 }), K(1, { rot: 0 })] },
    },
  },
  {
    id: "bow",
    name: "Bow",
    label: "The mic-drop exit",
    blurb: "A proper theatrical bow. Announces' energy.",
    duration: 2,
    loop: true,
    energy: 0.4,
    tracks: {
      body: {
        keys: [K(0, { rot: 0 }), K(0.16, { rot: 0 }), K(0.38, { rot: 26 }, "quad"), K(0.62, { rot: 26 }), K(0.85, { rot: 0 }, "quad"), K(1, { rot: 0 })],
      },
      head: {
        keys: [K(0, { rot: 0, y: 0 }), K(0.36, { rot: 8, y: 3 }), K(0.62, { rot: 8, y: 3 }), K(0.85, { rot: 0, y: 0 }), K(1, { rot: 0, y: 0 })],
      },
      armL: { keys: [K(0, { rot: 0 }), K(0.38, { rot: -38 }), K(0.62, { rot: -38 }), K(0.85, { rot: 0 }), K(1, { rot: 0 })] },
      armR: { keys: [K(0, { rot: 0 }), K(0.38, { rot: 38 }), K(0.62, { rot: 38 }), K(0.85, { rot: 0 }), K(1, { rot: 0 })] },
      foreL: { keys: [K(0, { rot: 0 }), K(0.38, { rot: -18 }), K(0.62, { rot: -18 }), K(0.85, { rot: 0 }), K(1, { rot: 0 })] },
      foreR: { keys: [K(0, { rot: 0 }), K(0.38, { rot: 18 }), K(0.62, { rot: 18 }), K(0.85, { rot: 0 }), K(1, { rot: 0 })] },
      earL: { keys: [K(0, { rot: 0 }), K(0.4, { rot: -10 }), K(0.65, { rot: -8 }), K(0.9, { rot: 2 }), K(1, { rot: 0 })] },
      earR: { keys: [K(0, { rot: 0 }), K(0.4, { rot: 10 }), K(0.65, { rot: 8 }), K(0.9, { rot: -2 }), K(1, { rot: 0 })] },
      tail1: { keys: [K(0, { rot: 0 }), K(0.4, { rot: 18 }), K(0.65, { rot: 16 }), K(0.9, { rot: 0 }), K(1, { rot: 0 })] },
    },
  },
];

export const MOTION_BY_ID: Record<MotionId, Motion> = Object.fromEntries(
  MOTIONS.map((m) => [m.id, m]),
) as Record<MotionId, Motion>;

export const DEFAULT_MOTION: MotionId = "wave";

/* ------------------------------------------------------------------ */
/* Sampling                                                            */
/* ------------------------------------------------------------------ */

type PoseProps = Partial<Record<Prop, number>>;

function sampleTrack(track: Track, t: number): PoseProps {
  const keys = track.keys;
  if (!keys.length) return {};
  if (t <= keys[0].t) return propsOf(keys[0]);
  if (t >= keys[keys.length - 1].t) return propsOf(keys[keys.length - 1]);
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.t - a.t || 1;
  const raw = (t - a.t) / span;
  const e = easeInOut(b.ease ?? track.ease ?? "sine", raw);
  const out: PoseProps = {};
  const props: Prop[] = ["x", "y", "rot", "sx", "sy"];
  for (const p of props) {
    const av = a[p];
    const bv = b[p];
    if (av === undefined && bv === undefined) continue;
    const from = av ?? bv ?? 0;
    const to = bv ?? av ?? 0;
    out[p] = from + (to - from) * e;
  }
  return out;
}

function propsOf(key: Key): PoseProps {
  const out: PoseProps = {};
  for (const p of ["x", "y", "rot", "sx", "sy"] as Prop[]) {
    if (key[p] !== undefined) out[p] = key[p] as number;
  }
  return out;
}

function addProps(a: PoseProps, b: PoseProps): PoseProps {
  return {
    x: (a.x ?? 0) + (b.x ?? 0),
    y: (a.y ?? 0) + (b.y ?? 0),
    rot: (a.rot ?? 0) + (b.rot ?? 0),
    sx: (a.sx ?? 1) * (b.sx ?? 1),
    sy: (a.sy ?? 1) * (b.sy ?? 1),
  };
}

export type Pose = {
  matrices: Record<string, Mat>;
  raw: Record<string, Mat>;
  global: Mat;
};

export type SampleOptions = {
  intensity?: number;
  blink?: boolean;
  procedural?: number;
  time?: number;
};

export function samplePose(
  build: Build,
  motion: Motion,
  time: number,
  options: SampleOptions = {},
): Pose {
  const duration = motion.duration;
  const loopT = motion.loop
    ? ((time % duration) + duration) % duration
    : Math.min(Math.max(time, 0), duration);
  const t = loopT / duration;
  const intensity = options.intensity ?? 1;
  const procedural = options.procedural ?? 1;
  const seed = build.spec.seed;
  const elapsed = options.time ?? loopT;

  const offsets: Record<string, PoseProps> = {};
  for (const [bone, track] of Object.entries(motion.tracks)) {
    offsets[bone] = sampleTrack(track, t);
  }

  // procedural life, scaled back on high-energy moves
  const calm = 1 - Math.min(motion.energy ?? 0, 1) * 0.55;
  const breath = Math.sin((elapsed / 3.2) * Math.PI * 2 + seed * 0.01) * 0.012 * procedural * calm;
  const sway = Math.sin((elapsed / 2.6) * Math.PI * 2 + seed * 0.02) * procedural * calm;
  const earWiggle = Math.sin((elapsed / 2.1) * Math.PI * 2 + seed * 0.03) * 1.4 * procedural * calm;

  const overlay: Record<string, PoseProps> = {
    body: { sx: 1 - breath * 0.5, sy: 1 + breath, y: sway * 0.7 },
    head: { rot: sway * 1.1, y: -Math.abs(breath) * 45 },
    earL: { rot: earWiggle },
    earR: { rot: -earWiggle },
    tail1: { rot: sway * 5 },
    tail2: { rot: sway * 7 },
  };

  const all: Record<string, PoseProps> = {};
  for (const bone of build.bones) {
    const a = offsets[bone.id] ?? {};
    const b = overlay[bone.id] ?? {};
    all[bone.id] = addProps(a, b);
  }

  // blinking
  let blink = 1;
  if (options.blink !== false && build.spec.eyes !== "sleepy" && build.spec.eyes !== "happy") {
    const cycle = 2.2 + (seed % 5) * 0.18;
    const phase = (elapsed % cycle) / cycle;
    const at = 0.58;
    const width = 0.075;
    if (phase > at && phase < at + width) {
      const q = (phase - at) / width;
      blink = 1 - Math.sin(q * Math.PI) * (build.spec.eyes === "visor" ? 0.55 : 0.9);
    }
    const second = 0.82;
    if (seed % 3 === 0 && phase > second && phase < second + width * 0.8) {
      const q = (phase - second) / (width * 0.8);
      blink = Math.min(blink, 1 - Math.sin(q * Math.PI) * 0.85);
    }
  }

  const globalProps = motion.global ? sampleTrack(motion.global, t) : {};
  const global = compose(
    matTranslate(210 + (globalProps.x ?? 0) * intensity, 210 + (globalProps.y ?? 0) * intensity),
    matRotate((globalProps.rot ?? 0) * intensity),
    matScale(1, 1),
    matTranslate(-210, -210),
  );

  const raw: Record<string, Mat> = {};
  const localScale: Record<string, { x: number; y: number }> = {};
  const localRot: Record<string, number> = {};

  const resolve = (bone: Bone): Mat => {
    if (raw[bone.id]) return raw[bone.id];
    const pose = all[bone.id] ?? {};
    const parent = bone.parent ? build.byId[bone.parent] : null;
    const parentMat = parent ? resolve(parent) : ([1, 0, 0, 1, 0, 0] as Mat);
    const parentScale = parent ? localScale[parent.id] : { x: 1, y: 1 };
    const parentRot = parent ? localRot[parent.id] : 0;

    let counterSx = 1;
    let counterSy = 1;
    if (bone.counterParentScale) {
      counterSx = 1 / clamp(parentScale.x, 0.55, 1.8);
      counterSy = 1 / clamp(parentScale.y, 0.55, 1.8);
    }
    let counterRot = 0;
    if (bone.id === "legL" || bone.id === "legR") {
      counterRot = -parentRot;
    }

    const rot = (bone.rot ?? 0) + (pose.rot ?? 0) * intensity + counterRot;
    const sx = (bone.sx ?? 1) * (pose.sx ?? 1) * counterSx;
    // eyes need blink multiplied in
    let sy = (bone.sy ?? 1) * (pose.sy ?? 1) * counterSy;
    if (bone.id === "eyeL" || bone.id === "eyeR") sy *= blink;

    const local = compose(
      matTranslate(bone.x + (pose.x ?? 0) * intensity, bone.y + (pose.y ?? 0) * intensity),
      matRotate(rot),
      matScale(sx, sy),
    );
    const world = multiply(parentMat, local);
    raw[bone.id] = world;
    localScale[bone.id] = { x: sx, y: sy };
    localRot[bone.id] = rot + parentRot;
    return world;
  };

  for (const bone of build.bones) resolve(bone);

  const matrices: Record<string, Mat> = {};
  for (const id of Object.keys(raw)) {
    matrices[id] = multiply(build.fit, multiply(global, raw[id]));
  }

  return { matrices, raw, global };
}

/** Sample a representative frame for gallery cards and thumbnails. */
export function posterPose(build: Build, motion: Motion, at = 0.32): Pose {
  return samplePose(build, motion, motion.duration * at, {
    blink: false,
    procedural: 0.65,
  });
}

export function paletteFor(spec: MascotSpec): Palette {
  return derivePalette(spec.primary, spec.accent, spec.ink);
}
