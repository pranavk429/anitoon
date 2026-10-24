"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { buildMascot, type Build } from "@/lib/mascot/art";
import { MOTION_BY_ID, posterPose, type MotionId } from "@/lib/mascot/animate";
import { renderSvg } from "@/lib/mascot/svg";
import type { MascotSpec } from "@/lib/mascot/spec";

export function MascotThumb({
  spec,
  build: buildProp,
  motion = "idle",
  at = 0.4,
  shadow = "none",
  rig = false,
  className,
  alt,
}: {
  spec: MascotSpec;
  build?: Build;
  motion?: MotionId;
  at?: number;
  shadow?: "none" | "soft" | "hard";
  rig?: boolean;
  className?: string;
  alt?: string;
}) {
  const key = useMemo(() => JSON.stringify(spec), [spec]);
  const svg = useMemo(() => {
    const build = buildProp ?? buildMascot(JSON.parse(key) as MascotSpec);
    const pose = posterPose(build, MOTION_BY_ID[motion], at);
    return renderSvg(build, pose, {
      shadow,
      rig,
      title: alt ?? `${(JSON.parse(key) as MascotSpec).name}`,
    });
  }, [key, buildProp, motion, at, shadow, rig, alt]);

  return (
    <div
      className={clsx("aspect-[420/430] w-full [&>svg]:h-full [&>svg]:w-full", className)}
      role="img"
      aria-label={alt ?? `${spec.name} the ${spec.species}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MascotThumb;
