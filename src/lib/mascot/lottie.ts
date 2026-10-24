import { type Build, type Shape } from "./art";
import { MOTION_BY_ID, samplePose, type MotionId, type Pose } from "./animate";
import { decompose, pathToD, type Mat, type Path } from "./geometry";

/**
 * Compile the mascot rig into a Lottie (bodymovin) document.
 *
 * Each bone becomes a Lottie shape layer. Geometry stays in bone-local
 * coordinates; the layer transform is baked from the runtime sampler, so the
 * browser preview and the exported file agree frame for frame.
 */

type Rgba = [number, number, number, number];

const FPS = 30;

function rgb(hex: string, fallback: Rgba = [0.1, 0.08, 0.11, 1]): Rgba {
  const value = hex.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  const long = /^#([0-9a-f]{6})$/i.exec(value);
  let r = 0;
  let g = 0;
  let b = 0;
  if (short) {
    r = parseInt(short[1][0] + short[1][0], 16);
    g = parseInt(short[1][1] + short[1][1], 16);
    b = parseInt(short[1][2] + short[1][2], 16);
  } else if (long) {
    r = parseInt(long[1].slice(0, 2), 16);
    g = parseInt(long[1].slice(2, 4), 16);
    b = parseInt(long[1].slice(4, 6), 16);
  } else {
    return fallback;
  }
  return [
    Math.round((r / 255) * 1000) / 1000,
    Math.round((g / 255) * 1000) / 1000,
    Math.round((b / 255) * 1000) / 1000,
    1,
  ];
}

const n2 = (n: number) => {
  const v = Math.round(n * 1000) / 1000;
  return Object.is(v, -0) ? 0 : v;
};

function lottiePath(path: Path) {
  const verts = [path.start];
  for (const s of path.segs) verts.push(s.to);
  if (path.closed && verts.length > 1) {
    const first = verts[0];
    const last = verts[verts.length - 1];
    if (Math.abs(first[0] - last[0]) < 0.001 && Math.abs(first[1] - last[1]) < 0.001) {
      verts.pop();
    }
  }
  const n = verts.length;
  const v: Array<[number, number]> = [];
  const i: Array<[number, number]> = [];
  const o: Array<[number, number]> = [];

  // Incoming control for vertex k comes from segment k-1; outgoing from k.
  const segCount = path.segs.length;
  for (let k = 0; k < n; k++) {
    const pt = verts[k];
    v.push([n2(pt[0]), n2(pt[1])]);

    const inSeg = path.closed && k === 0 ? path.segs[segCount - 1] : path.segs[k - 1];
    if (inSeg && k > 0) {
      i.push([n2(inSeg.c2[0] - pt[0]), n2(inSeg.c2[1] - pt[1])]);
    } else if (inSeg && path.closed) {
      i.push([n2(inSeg.c2[0] - pt[0]), n2(inSeg.c2[1] - pt[1])]);
    } else {
      i.push([0, 0]);
    }

    const outSeg = path.segs[k];
    if (outSeg && (k < segCount || path.closed)) {
      o.push([n2(outSeg.c1[0] - pt[0]), n2(outSeg.c1[1] - pt[1])]);
    } else {
      o.push([0, 0]);
    }
  }
  return { i, o, v, c: path.closed };
}

function shapeItem(shape: Shape, index: number) {
  const st = shape.style;
  const items: unknown[] = [
    {
      ty: "sh",
      nm: `path-${index}`,
      ks: { a: 0, k: lottiePath(shape.path) },
    },
  ];
  if (st.fill) {
    items.push({
      ty: "fl",
      nm: "fill",
      c: { a: 0, k: rgb(st.fill) },
      o: { a: 0, k: 100 },
      r: 1,
      bm: 0,
    });
  }
  if (st.stroke) {
    items.push({
      ty: "st",
      nm: "stroke",
      c: { a: 0, k: rgb(st.stroke) },
      o: { a: 0, k: 100 },
      w: { a: 0, k: st.width ?? 4.5 },
      lc: st.cap === "butt" ? 1 : st.cap === "square" ? 3 : 2,
      lj: st.join === "miter" ? 1 : st.join === "bevel" ? 3 : 2,
      ml: 4,
      bm: 0,
    });
  }
  items.push({
    ty: "tr",
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 },
    o: { a: 0, k: 100 },
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 },
    nm: "transform",
  });
  return {
    ty: "gr",
    nm: `group-${index}`,
    it: items,
    np: items.length,
    bm: 0,
    ix: index + 1,
    mn: "ADBE Vector Group",
  };
}

type Vec2 = [number, number];

type PropSamples = {
  position: Vec2[];
  rotation: number[];
  scale: Vec2[];
};

const EPS = 0.06;

function same(a: number, b: number) {
  return Math.abs(a - b) <= EPS;
}

function staticOrAnimated<T extends number[] | Vec2[]>(
  values: T[],
  equals: (a: T, b: T) => boolean,
): { animated: boolean; keyframes: Array<{ t: number; s: T }> } {
  const keys: Array<{ t: number; s: T }> = [];
  let animated = false;
  for (let f = 0; f < values.length; f++) {
    const current = values[f];
    const prev = keys[keys.length - 1];
    if (!prev) {
      keys.push({ t: f, s: current });
      continue;
    }
    if (!equals(prev.s, current)) {
      animated = true;
      keys.push({ t: f, s: current });
    }
  }
  if (!animated) keys.length = 1;
  return { animated, keyframes: keys };
}

