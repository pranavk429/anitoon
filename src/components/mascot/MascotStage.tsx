"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import clsx from "clsx";
import {
  buildMascot,
  type Build,
} from "@/lib/mascot/art";
import {
  MOTION_BY_ID,
  samplePose,
  type MotionId,
  type Pose,
} from "@/lib/mascot/animate";
import { applyMat, pathToD } from "@/lib/mascot/geometry";
import type { MascotSpec } from "@/lib/mascot/spec";
import { matrixString } from "@/lib/mascot/svg";

type Background = "paper" | "none" | "grid" | "halftone";

export type MascotStageProps = {
  spec: MascotSpec;
  build?: Build;
  motion?: MotionId;
  playing?: boolean;
  speed?: number;
  scrub?: number | null;
  loop?: boolean;
  showRig?: boolean;
  background?: Background;
  shadow?: boolean;
  className?: string;
  stageClassName?: string;
  onTime?: (time: number, duration: number) => void;
  respectReducedMotion?: boolean;
  resetKey?: number;
  ariaLabel?: string;
  style?: CSSProperties;
};

function initialPose(build: Build, motion: MotionId, time = 0): Pose {
  return samplePose(build, MOTION_BY_ID[motion], time, {
    blink: false,
    procedural: 1,
    time,
  });
}

