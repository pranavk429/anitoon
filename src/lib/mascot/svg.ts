import { buildMascot, restMatrices, type Build } from "./art";
import { MOTION_BY_ID, posterPose, type MotionId, type Pose } from "./animate";
import { multiply, pathToD, type Mat } from "./geometry";
import type { MascotSpec } from "./spec";

export type ShadowStyle = "none" | "soft" | "hard";
export type BackgroundStyle = "none" | "paper";

export type RenderOptions = {
  width?: number;
  height?: number;
  background?: BackgroundStyle;
  paper?: string;
  shadow?: ShadowStyle;
  title?: string;
  desc?: string;
  /** Extra class on the root svg element. */
  className?: string;
  /** Include data-bone attributes so the live stage can animate the DOM. */
  boneData?: boolean;
  /** Render the bone rig on top of the art. */
  rig?: boolean;
  /** Render inline (no XML declaration). */
  inline?: boolean;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const n = (value: number) => {
  const v = Math.round(value * 100) / 100;
  return Object.is(v, -0) ? "0" : `${v}`;
};

export function matrixString(m: Mat): string {
  const r = (n: number) => {
    const v = Math.round(n * 1000) / 1000;
    return Object.is(v, -0) ? "0" : `${v}`;
  };
  return `matrix(${r(m[0])} ${r(m[1])} ${r(m[2])} ${r(m[3])} ${r(m[4])} ${r(m[5])})`;
}

export function restPose(build: Build): Pose {
  const raw = restMatrices(build.bones);
  const matrices: Record<string, Mat> = {};
  for (const id of Object.keys(raw)) {
    matrices[id] = multiply(build.fit, raw[id]);
  }
  return { matrices, raw, global: [1, 0, 0, 1, 0, 0] };
}

function shadowMarkup(
  style: ShadowStyle,
  build: Build,
  paper: string,
): string {
  if (style === "none") return "";
  const { stage } = build;
  if (style === "hard") {
    return `<g aria-hidden="true"><ellipse cx="${stage.w / 2 + 6}" cy="${stage.ground + 5}" rx="106" ry="15" fill="${paper}" stroke="#17151C" stroke-width="3" opacity="0.55"/><ellipse cx="${stage.w / 2}" cy="${stage.ground + 2}" rx="100" ry="12" fill="#17151C" opacity="0.13"/></g>`;
  }
  return `<ellipse cx="${stage.w / 2}" cy="${stage.ground + 4}" rx="104" ry="14" fill="#17151C" opacity="0.12"/><ellipse cx="${stage.w / 2}" cy="${stage.ground + 1}" rx="70" ry="8" fill="#17151C" opacity="0.08"/>`;
}

export function renderSvg(
  build: Build,
  pose: Pose,
  opts: RenderOptions = {},
): string {
  const {
    width = build.stage.w,
    height = build.stage.h,
    background = "none",
    paper = build.palette.paper,
    shadow = "none",
    title,
    desc,
    className,
    boneData = true,
    rig = false,
    inline = true,
  } = opts;

  const parts: string[] = [];
  if (!inline) parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  const cls = className ? ` class="${esc(className)}"` : "";
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${build.stage.w} ${build.stage.h}" width="${width}" height="${height}"${cls} role="img" aria-label="${esc(title ?? `${build.spec.name} the ${build.spec.species}`)}">`,
  );
  if (title) parts.push(`<title>${esc(title)}</title>`);
  if (desc) parts.push(`<desc>${esc(desc)}</desc>`);
  if (background === "paper") {
    parts.push(
      `<rect width="${build.stage.w}" height="${build.stage.h}" fill="${paper}"/>`,
    );
  }
  parts.push(shadowMarkup(shadow, build, paper));

  for (const layer of build.layers) {
    const m = pose.matrices[layer.bone];
    if (!m) continue;
    const bone = boneData ? ` data-bone="${esc(layer.bone)}"` : "";
    parts.push(`<g${bone} transform="${matrixString(m)}">`);
    for (const s of layer.shapes) {
      const st = s.style;
      const d = s.d || pathToD(s.path);
      const attrs: string[] = [`d="${d}"`];
      if (st.fill) attrs.push(`fill="${esc(st.fill)}"`);
      else attrs.push('fill="none"');
      if (st.stroke) {
        attrs.push(`stroke="${esc(st.stroke)}"`);
        attrs.push(`stroke-width="${st.width ?? 4.5}"`);
        if (st.cap) attrs.push(`stroke-linecap="${st.cap}"`);
        if (st.join) attrs.push(`stroke-linejoin="${st.join}"`);
      }
      if (st.opacity !== undefined && st.opacity !== 1)
        attrs.push(`opacity="${st.opacity}"`);
      parts.push(`<path ${attrs.join(" ")}/>`);
    }
    parts.push("</g>");
  }
  if (rig) {
    parts.push('<g aria-hidden="true" pointer-events="none">');
    for (const bone of build.bones) {
      const m = pose.matrices[bone.id];
      if (!m) continue;
      const x = m[4];
      const y = m[5];
      const pm = bone.parent ? pose.matrices[bone.parent] : null;
      const px = pm ? pm[4] : x;
      const py = pm ? pm[5] : y;
      parts.push(
        `<line x1="${n(px)}" y1="${n(py)}" x2="${n(x)}" y2="${n(y)}" stroke="#FF5A45" stroke-width="1.6" stroke-dasharray="3 3"/>`,
      );
      parts.push(
        `<circle cx="${n(x)}" cy="${n(y)}" r="${bone.parent === null ? 5.5 : 3.6}" fill="${bone.parent === null ? "#2B4BF2" : "#FFFDF7"}" stroke="#17151C" stroke-width="1.6"/>`,
      );
    }
    parts.push("</g>");
  }
  parts.push("</svg>");
  return parts.join("");
}

export type StillOptions = RenderOptions & {
  motion?: MotionId;
  at?: number;
  blink?: boolean;
};

/** Convenience: build + poster pose + SVG in one call. */
export function renderStill(spec: MascotSpec, opts: StillOptions = {}): string {
  const build = buildMascot(spec);
  const motion = MOTION_BY_ID[opts.motion ?? "idle"];
  const pose = posterPose(build, motion, opts.at ?? 0.28);
  return renderSvg(build, pose, {
    shadow: "soft",
    ...opts,
    title:
      opts.title ??
      `${spec.name} — ${spec.tagline || `${spec.species} mascot`}`,
    desc:
      opts.desc ??
      `Vector ${spec.species} mascot generated with Toonify.`,
  });
}

export const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
