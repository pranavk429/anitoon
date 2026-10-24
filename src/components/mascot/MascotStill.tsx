import clsx from "clsx";
import { buildMascot, type Build } from "@/lib/mascot/art";
import { MOTION_BY_ID, posterPose, type MotionId } from "@/lib/mascot/animate";
import { renderSvg } from "@/lib/mascot/svg";
import type { MascotSpec } from "@/lib/mascot/spec";

export type MascotStillProps = {
  spec: MascotSpec;
  build?: Build;
  motion?: MotionId;
  at?: number;
  showRig?: boolean;
  shadow?: "none" | "soft" | "hard";
  background?: "none" | "paper";
  className?: string;
  svgClassName?: string;
  label?: string;
};

/**
 * Deterministic poster frame. Safe in server components, so landing-page cards
 * and the gallery render with zero client JavaScript.
 */
export function MascotStill({
  spec,
  build: buildProp,
  motion = "idle",
  at = 0.28,
  showRig = false,
  shadow = "soft",
  background = "none",
  className,
  svgClassName = "h-full w-full",
  label,
}: MascotStillProps) {
  const build = buildProp ?? buildMascot(spec);
  const pose = posterPose(build, MOTION_BY_ID[motion], at);
  const svg = renderSvg(build, pose, {
    background,
    paper: build.palette.paper,
    shadow,
    rig: showRig,
    className: svgClassName,
    title: label ?? `${spec.name} the ${spec.species}`,
    desc: `Vector ${spec.species} mascot by Toonify.`,
  });
  return (
    <div
      className={clsx("aspect-[420/430] w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MascotStill;