export function MascotStage({
  spec,
  build: buildProp,
  motion = "idle",
  playing = true,
  speed = 1,
  scrub = null,
  loop = true,
  showRig = false,
  background = "paper",
  shadow = true,
  className,
  stageClassName,
  onTime,
  respectReducedMotion = false,
  resetKey = 0,
  ariaLabel,
  style,
}: MascotStageProps) {
  const specKey = useMemo(() => JSON.stringify(spec), [spec]);
  const build = useMemo(
    () => buildProp ?? buildMascot(JSON.parse(specKey) as MascotSpec),
    [buildProp, specKey],
  );
  const motionDef = MOTION_BY_ID[motion];
  const rigBones = useMemo(() => {
    const layerBones = new Set(build.layers.map((layer) => layer.bone));
    const parentOfLayer = new Set(
      build.bones
        .filter((bone) => layerBones.has(bone.id) && bone.parent)
        .map((bone) => bone.parent as string),
    );
    return build.bones.filter(
      (bone) =>
        bone.parent === null ||
        layerBones.has(bone.id) ||
        parentOfLayer.has(bone.id),
    );
  }, [build]);
  const startTime = scrub !== null ? scrub * motionDef.duration : 0;
  const pose = useMemo(
    () => initialPose(build, motion, startTime),
    [build, motion, startTime],
  );

  const layerRefs = useRef<Record<string, SVGGElement | null>>({});
  const rigRefs = useRef<{
    lines: Record<string, SVGLineElement | null>;
    joints: Record<string, SVGCircleElement | null>;
  }>({ lines: {}, joints: {} });
  const timeRef = useRef(startTime);
  const lastRef = useRef<number | null>(null);
  const onTimeRef = useRef(onTime);
  useEffect(() => {
    onTimeRef.current = onTime;
  }, [onTime]);

  const reducedRef = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = query.matches;
    const onChange = () => {
      reducedRef.current = query.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const paint = (p: Pose) => {
    for (const layer of build.layers) {
      const el = layerRefs.current[layer.bone];
      const m = p.matrices[layer.bone];
      if (el && m) el.setAttribute("transform", matrixString(m));
    }
    if (showRig) {
      for (const bone of rigBones) {
        const m = p.matrices[bone.id];
        if (!m) continue;
        const [x, y] = applyMat(m, [0, 0]);
        const joint = rigRefs.current.joints[bone.id];
        if (joint) {
          joint.setAttribute("cx", `${x}`);
          joint.setAttribute("cy", `${y}`);
        }
        const line = rigRefs.current.lines[bone.id];
        if (line && bone.parent) {
          const pm = p.matrices[bone.parent];
          if (pm) {
            const [px, py] = applyMat(pm, [0, 0]);
            line.setAttribute("x1", `${px}`);
            line.setAttribute("y1", `${py}`);
            line.setAttribute("x2", `${x}`);
            line.setAttribute("y2", `${y}`);
          }
        }
      }
    }
  };

  useEffect(() => {
    timeRef.current = startTime;
    lastRef.current = null;
    paint(initialPose(build, motion, startTime));
    onTimeRef.current?.(startTime, motionDef.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, motion]);

  useEffect(() => {
    if (resetKey === 0) return;
    timeRef.current = 0;
    lastRef.current = null;
    paint(initialPose(build, motion, 0));
    onTimeRef.current?.(0, motionDef.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (scrub !== null) {
      const t = Math.max(0, Math.min(1, scrub)) * motionDef.duration;
      timeRef.current = t;
      paint(initialPose(build, motion, t));
      onTimeRef.current?.(t, motionDef.duration);
      return;
    }
    if (!playing) {
      paint(initialPose(build, motion, timeRef.current));
      return;
    }
    if (respectReducedMotion && reducedRef.current) {
      paint(initialPose(build, motion, timeRef.current));
      return;
    }

    let raf = 0;
    lastRef.current = null;
    const tick = (now: number) => {
      if (lastRef.current === null) lastRef.current = now;
      const dt = Math.min(0.1, (now - lastRef.current) / 1000);
      lastRef.current = now;
      timeRef.current += dt * speed;

      if (!loop && timeRef.current >= motionDef.duration) {
        timeRef.current = motionDef.duration;
        paint(samplePose(build, motionDef, timeRef.current, { time: timeRef.current }));
        onTimeRef.current?.(timeRef.current, motionDef.duration);
        return;
      }
      const t = loop
        ? ((timeRef.current % motionDef.duration) + motionDef.duration) %
          motionDef.duration
        : timeRef.current;
      const next = samplePose(build, motionDef, t, {
        time: timeRef.current,
        blink: true,
      });
      paint(next);
      onTimeRef.current?.(t, motionDef.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, motion, playing, speed, loop, scrub, showRig, respectReducedMotion]);

  return (
    <div
      className={clsx("relative w-full select-none", className)}
      style={{ aspectRatio: `${build.stage.w} / ${build.stage.h}`, ...style }}
      data-mascot-stage=""
    >
      {background !== "none" && (
        <div
          aria-hidden="true"
          className={clsx(
            "absolute inset-0 overflow-hidden rounded-[inherit]",
            background === "paper" && "bg-white",
            background === "grid" && "bg-white grid-paper",
            background === "halftone" && "bg-white halftone",
          )}
        >
          <div
            className="absolute inset-x-0 border-t-2 border-ink/10"
            style={{ top: `${(build.stage.ground / build.stage.h) * 100}%` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-ink/[0.035]"
            style={{ top: `${(build.stage.ground / build.stage.h) * 100}%` }}
          />
        </div>
      )}
      <svg
        viewBox={`0 0 ${build.stage.w} ${build.stage.h}`}
        className={clsx("relative z-10 h-full w-full", stageClassName)}
        role="img"
        aria-label={
          ariaLabel ?? `${spec.name} the ${spec.species}, ${motionDef.name} animation`
        }
      >
        <title>{`${spec.name} the ${spec.species}`}</title>
        {shadow && (
          <g aria-hidden="true">
            <ellipse
              cx={build.stage.w / 2}
              cy={build.stage.ground + 4}
              rx="104"
              ry="14"
              fill="#17151C"
              opacity="0.12"
            />
            <ellipse
              cx={build.stage.w / 2}
              cy={build.stage.ground + 1}
              rx="70"
              ry="8"
              fill="#17151C"
              opacity="0.08"
            />
          </g>
        )}
        {build.layers.map((layer) => (
          <g
            key={layer.bone}
            ref={(el) => {
              layerRefs.current[layer.bone] = el;
            }}
            transform={matrixString(
              pose.matrices[layer.bone] ?? [1, 0, 0, 1, 0, 0],
            )}
          >
            {layer.shapes.map((shape, i) => (
              <path
                key={i}
                d={shape.d || pathToD(shape.path)}
                fill={shape.style.fill ?? "none"}
                stroke={shape.style.stroke}
                strokeWidth={shape.style.stroke ? shape.style.width ?? 4.5 : undefined}
                strokeLinecap={shape.style.cap}
                strokeLinejoin={shape.style.join}
                opacity={shape.style.opacity}
              />
            ))}
          </g>
        ))}
        {showRig && (
          <g aria-hidden="true" className="pointer-events-none">
            {rigBones.map((bone) => {
              const m = pose.matrices[bone.id];
              if (!m) return null;
              const [x, y] = applyMat(m, [0, 0]);
              const parent = bone.parent ? pose.matrices[bone.parent] : null;
              const [px, py] = parent ? applyMat(parent, [0, 0]) : [x, y];
              return (
                <g key={bone.id}>
                  <line
                    ref={(el) => {
                      rigRefs.current.lines[bone.id] = el;
                    }}
                    x1={px}
                    y1={py}
                    x2={x}
                    y2={y}
                    stroke="#FF5A45"
                    strokeWidth="1.6"
                    strokeDasharray="3 3"
                    opacity="0.95"
                  />
                  <circle
                    ref={(el) => {
                      rigRefs.current.joints[bone.id] = el;
                    }}
                    cx={x}
                    cy={y}
                    r={bone.parent === null ? 5.5 : 3.6}
                    fill={bone.parent === null ? "#2B4BF2" : "#FFFDF7"}
                    stroke="#17151C"
                    strokeWidth="1.6"
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}

export default MascotStage;
