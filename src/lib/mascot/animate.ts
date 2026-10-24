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
  ease: EaseName = "flow",
): Key => ({ t, ...props, ease });

export const MOTIONS: Motion[] = [
  {
    id: "idle",
    name: "Idle",
    label: "Just vibing",
    blurb: "Breathing, blinking, tail sway. The one that sells 'alive'.",
    duration: 3.4,
    loop: true,
    energy: 0.2,
    tracks: {
      body: {
        ease: "flow",
        keys: [
          K(0, { x: 0, y: 0, rot: 0, sx: 1, sy: 1 }),
          K(0.28, { x: 1.5, y: -1, rot: 0.8, sx: 0.99, sy: 1.015 }),
          K(0.55, { x: 2.5, y: 0.5, rot: 1.2, sx: 1.01, sy: 0.985 }),
          K(0.82, { x: 0.8, y: -0.6, rot: 0.4, sx: 0.995, sy: 1.01 }),
          K(1, { x: 0, y: 0, rot: 0, sx: 1, sy: 1 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, y: 0, x: 0 }),
          K(0.25, { rot: -1.8, y: -1.2, x: -0.8 }),
          K(0.52, { rot: 0.6, y: 0.4, x: 0.5 }),
          K(0.78, { rot: 1.6, y: -0.8, x: 1.2 }),
          K(1, { rot: 0, y: 0, x: 0 }),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: -3 }),
          K(0.65, { rot: 1.5 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.35, { rot: 3.5 }),
          K(0.7, { rot: -1.5 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.4, { rot: -4 }),
          K(0.75, { rot: 2 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.45, { rot: 4 }),
          K(0.8, { rot: -2 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.32, { rot: -3.5 }),
          K(0.68, { rot: 2.2 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.36, { rot: 3 }),
          K(0.72, { rot: -2.5 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.28, { rot: 6.5 }),
          K(0.58, { rot: -5.5 }),
          K(0.85, { rot: 3 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.38, { rot: 9 }),
          K(0.68, { rot: -8 }),
          K(0.92, { rot: 4 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "wave",
    name: "Wave",
    label: "The friendly hello",
    blurb: "Arm up, hand flapping, head tilted. Instant likability.",
    duration: 2.0,
    loop: true,
    energy: 0.7,
    tracks: {
      body: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, x: 0 }),
          K(0.18, { rot: 3.5, x: 3 }),
          K(0.5, { rot: 2.5, x: 2 }),
          K(0.82, { rot: 1.5, x: 1 }),
          K(1, { rot: 0, x: 0 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, x: 0, y: 0 }),
          K(0.2, { rot: -7.5, x: -4, y: -1 }),
          K(0.5, { rot: -6, x: -3, y: 0 }),
          K(0.8, { rot: -4, x: -2, y: -0.5 }),
          K(1, { rot: 0, x: 0, y: 0 }),
        ],
      },
      armR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: -148 }, "back"),
          K(0.3, { rot: -136 }, "flow"),
          K(0.44, { rot: -152 }, "flow"),
          K(0.58, { rot: -134 }, "flow"),
          K(0.72, { rot: -150 }, "flow"),
          K(0.86, { rot: -138 }, "flow"),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      foreR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -28 }, "back"),
          K(0.34, { rot: 22 }, "flow"),
          K(0.48, { rot: -26 }, "flow"),
          K(0.62, { rot: 20 }, "flow"),
          K(0.76, { rot: -24 }, "flow"),
          K(0.88, { rot: 12 }, "flow"),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 8 }),
          K(0.6, { rot: 5 }),
          K(0.85, { rot: 3 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 10 }),
          K(0.65, { rot: 6 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 9 }),
          K(0.48, { rot: -5 }),
          K(0.72, { rot: 7 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.22, { rot: -6 }),
          K(0.5, { rot: 4 }),
          K(0.75, { rot: -4 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 12 }),
          K(0.5, { rot: -10 }),
          K(0.75, { rot: 10 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.32, { rot: 16 }),
          K(0.58, { rot: -14 }),
          K(0.82, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "jump",
    name: "Jump",
    label: "The crowd-pleaser",
    blurb: "Anticipation, squash, stretch, airtime, landing. Real physics.",
    duration: 1.6,
    loop: true,
    energy: 1.0,
    tracks: {
      root: {
        keys: [
          K(0, { y: 0 }),
          K(0.18, { y: 12 }, "quad"), // anticipation crouch
          K(0.28, { y: 14 }, "quad"), // maximum spring load
          K(0.42, { y: -74 }, "sine"), // explosive leap to apex
          K(0.56, { y: -76 }), // float at apex
          K(0.74, { y: 0 }, "quad"), // rapid descent to ground
          K(0.82, { y: 12 }, "quad"), // deep landing squash
          K(0.92, { y: -3 }, "sine"), // slight recovery bounce
          K(1, { y: 0 }, "flow"),
        ],
      },
      body: {
        keys: [
          K(0, { sx: 1, sy: 1, rot: 0 }),
          K(0.18, { sx: 1.18, sy: 0.82 }), // crouch squash
          K(0.28, { sx: 1.20, sy: 0.80 }),
          K(0.40, { sx: 0.88, sy: 1.14 }, "quad"), // vertical stretch launch
          K(0.56, { sx: 0.98, sy: 1.02 }), // apex relaxed
          K(0.76, { sx: 0.92, sy: 1.08 }), // pre-contact stretch
          K(0.82, { sx: 1.20, sy: 0.80 }, "quad"), // landing impact squash
          K(0.92, { sx: 0.96, sy: 1.04 }), // rebound
          K(1, { sx: 1, sy: 1 }, "flow"),
        ],
      },
      armL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -24 }), // wind back
          K(0.38, { rot: 152 }, "back"), // thrust up in joy
          K(0.58, { rot: 142 }),
          K(0.76, { rot: 40 }), // sweep down for balance
          K(0.84, { rot: 18 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      armR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 24 }),
          K(0.38, { rot: -152 }, "back"),
          K(0.58, { rot: -142 }),
          K(0.76, { rot: -40 }),
          K(0.84, { rot: -18 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      foreL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -12 }),
          K(0.42, { rot: 20 }),
          K(0.65, { rot: 14 }),
          K(0.82, { rot: -10 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      foreR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 12 }),
          K(0.42, { rot: -20 }),
          K(0.65, { rot: -14 }),
          K(0.82, { rot: 10 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      legL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: -8 }), // crouch flex
          K(0.42, { rot: 18 }), // hanging feet in air!
          K(0.58, { rot: 16 }),
          K(0.76, { rot: 4 }), // prepare for ground
          K(0.84, { rot: -6 }), // impact compression
          K(1, { rot: 0 }),
        ],
      },
      legR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 8 }),
          K(0.42, { rot: -18 }),
          K(0.58, { rot: -16 }),
          K(0.76, { rot: -4 }),
          K(0.84, { rot: 6 }),
          K(1, { rot: 0 }),
        ],
      },
      shinL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 14 }),
          K(0.42, { rot: 36 }), // toes point down at apex
          K(0.58, { rot: 32 }),
          K(0.76, { rot: 8 }),
          K(0.84, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
      shinR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 14 }),
          K(0.42, { rot: 36 }),
          K(0.58, { rot: 32 }),
          K(0.76, { rot: 8 }),
          K(0.84, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.22, { rot: -8 }),
          K(0.42, { rot: -14 }), // trailing down during launch
          K(0.60, { rot: 16 }), // flopping up at apex
          K(0.84, { rot: -12 }), // whipping down on landing
          K(0.94, { rot: 6 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.22, { rot: 8 }),
          K(0.42, { rot: 14 }),
          K(0.60, { rot: -16 }),
          K(0.84, { rot: 12 }),
          K(0.94, { rot: -6 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 10 }),
          K(0.45, { rot: 22 }),
          K(0.68, { rot: -12 }),
          K(0.84, { rot: 16 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 14 }),
          K(0.52, { rot: 28 }),
          K(0.75, { rot: -18 }),
          K(0.9, { rot: 20 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "dance",
    name: "Dance",
    label: "The main character",
    blurb: "Hips, arms, ears, tail — the whole rig gets a turn.",
    duration: 2.4,
    loop: true,
    energy: 0.9,
    tracks: {
      body: {
        ease: "flow",
        keys: [
          K(0, { x: 0, rot: 0, y: 0 }),
          K(0.125, { x: -9, rot: -5.5, y: -2 }),
          K(0.25, { x: 0, rot: 0, y: 1 }),
          K(0.375, { x: 9, rot: 5.5, y: -2 }),
          K(0.5, { x: 0, rot: 0, y: 1 }),
          K(0.625, { x: -9, rot: -5.5, y: -2 }),
          K(0.75, { x: 0, rot: 0, y: 1 }),
          K(0.875, { x: 9, rot: 5.5, y: -2 }),
          K(1, { x: 0, rot: 0, y: 0 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, x: 0 }),
          K(0.125, { rot: 7.5, x: -4 }),
          K(0.25, { rot: 0, x: 0 }),
          K(0.375, { rot: -7.5, x: 4 }),
          K(0.5, { rot: 0, x: 0 }),
          K(0.625, { rot: 7.5, x: -4 }),
          K(0.75, { rot: 0, x: 0 }),
          K(0.875, { rot: -7.5, x: 4 }),
          K(1, { rot: 0, x: 0 }),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: 142 }),
          K(0.25, { rot: 40 }),
          K(0.375, { rot: -30 }),
          K(0.5, { rot: 40 }),
          K(0.625, { rot: 142 }),
          K(0.75, { rot: 40 }),
          K(0.875, { rot: -30 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: 30 }),
          K(0.25, { rot: -40 }),
          K(0.375, { rot: -142 }),
          K(0.5, { rot: -40 }),
          K(0.625, { rot: 30 }),
          K(0.75, { rot: -40 }),
          K(0.875, { rot: -142 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: -22 }),
          K(0.25, { rot: 36 }),
          K(0.375, { rot: -16 }),
          K(0.5, { rot: 36 }),
          K(0.625, { rot: -22 }),
          K(0.75, { rot: 36 }),
          K(0.875, { rot: -16 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: 16 }),
          K(0.25, { rot: -36 }),
          K(0.375, { rot: 22 }),
          K(0.5, { rot: -36 }),
          K(0.625, { rot: 16 }),
          K(0.75, { rot: -36 }),
          K(0.875, { rot: 22 }),
          K(1, { rot: 0 }),
        ],
      },
      legL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: 8 }),
          K(0.25, { rot: -6 }),
          K(0.375, { rot: 6 }),
          K(0.5, { rot: -6 }),
          K(0.625, { rot: 8 }),
          K(0.75, { rot: -6 }),
          K(0.875, { rot: 6 }),
          K(1, { rot: 0 }),
        ],
      },
      legR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.125, { rot: -8 }),
          K(0.25, { rot: 6 }),
          K(0.375, { rot: -6 }),
          K(0.5, { rot: 6 }),
          K(0.625, { rot: -8 }),
          K(0.75, { rot: 6 }),
          K(0.875, { rot: -6 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: -10 }),
          K(0.32, { rot: 6 }),
          K(0.48, { rot: -10 }),
          K(0.64, { rot: 6 }),
          K(0.8, { rot: -7 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: 6 }),
          K(0.32, { rot: -10 }),
          K(0.48, { rot: 6 }),
          K(0.64, { rot: -10 }),
          K(0.8, { rot: 7 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: 14 }),
          K(0.3, { rot: -12 }),
          K(0.45, { rot: 14 }),
          K(0.6, { rot: -12 }),
          K(0.75, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -16 }),
          K(0.4, { rot: 14 }),
          K(0.6, { rot: -16 }),
          K(0.8, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "nod",
    name: "Nod",
    label: "The yes machine",
    blurb: "Two crisp nods. Perfect for approvals, CTAs, and agreement.",
    duration: 1.4,
    loop: true,
    energy: 0.45,
    tracks: {
      head: {
        keys: [
          K(0, { y: 0, rot: 0 }),
          K(0.14, { y: -2, rot: -4 }), // slight anticipation raise
          K(0.28, { y: 10, rot: 9 }, "quad"), // snap down 1
          K(0.42, { y: 1, rot: 0 }), // rebound
          K(0.56, { y: 9, rot: 8 }, "quad"), // snap down 2
          K(0.72, { y: -1, rot: -1 }),
          K(1, { y: 0, rot: 0 }, "flow"),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.18, { rot: 4 }),
          K(0.32, { rot: -9 }),
          K(0.46, { rot: 5 }),
          K(0.60, { rot: -8 }),
          K(0.8, { rot: 2 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.18, { rot: -4 }),
          K(0.32, { rot: 9 }),
          K(0.46, { rot: -5 }),
          K(0.60, { rot: 8 }),
          K(0.8, { rot: -2 }),
          K(1, { rot: 0 }),
        ],
      },
      body: {
        ease: "flow",
        keys: [
          K(0, { y: 0, sx: 1, sy: 1 }),
          K(0.28, { y: 4, sx: 1.04, sy: 0.96 }),
          K(0.42, { y: 0, sx: 1, sy: 1 }),
          K(0.56, { y: 3.5, sx: 1.03, sy: 0.97 }),
          K(0.8, { y: 0, sx: 1, sy: 1 }),
          K(1, { y: 0, sx: 1, sy: 1 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 8 }),
          K(0.6, { rot: -6 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "walk",
    name: "Walk",
    label: "The entrance",
    blurb: "A proper stride cycle with counter-swinging arms and a bob.",
    duration: 1.8,
    loop: true,
    energy: 0.6,
    tracks: {
      root: {
        ease: "flow",
        keys: [
          K(0, { y: 0 }),
          K(0.125, { y: -4 }), // passing position rise
          K(0.25, { y: 0 }), // foot contact
          K(0.375, { y: -4 }),
          K(0.5, { y: 0 }),
          K(0.625, { y: -4 }),
          K(0.75, { y: 0 }),
          K(0.875, { y: -4 }),
          K(1, { y: 0 }),
        ],
      },
      body: {
        ease: "flow",
        keys: [
          K(0, { x: 0, rot: 0 }),
          K(0.25, { x: 3.5, rot: 2.2 }),
          K(0.5, { x: 0, rot: 0 }),
          K(0.75, { x: -3.5, rot: -2.2 }),
          K(1, { x: 0, rot: 0 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { y: 0, rot: 0 }),
          K(0.25, { y: -1, rot: -1.2 }),
          K(0.5, { y: 0, rot: 0 }),
          K(0.75, { y: -1, rot: 1.2 }),
          K(1, { y: 0, rot: 0 }),
        ],
      },
      legL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: -24 }, "quad"),
          K(0.3, { rot: 0 }),
          K(0.5, { rot: 22 }, "quad"),
          K(0.65, { rot: 0 }),
          K(0.85, { rot: -16 }),
          K(1, { rot: 0 }),
        ],
      },
      legR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: 22 }, "quad"),
          K(0.3, { rot: 0 }),
          K(0.5, { rot: -24 }, "quad"),
          K(0.65, { rot: 0 }),
          K(0.85, { rot: 16 }),
          K(1, { rot: 0 }),
        ],
      },
      shinL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: 8 }),
          K(0.3, { rot: 0 }),
          K(0.5, { rot: 32 }), // knee bend during recovery
          K(0.65, { rot: 6 }),
          K(0.85, { rot: 26 }),
          K(1, { rot: 0 }),
        ],
      },
      shinR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: 32 }),
          K(0.3, { rot: 6 }),
          K(0.5, { rot: 8 }),
          K(0.65, { rot: 0 }),
          K(0.85, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 20 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: -18 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: -18 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: 20 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 12 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: -14 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: -14 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: -5 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: 5 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 5 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: -5 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 9 }),
          K(0.5, { rot: 0 }),
          K(0.75, { rot: -9 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 12 }),
          K(0.55, { rot: 0 }),
          K(0.8, { rot: -12 }),
          K(1, { rot: 0 }),
        ],
      },
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
      keys: [
        K(0, { y: 0, rot: 0 }),
        K(0.18, { y: 5 }), // crouch load
        K(0.46, { y: -56 }), // hop into air
        K(0.72, { y: -50 }),
        K(0.86, { y: 0 }), // touch down
        K(1, { y: 0, rot: 360 }),
      ],
    },
    tracks: {
      body: {
        keys: [
          K(0, { sx: 1, sy: 1 }),
          K(0.2, { sx: 1.15, sy: 0.85 }), // crouch
          K(0.48, { sx: 0.92, sy: 1.08 }), // airborne stretch
          K(0.86, { sx: 1.16, sy: 0.84 }), // landing squash
          K(0.94, { sx: 0.98, sy: 1.02 }),
          K(1, { sx: 1, sy: 1 }),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 30 }),
          K(0.45, { rot: 85 }), // tuck in for rapid spin
          K(0.72, { rot: 75 }),
          K(0.88, { rot: 35 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -30 }),
          K(0.45, { rot: -85 }),
          K(0.72, { rot: -75 }),
          K(0.88, { rot: -35 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.45, { rot: 25 }),
          K(0.85, { rot: 10 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.45, { rot: -25 }),
          K(0.85, { rot: -10 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.4, { rot: -16 }),
          K(0.8, { rot: 8 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.4, { rot: 16 }),
          K(0.8, { rot: -8 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.4, { rot: 32 }),
          K(0.8, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "celebrate",
    name: "Celebrate",
    label: "The launch party",
    blurb: "Both arms up, double bounce, ears going feral. Ship it.",
    duration: 2.2,
    loop: true,
    energy: 1.0,
    tracks: {
      root: {
        keys: [
          K(0, { y: 0 }),
          K(0.12, { y: 6 }), // crouch 1
          K(0.28, { y: -44 }, "quad"), // bounce 1
          K(0.42, { y: 0 }, "quad"), // land 1
          K(0.54, { y: 6 }), // crouch 2
          K(0.68, { y: -34 }, "quad"), // bounce 2
          K(0.82, { y: 0 }, "quad"), // land 2
          K(0.92, { y: -2 }),
          K(1, { y: 0 }, "flow"),
        ],
      },
      body: {
        keys: [
          K(0, { sx: 1, sy: 1 }),
          K(0.12, { sx: 1.14, sy: 0.86 }),
          K(0.28, { sx: 0.94, sy: 1.07 }),
          K(0.42, { sx: 1.12, sy: 0.88 }),
          K(0.54, { sx: 1.14, sy: 0.86 }),
          K(0.68, { sx: 0.96, sy: 1.05 }),
          K(0.82, { sx: 1.10, sy: 0.90 }),
          K(0.92, { sx: 0.98, sy: 1.02 }),
          K(1, { sx: 1, sy: 1 }),
        ],
      },
      armL: {
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: 154 }, "back"),
          K(0.55, { rot: 140 }),
          K(0.8, { rot: 156 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      armR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.16, { rot: -154 }, "back"),
          K(0.55, { rot: -140 }),
          K(0.8, { rot: -156 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: -16 }),
          K(0.6, { rot: 16 }),
          K(0.85, { rot: -12 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 16 }),
          K(0.6, { rot: -16 }),
          K(0.85, { rot: 12 }),
          K(1, { rot: 0 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, y: 0 }),
          K(0.28, { rot: -6, y: -4 }),
          K(0.5, { rot: 5, y: 0 }),
          K(0.68, { rot: -6, y: -4 }),
          K(0.84, { rot: 3, y: 0 }),
          K(1, { rot: 0, y: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -18 }),
          K(0.4, { rot: 10 }),
          K(0.6, { rot: -16 }),
          K(0.8, { rot: 8 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 18 }),
          K(0.4, { rot: -10 }),
          K(0.6, { rot: 16 }),
          K(0.8, { rot: -8 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 18 }),
          K(0.5, { rot: -14 }),
          K(0.75, { rot: 16 }),
          K(1, { rot: 0 }),
        ],
      },
      tail2: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.28, { rot: -22 }),
          K(0.55, { rot: 18 }),
          K(0.8, { rot: -20 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "think",
    name: "Think",
    label: "The strategy pose",
    blurb: "Hand to chin, eyes up, one thoughtful head tilt.",
    duration: 2.6,
    loop: true,
    energy: 0.3,
    tracks: {
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, x: 0 }),
          K(0.2, { rot: 9.5, x: 5, y: -1 }),
          K(0.55, { rot: 8, x: 4, y: -2 }),
          K(0.82, { rot: 10, x: 5.5, y: -0.5 }),
          K(1, { rot: 0, x: 0 }),
        ],
      },
      eyeL: {
        ease: "flow",
        keys: [
          K(0, { x: 0, y: 0 }),
          K(0.25, { x: -2.5, y: -3.5 }),
          K(0.65, { x: 1.2, y: -3.5 }),
          K(0.85, { x: -2, y: -2.5 }),
          K(1, { x: 0, y: 0 }),
        ],
      },
      eyeR: {
        ease: "flow",
        keys: [
          K(0, { x: 0, y: 0 }),
          K(0.25, { x: -2.5, y: -3.5 }),
          K(0.65, { x: 1.2, y: -3.5 }),
          K(0.85, { x: -2, y: -2.5 }),
          K(1, { x: 0, y: 0 }),
        ],
      },
      armR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.22, { rot: -122 }, "back"), // tap chin
          K(0.55, { rot: -116 }),
          K(0.82, { rot: -124 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      foreR: {
        keys: [
          K(0, { rot: 0 }),
          K(0.24, { rot: 126 }, "back"),
          K(0.55, { rot: 120 }),
          K(0.82, { rot: 128 }),
          K(1, { rot: 0 }, "flow"),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.25, { rot: 20 }),
          K(0.7, { rot: 14 }),
          K(1, { rot: 0 }),
        ],
      },
      body: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: -4.5 }),
          K(0.7, { rot: -3.5 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.3, { rot: 12 }),
          K(0.6, { rot: -7 }),
          K(0.85, { rot: 9 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.35, { rot: -6 }),
          K(0.8, { rot: 4 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.35, { rot: 6 }),
          K(0.8, { rot: -4 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "laugh",
    name: "Laugh",
    label: "The belly laugh",
    blurb: "Head back, squint, full-body shake. Chaotic good.",
    duration: 1.8,
    loop: true,
    energy: 0.95,
    tracks: {
      body: {
        ease: "flow",
        keys: [
          K(0, { x: 0, rot: 0, sx: 1, sy: 1 }),
          K(0.12, { x: -4, rot: -2.5, sx: 1.05, sy: 0.95 }),
          K(0.24, { x: 4, rot: 2.5, sx: 0.96, sy: 1.04 }),
          K(0.36, { x: -4, rot: -2.5, sx: 1.05, sy: 0.95 }),
          K(0.48, { x: 4, rot: 2.5, sx: 0.96, sy: 1.04 }),
          K(0.6, { x: -3, rot: -2, sx: 1.04, sy: 0.96 }),
          K(0.72, { x: 3, rot: 1.5, sx: 0.97, sy: 1.03 }),
          K(0.85, { x: -2, rot: -1 }),
          K(1, { x: 0, rot: 0, sx: 1, sy: 1 }),
        ],
      },
      head: {
        ease: "flow",
        keys: [
          K(0, { rot: 0, y: 0 }),
          K(0.14, { rot: -13, y: -4 }),
          K(0.3, { rot: -8, y: -2 }),
          K(0.48, { rot: -14, y: -5 }),
          K(0.66, { rot: -9, y: -3 }),
          K(0.85, { rot: -4 }),
          K(1, { rot: 0, y: 0 }),
        ],
      },
      eyeL: {
        keys: [
          K(0, { sy: 1 }),
          K(0.1, { sy: 0.25 }),
          K(0.75, { sy: 0.25 }),
          K(0.9, { sy: 1 }),
          K(1, { sy: 1 }),
        ],
      },
      eyeR: {
        keys: [
          K(0, { sy: 1 }),
          K(0.1, { sy: 0.25 }),
          K(0.75, { sy: 0.25 }),
          K(0.9, { sy: 1 }),
          K(1, { sy: 1 }),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 44 }),
          K(0.45, { rot: 56 }),
          K(0.7, { rot: 46 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -44 }),
          K(0.45, { rot: -56 }),
          K(0.7, { rot: -46 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 66 }),
          K(0.5, { rot: 56 }),
          K(0.8, { rot: 62 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: -66 }),
          K(0.5, { rot: -56 }),
          K(0.8, { rot: -62 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: -14 }),
          K(0.35, { rot: 6 }),
          K(0.55, { rot: -12 }),
          K(0.75, { rot: 5 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.15, { rot: 14 }),
          K(0.35, { rot: -6 }),
          K(0.55, { rot: 12 }),
          K(0.75, { rot: -5 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.2, { rot: 16 }),
          K(0.45, { rot: -12 }),
          K(0.7, { rot: 14 }),
          K(1, { rot: 0 }),
        ],
      },
    },
  },
  {
    id: "bow",
    name: "Bow",
    label: "The mic-drop exit",
    blurb: "A proper theatrical bow. Announces' energy.",
    duration: 2.2,
    loop: true,
    energy: 0.4,
    tracks: {
      body: {
        keys: [
          K(0, { rot: 0, y: 0 }),
          K(0.14, { rot: -2, y: -1 }), // slight breath in
          K(0.36, { rot: 28, y: 4 }, "quad"), // deep respectful bow
          K(0.62, { rot: 28, y: 4 }), // hold bow respectfully
          K(0.86, { rot: 0, y: 0 }, "quad"), // return gracefully
          K(1, { rot: 0, y: 0 }, "flow"),
        ],
      },
      head: {
        keys: [
          K(0, { rot: 0, y: 0 }),
          K(0.34, { rot: 10, y: 4 }),
          K(0.62, { rot: 10, y: 4 }),
          K(0.86, { rot: 0, y: 0 }),
          K(1, { rot: 0, y: 0 }, "flow"),
        ],
      },
      armL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.36, { rot: -36 }),
          K(0.62, { rot: -36 }),
          K(0.86, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
      armR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.36, { rot: 36 }),
          K(0.62, { rot: 36 }),
          K(0.86, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
      foreL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.36, { rot: -16 }),
          K(0.62, { rot: -16 }),
          K(0.86, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
      foreR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.36, { rot: 16 }),
          K(0.62, { rot: 16 }),
          K(0.86, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
      earL: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.38, { rot: -12 }),
          K(0.65, { rot: -10 }),
          K(0.9, { rot: 2 }),
          K(1, { rot: 0 }),
        ],
      },
      earR: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.38, { rot: 12 }),
          K(0.65, { rot: 10 }),
          K(0.9, { rot: -2 }),
          K(1, { rot: 0 }),
        ],
      },
      tail1: {
        ease: "flow",
        keys: [
          K(0, { rot: 0 }),
          K(0.38, { rot: 20 }),
          K(0.65, { rot: 18 }),
          K(0.9, { rot: 0 }),
          K(1, { rot: 0 }),
        ],
      },
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
  const easeName = b.ease ?? track.ease ?? "flow";
  const e = easeInOut(easeName, raw);
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
  lift?: number;
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
  const calm = 1 - Math.min(motion.energy ?? 0, 1) * 0.5;
  // Continuous smooth breathing with volume preservation
  const breath = Math.sin((elapsed / 3.4) * Math.PI * 2 + seed * 0.01) * 0.014 * procedural * calm;
  const breathSy = 1 + breath;
  const breathSx = 1 / Math.pow(Math.max(0.5, breathSy), 0.6); // volume compensation

  const sway = Math.sin((elapsed / 2.8) * Math.PI * 2 + seed * 0.02) * procedural * calm;
  const earWiggleL = Math.sin((elapsed / 2.2) * Math.PI * 2 + seed * 0.03) * 1.5 * procedural * calm;
  const earWiggleR = Math.sin((elapsed / 2.2) * Math.PI * 2 + seed * 0.03 + 0.6) * 1.5 * procedural * calm;

  // Gaze wander: every ~4 seconds, gaze glides and holds
  const gazeCycle = 4.2;
  const gazePhase = (elapsed % gazeCycle) / gazeCycle;
  let gazeX = 0;
  let gazeY = 0;
  if (gazePhase > 0.4 && gazePhase < 0.8) {
    const gp = (gazePhase - 0.4) / 0.4;
    const window = Math.sin(gp * Math.PI);
    gazeX = Math.sin(seed + 1) * 1.8 * window * procedural;
    gazeY = (Math.cos(seed + 2) * 1.0 - 0.5) * window * procedural;
  }

  // Head yaw 2.5D feature slide calculation:
  // When head rotates, slide facial features (eyes, muzzle) along with yaw
  const headKeyRot = offsets.head?.rot ?? 0;
  const headTotalRot = headKeyRot + sway * 1.1;
  const yawSlideX = headTotalRot * 0.32;
  const yawEarSlideX = -headTotalRot * 0.16;

  const overlay: Record<string, PoseProps> = {
    body: { sx: breathSx, sy: breathSy, y: sway * 0.8 },
    head: { rot: sway * 1.1, y: -Math.abs(breath) * 35 },
    eyeL: { x: yawSlideX + gazeX, y: gazeY },
    eyeR: { x: yawSlideX + gazeX, y: gazeY },
    earL: { rot: earWiggleL, x: yawEarSlideX },
    earR: { rot: -earWiggleR, x: yawEarSlideX },
    tail1: { rot: sway * 4.5 },
    tail2: { rot: sway * 6.5 },
  };

  const all: Record<string, PoseProps> = {};
  for (const bone of build.bones) {
    const a = offsets[bone.id] ?? {};
    const b = overlay[bone.id] ?? {};
    all[bone.id] = addProps(a, b);
  }

  // Rossark blink timing:
  // Cycle ~3.6s, close ~100ms, hold 40ms, open ~180ms (total ~320ms)
  // Occasional double-blink
  let blink = 1;
  if (options.blink !== false && build.spec.eyes !== "sleepy" && build.spec.eyes !== "happy") {
    const cycle = 3.6 + (seed % 4) * 0.35;
    const cyclePos = elapsed % cycle;
    const blinkStart = 1.8;
    const closeTime = 0.10;
    const holdTime = 0.04;
    const openTime = 0.18;
    const totalBlink = closeTime + holdTime + openTime;

    if (cyclePos >= blinkStart && cyclePos < blinkStart + totalBlink) {
      const dt = cyclePos - blinkStart;
      if (dt < closeTime) {
        blink = 1 - easeInOut("quad", dt / closeTime);
      } else if (dt < closeTime + holdTime) {
        blink = 0;
      } else {
        blink = easeInOut("quad", (dt - closeTime - holdTime) / openTime);
      }
    }

    // Double blink for 33% of mascots
    if (seed % 3 === 0) {
      const doubleStart = blinkStart + totalBlink + 0.14;
      if (cyclePos >= doubleStart && cyclePos < doubleStart + totalBlink) {
        const dt = cyclePos - doubleStart;
        if (dt < closeTime) {
          blink = Math.min(blink, 1 - easeInOut("quad", dt / closeTime));
        } else if (dt < closeTime + holdTime) {
          blink = 0;
        } else {
          blink = Math.min(blink, easeInOut("quad", (dt - closeTime - holdTime) / openTime));
        }
      }
    }
  }

  const globalProps = motion.global ? sampleTrack(motion.global, t) : {};
  const rootLift = -((all.root?.y ?? 0) * intensity + (globalProps.y ?? 0) * intensity);
  const lift = Math.max(0, rootLift);

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

  return { matrices, raw, global, lift };
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
