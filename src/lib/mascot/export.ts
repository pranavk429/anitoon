import JSZip from "jszip";
import { buildMascot, type Build } from "./art";
import { MOTION_BY_ID, posterPose, type MotionId } from "./animate";
import { compileLottie, formatBytes, lottieBytes } from "./lottie";
import { renderSvg, renderStill } from "./svg";
import type { MascotSpec } from "./spec";

export type PngOptions = {
  size?: number;
  background?: "paper" | "transparent";
  motion?: MotionId;
  at?: number;
};

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "mascot";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function svgFor(build: Build, motionId: MotionId = "idle") {
  const motion = MOTION_BY_ID[motionId];
  return renderSvg(build, posterPose(build, motion, 0.28), {
    background: "paper",
    paper: build.palette.paper,
    shadow: "soft",
    width: 1024,
    height: 1048,
    title: `${build.spec.name} — ${build.spec.tagline}`,
    desc: `Vector ${build.spec.species} mascot by Toonify.`,
  });
}

export function downloadSvg(spec: MascotSpec, motionId: MotionId = "idle") {
  const build = buildMascot(spec);
  const svg = svgFor(build, motionId);
  downloadBlob(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    `${safeName(spec.name)}-${motionId}.svg`,
  );
  return svg.length;
}

export function downloadLottie(spec: MascotSpec, motionId: MotionId = "wave") {
  const build = buildMascot(spec);
  const animation = compileLottie(build, motionId);
  const json = JSON.stringify(animation);
  downloadBlob(
    new Blob([json], { type: "application/json" }),
    `${safeName(spec.name)}-${motionId}.json`,
  );
  return json.length;
}

export function pngSvg(build: Build, opts: PngOptions = {}): string {
  const motion = MOTION_BY_ID[opts.motion ?? "idle"];
  return renderSvg(build, posterPose(build, motion, opts.at ?? 0.28), {
    background: "paper",
    paper: build.palette.paper,
    shadow: "soft",
    width: opts.size ?? 1024,
    height: opts.size ?? 1024,
  });
}

export async function pngBlob(
  build: Build,
  opts: PngOptions = {},
): Promise<Blob> {
  const size = opts.size ?? 1024;
  const svg = renderSvg(build, posterPose(build, MOTION_BY_ID[opts.motion ?? "idle"], opts.at ?? 0.28), {
    background: opts.background === "transparent" ? "none" : "paper",
    paper: build.palette.paper,
    shadow: opts.background === "transparent" ? "none" : "soft",
    width: size,
    height: size,
  });
  const src = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("PNG render failed"));
      img.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    if (opts.background !== "transparent") {
      ctx.fillStyle = build.palette.paper;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG encoding failed")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(src);
  }
}

export async function downloadPng(spec: MascotSpec, opts: PngOptions = {}) {
  const build = buildMascot(spec);
  const blob = await pngBlob(build, opts);
  downloadBlob(blob, `${safeName(spec.name)}-${opts.size ?? 1024}.png`);
  return blob.size;
}

export function embedSnippet(spec: MascotSpec, origin: string, code: string) {
  return `<!-- ${spec.name} by Toonify · no dependencies, no image credits -->
<iframe
  src="${origin}/m/${code}?embed=1"
  title="${spec.name} the ${spec.species}"
  width="420" height="430" loading="lazy"
  style="border:0;max-width:100%;background:transparent"
  allow="fullscreen"
></iframe>`;
}

export function reactSnippet(spec: MascotSpec) {
  return `import { Mascot } from "./Mascot";

export function Hero() {
  return <Mascot size={320} title="${spec.name}" />;
}`;
}

function sdkReadme(spec: MascotSpec, motionId: MotionId) {
  const motion = MOTION_BY_ID[motionId];
  return `# ${spec.name} — mascot SDK

A layered vector ${spec.species} with a real bone rig, exported by Toonify.
Everything here is yours: no attribution, no runtime service, no image credits.

## What's inside

- \`mascot.svg\` — the vector still (${spec.species}, poster pose)
- \`mascot.png\` — 1024×1024 transparent-ready raster
- \`mascot.json\` — Lottie animation: **${motion.name}** (${motion.duration}s, 30fps)
- \`Mascot.tsx\` — dependency-free React component
- \`preview.html\` — open in a browser to see the motion

## React

\`\`\`tsx
import { Mascot } from "./Mascot";

<Mascot size={320} title="${spec.name}" />
\`\`\`

## Lottie

\`\`\`js
import lottie from "lottie-web";
import animationData from "./mascot.json";

lottie.loadAnimation({
  container: document.getElementById("mascot"),
  renderer: "svg",
  loop: ${motion.loop},
  autoplay: true,
  animationData,
});
\`\`\`

## Spec

\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\`

Move: ${motion.name} — ${motion.blurb}
Built for the WeMakeDevs × Wispr Flow challenge (Track 2: No-Code).
`;
}