function vecEquals(a: number[] | Vec2[], b: number[] | Vec2[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] as number | Vec2;
    const bv = b[i] as number | Vec2;
    if (typeof av === "number" && typeof bv === "number") {
      if (!same(av, bv)) return false;
    } else if (Array.isArray(av) && Array.isArray(bv)) {
      if (!same(av[0], bv[0]) || !same(av[1], bv[1])) return false;
    }
  }
  return true;
}

function unwrap(angles: number[]): number[] {
  const out: number[] = [];
  let prev = angles[0] ?? 0;
  for (let i = 0; i < angles.length; i++) {
    let a = angles[i];
    if (i > 0) {
      while (a - prev > 180) a -= 360;
      while (a - prev < -180) a += 360;
    }
    out.push(n2(a));
    prev = a;
  }
  return out;
}

function framesFor(build: Build, motionId: MotionId, frames?: number, fps = FPS) {
  const motion = MOTION_BY_ID[motionId];
  const count = frames ?? Math.max(1, Math.round(motion.duration * fps));
  const poses: Pose[] = [];
  for (let f = 0; f <= count; f++) {
    poses.push(
      samplePose(build, motion, (f / count) * motion.duration, {
        blink: false,
        procedural: 1,
        time: (f / count) * motion.duration,
      }),
    );
  }
  return { motion, count, poses };
}

export type LottieOptions = {
  /** Frames to bake. Defaults to duration × 30fps. */
  frames?: number;
  fps?: number;
  /** Override the layer name suffix. */
  name?: string;
};

export function compileLottie(
  build: Build,
  motionId: MotionId,
  opts: LottieOptions = {},
): Record<string, unknown> {
  const fps = opts.fps ?? FPS;
  const { motion, count, poses } = framesFor(build, motionId, opts.frames, fps);

  const layers: Array<Record<string, unknown>> = [];
  for (let li = build.layers.length - 1; li >= 0; li--) {
    const layer = build.layers[li];
    const samples: PropSamples = { position: [], rotation: [], scale: [] };
    for (const pose of poses) {
      const m: Mat | undefined = pose.matrices[layer.bone];
      if (!m) {
        samples.position.push([0, 0]);
        samples.rotation.push(0);
        samples.scale.push([100, 100]);
        continue;
      }
      const d = decompose(m);
      samples.position.push([n2(d.x), n2(d.y)]);
      samples.rotation.push(n2(d.rotation));
      samples.scale.push([n2(d.scaleX * 100), n2(d.scaleY * 100)]);
    }
    samples.rotation = unwrap(samples.rotation);

    const pos = staticOrAnimated<Vec2>(samples.position, vecEquals as never);
    const rot = staticOrAnimated<number[]>(
      samples.rotation.map((r) => [r]),
      vecEquals as never,
    );
    const scale = staticOrAnimated<Vec2>(samples.scale, vecEquals as never);

    const posProp = pos.animated
      ? {
          a: 1,
          k: pos.keyframes.map((k, idx) => ({
            t: k.t,
            s: k.s,
            ...(idx < pos.keyframes.length - 1
              ? { i: { x: [0.6], y: [1] }, o: { x: [0.4], y: [0] } }
              : {}),
          })),
        }
      : { a: 0, k: pos.keyframes[0].s };

    const rotProp = rot.animated
      ? {
          a: 1,
          k: rot.keyframes.map((k, idx) => ({
            t: k.t,
            s: [k.s[0]],
            ...(idx < rot.keyframes.length - 1
              ? { i: { x: [0.6], y: [1] }, o: { x: [0.4], y: [0] } }
              : {}),
          })),
        }
      : { a: 0, k: rot.keyframes[0].s[0] };

    const scaleProp = scale.animated
      ? {
          a: 1,
          k: scale.keyframes.map((k, idx) => ({
            t: k.t,
            s: k.s,
            ...(idx < scale.keyframes.length - 1
              ? { i: { x: [0.6], y: [1] }, o: { x: [0.4], y: [0] } }
              : {}),
          })),
        }
      : { a: 0, k: scale.keyframes[0].s };

    layers.push({
      ddd: 0,
      ind: layers.length + 1,
      ty: 4,
      nm: `${layer.bone}`,
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: rotProp,
        p: posProp,
        a: { a: 0, k: [0, 0] },
        s: scaleProp,
      },
      ao: 0,
      shapes: layer.shapes.map((s, i) => shapeItem(s, i)),
      ip: 0,
      op: count,
      st: 0,
      bm: 0,
      cl: "toonify",
      hd: false,
    });
  }

  return {
    v: "5.12.2",
    fr: fps,
    ip: 0,
    op: count,
    w: build.stage.w,
    h: build.stage.h,
    nm: opts.name ?? `${build.spec.name} · ${motion.name}`,
    ddd: 0,
    assets: [],
    layers,
    markers: [
      {
        tm: 0,
        cm: motion.id,
        dr: count,
      },
    ],
    meta: {
      g: "Toonify vector mascot compiler",
      a: "Toonify",
      k: `toonify-${motion.id}`,
      d: `Layered vector rig, ${build.layers.length} bones, ${count} frames at ${fps}fps.`,
    },
    toonify: {
      motion: motion.id,
      name: motion.name,
      duration: motion.duration,
      loop: motion.loop,
      spec: build.spec,
    },
  };
}

export function compileAllLottie(build: Build): Record<string, unknown> {
  const animations: Record<string, unknown> = {};
  for (const motion of Object.values(MOTION_BY_ID)) {
    animations[motion.id] = compileLottie(build, motion.id);
  }
  return {
    v: "5.12.2",
    generator: "Toonify",
    spec: build.spec,
    animations,
  };
}

export const lottieBytes = (anim: Record<string, unknown>) =>
  new TextEncoder().encode(JSON.stringify(anim)).byteLength;

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
