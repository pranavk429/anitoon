/**
 * Tiny vector geometry IR.
 *
 * Every mascot part is built from cubic bezier paths so the exact same
 * geometry can be compiled to SVG markup *and* Lottie shape data without a
 * lossy SVG-path parser.
 */

export type Vec = [number, number];

export type Segment = {
  c1: Vec;
  c2: Vec;
  to: Vec;
};

export type Path = {
  start: Vec;
  segs: Segment[];
  closed: boolean;
};

export type Mat = [number, number, number, number, number, number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

const K = 0.5522847498307936;
const TAU = Math.PI * 2;

export const round = (n: number, precision = 2) => {
  const f = 10 ** precision;
  return Math.round(n * f) / f;
};

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Create a path from an explicit list of segments. */
export function makePath(
  start: Vec,
  segs: Array<[Vec, Vec, Vec]>,
  closed = true,
): Path {
  return {
    start,
    segs: segs.map(([c1, c2, to]) => ({ c1, c2, to })),
    closed,
  };
}

/** Straight-line polyline (still represented as cubic segments). */
export function polyline(points: Vec[], closed = false): Path {
  if (points.length < 2) {
    return { start: points[0] ?? [0, 0], segs: [], closed };
  }
  const segs: Segment[] = [];
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segs.push({
      c1: [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
      c2: [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3],
      to: b,
    });
  }
  return { start: points[0], segs, closed };
}

/**
 * Catmull-Rom spline through the supplied points, converted to cubic beziers.
 * This is what gives the mascots hand-drawn, organic silhouettes.
 */
export function smooth(points: Vec[], closed = true, tension = 1): Path {
  const n = points.length;
  if (n < 2) return { start: points[0] ?? [0, 0], segs: [], closed };
  if (n === 2) return polyline(points, closed);

  const at = (i: number): Vec => {
    if (closed) return points[(i + n) % n];
    return points[clamp(i, 0, n - 1)];
  };

  const start = points[0];
  const segs: Segment[] = [];
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Vec = [
      p1[0] + ((p2[0] - p0[0]) / 6) * tension,
      p1[1] + ((p2[1] - p0[1]) / 6) * tension,
    ];
    const c2: Vec = [
      p2[0] - ((p3[0] - p1[0]) / 6) * tension,
      p2[1] - ((p3[1] - p1[1]) / 6) * tension,
    ];
    segs.push({ c1, c2, to: p2 });
  }
  return { start, segs, closed };
}

export function ellipse(cx: number, cy: number, rx: number, ry = rx): Path {
  return makePath(
    [cx + rx, cy],
    [
      [
        [cx + rx, cy + ry * K],
        [cx + rx * K, cy + ry],
        [cx, cy + ry],
      ],
      [
        [cx - rx * K, cy + ry],
        [cx - rx, cy + ry * K],
        [cx - rx, cy],
      ],
      [
        [cx - rx, cy - ry * K],
        [cx - rx * K, cy - ry],
        [cx, cy - ry],
      ],
      [
        [cx + rx * K, cy - ry],
        [cx + rx, cy - ry * K],
        [cx + rx, cy],
      ],
    ],
    true,
  );
}

export function roundRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): Path {
  const radius = Math.min(r, w / 2, h / 2);
  const k = radius * K;
  return makePath(
    [x + radius, y],
    [
      [
        [x + w - radius + k, y],
        [x + w, y + radius - k],
        [x + w, y + radius],
      ],
      [
        [x + w, y + h - radius + k],
        [x + w - radius + k, y + h],
        [x + w - radius, y + h],
      ],
      [
        [x + radius - k, y + h],
        [x, y + h - radius + k],
        [x, y + h - radius],
      ],
      [
        [x, y + radius - k],
        [x + radius - k, y],
        [x + radius, y],
      ],
    ],
    true,
  );
}

/** Open stroked line through points, with rounded joins. */
export function strokePath(points: Vec[], closed = false, tension = 0.7): Path {
  return smooth(points, closed, tension);
}