function sdkComponent(spec: MascotSpec, svg: string) {
  return `"use client";

import * as React from "react";

export const MASCOT_SVG = ${JSON.stringify(svg)};

type MascotProps = {
  size?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
};

/** Dependency-free SVG mascot. Replace MASCOT_SVG with any Toonify export. */
export function Mascot({
  size = 320,
  className,
  title = ${JSON.stringify(`${spec.name} the ${spec.species}`)},
  style,
}: MascotProps) {
  const markup = React.useMemo(
    () => MASCOT_SVG.replace('width="1024"', \`width="\${size}"\`).replace(
      'height="1048"',
      \`height="\${Math.round((size * 1048) / 1024)}"\`,
    ),
    [size],
  );
  return (
    <span
      role="img"
      aria-label={title}
      className={className}
      style={{ display: "inline-block", lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export default Mascot;
`;
}

function previewHtml(spec: MascotSpec, motionId: MotionId, animation: unknown) {
  const motion = MOTION_BY_ID[motionId];
  const data = JSON.stringify(animation).replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${spec.name} · ${motion.name} · Toonify</title>
<style>
  html,body{height:100%}
  body{margin:0;display:grid;place-items:center;background:#F6EFDF;color:#17151C;font-family:ui-sans-serif,system-ui,sans-serif}
  main{display:grid;justify-items:center;gap:16px;padding:24px}
  #mascot{width:min(80vw,420px);aspect-ratio:420/430;filter:drop-shadow(6px 6px 0 rgba(23,21,28,.14))}
  h1{font-size:20px;margin:0;letter-spacing:-.02em}
  p{margin:0;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;opacity:.55}
  footer{position:fixed;bottom:14px;font:10px ui-monospace,monospace;letter-spacing:.14em;opacity:.45;text-transform:uppercase}
</style>
</head>
<body>
<main>
  <div id="mascot" aria-label="${spec.name} the ${spec.species}"></div>
  <h1>${spec.name}</h1>
  <p>${motion.name} · ${motion.duration}s · 30fps · vector</p>
</main>
<footer>Made with Toonify · Toonify SDK</footer>
<script src="https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js"></script>
<script>
  const animationData = ${data};
  lottie.loadAnimation({
    container: document.getElementById("mascot"),
    renderer: "svg",
    loop: ${motion.loop},
    autoplay: true,
    animationData,
  });
</script>
</body>
</html>`;
}

export type SdkBundle = {
  blob: Blob;
  bytes: number;
  files: string[];
};

export async function buildSdkZip(
  spec: MascotSpec,
  motionId: MotionId = "wave",
): Promise<SdkBundle> {
  const build = buildMascot(spec);
  const motion = MOTION_BY_ID[motionId];
  const animation = compileLottie(build, motionId);
  const json = JSON.stringify(animation);
  const svg = svgFor(build, motionId);
  const png = await pngBlob(build, {
    size: 1024,
    background: "transparent",
    motion: motionId,
  });
  const zip = new JSZip();
  const slug = safeName(spec.name);
  const folder = zip.folder(slug) ?? zip;
  folder.file("mascot.json", json);
  folder.file("mascot.svg", svg);
  folder.file("mascot.png", png);
  folder.file("Mascot.tsx", sdkComponent(spec, svg));
  folder.file("README.md", sdkReadme(spec, motionId));
  folder.file("preview.html", previewHtml(spec, motionId, animation));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return {
    blob,
    bytes: blob.size,
    files: [
      `${slug}/mascot.json`,
      `${slug}/mascot.svg`,
      `${slug}/mascot.png`,
      `${slug}/Mascot.tsx`,
      `${slug}/README.md`,
      `${slug}/preview.html`,
    ],
  };
}

export function downloadSdk(bundle: SdkBundle, spec: MascotSpec) {
  downloadBlob(bundle.blob, `${safeName(spec.name)}-sdk.zip`);
}

export function sizeReport(spec: MascotSpec, motionId: MotionId = "wave") {
  const build = buildMascot(spec);
  const lottie = compileLottie(build, motionId);
  const svg = svgFor(build, motionId);
  return {
    lottie: lottieBytes(lottie),
    lottieLabel: formatBytes(lottieBytes(lottie)),
    svg: new TextEncoder().encode(svg).byteLength,
    svgLabel: formatBytes(new TextEncoder().encode(svg).byteLength),
    layerCount: build.layers.length,
    boneCount: build.bones.length,
    motion,
  };
}

export { formatBytes, lottieBytes };