/** Mirror a path across the Y axis (x -> -x). */
export function mirrorPath(path: Path, axis = 0): Path {
  const m = (v: Vec): Vec => [axis * 2 - v[0], v[1]];
  return {
    start: m(path.start),
    segs: path.segs.map((s) => ({ c1: m(s.c1), c2: m(s.c2), to: m(s.to) })),
    closed: path.closed,
  };
}

export function mapPath(path: Path, fn: (v: Vec) => Vec): Path {
  return {
    start: fn(path.start),
    segs: path.segs.map((s) => ({ c1: fn(s.c1), c2: fn(s.c2), to: fn(s.to) })),
    closed: path.closed,
  };
}

export function translatePath(path: Path, x: number, y: number): Path {
  return mapPath(path, (v) => [v[0] + x, v[1] + y]);
}

export function scalePath(path: Path, sx: number, sy = sx): Path {
  return mapPath(path, (v) => [v[0] * sx, v[1] * sy]);
}

export function rotatePath(path: Path, deg: number, cx = 0, cy = 0): Path {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return mapPath(path, (v) => {
    const x = v[0] - cx;
    const y = v[1] - cy;
    return [cx + x * cos - y * sin, cy + x * sin + y * cos];
  });
}

export function pathPoints(path: Path): Vec[] {
  const pts: Vec[] = [path.start];
  for (const s of path.segs) pts.push(s.c1, s.c2, s.to);
  return pts;
}

const fmt = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? "0" : `${v}`;
};

export function pathToD(path: Path): string {
  const parts = [`M ${fmt(path.start[0])} ${fmt(path.start[1])}`];
  for (const s of path.segs) {
    parts.push(
      `C ${fmt(s.c1[0])} ${fmt(s.c1[1])} ${fmt(s.c2[0])} ${fmt(
        s.c2[1],
      )} ${fmt(s.to[0])} ${fmt(s.to[1])}`,
    );
  }
  if (path.closed) parts.push("Z");
  return parts.join(" ");
}

export function pathLength(path: Path): number {
  let len = 0;
  let prev = path.start;
  for (const s of path.segs) {
    // coarse sampling is plenty for sorting/bounds
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const mt = 1 - t;
      const x =
        mt * mt * mt * prev[0] +
        3 * mt * mt * t * s.c1[0] +
        3 * mt * t * t * s.c2[0] +
        t * t * t * s.to[0];
      const y =
        mt * mt * mt * prev[1] +
        3 * mt * mt * t * s.c1[1] +
        3 * mt * t * t * s.c2[1] +
        t * t * t * s.to[1];
      len += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
    }
    prev = s.to;
  }
  return len;
}

/* ------------------------------------------------------------------ */
/* 2D affine transforms                                                */
/* ------------------------------------------------------------------ */

export function multiply(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

export const matTranslate = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];

export function matRotate(deg: number): Mat {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, s, -s, c, 0, 0];
}

export const matScale = (sx: number, sy = sx): Mat => [sx, 0, 0, sy, 0, 0];

export function applyMat(m: Mat, v: Vec): Vec {
  return [m[0] * v[0] + m[2] * v[1] + m[4], m[1] * v[0] + m[3] * v[1] + m[5]];
}

export function compose(...mats: Mat[]): Mat {
  return mats.reduce((acc, m) => multiply(acc, m), IDENTITY);
}

export type Decomposed = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export function decompose(m: Mat): Decomposed {
  const x = m[4];
  const y = m[5];
  const rotation = (Math.atan2(m[1], m[0]) * 180) / Math.PI;
  const scaleX = Math.hypot(m[0], m[1]);
  const det = m[0] * m[3] - m[1] * m[2];
  const scaleY = scaleX === 0 ? 0 : det / scaleX;
  return { x, y, rotation, scaleX, scaleY };
}

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

/** Easing functions used by the animation sampler. */
export type EaseName =
  | "linear"
  | "sine"
  | "quad"
  | "cubic"
  | "back"
  | "bounce"
  | "elastic";

export const easings: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  quad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  cubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => {
    const c4 = TAU / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export function easeInOut(name: EaseName, t: number): number {
  return easings[name](clamp(t, 0, 1));
}
