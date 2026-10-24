"use client";
/* eslint-disable react-hooks/immutability -- R3F and AnimationMixer are imperative by design. */

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import {
  EXPRESSIONS_3D,
  MODEL_URL,
  type Expression3D,
  type Motion3DId,
} from "@/lib/three/mascot3d";
import type { ExpressionId } from "@/lib/mascot/spec";

const damp = THREE.MathUtils.damp;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const EXPRESSION_KEYS = ["smile", "grin", "o", "smirk", "flat"] as const;

type StagePart = THREE.Object3D | null;

type ModelParts = {
  root: THREE.Group;
  head: StagePart;
  neck: StagePart;
  rootBone: StagePart;
  earL: StagePart;
  earR: StagePart;
  tailTip: StagePart;
  eyeL: StagePart;
  eyeR: StagePart;
  irisL: StagePart;
  irisR: StagePart;
  browL: StagePart;
  browR: StagePart;
  blinkL: StagePart;
  blinkR: StagePart;
  mouth: THREE.Mesh | null;
  blush: THREE.MeshStandardMaterial | null;
  base: {
    eyeL: THREE.Vector3;
    eyeR: THREE.Vector3;
    irisL: THREE.Vector3;
    irisR: THREE.Vector3;
    browL: { position: THREE.Vector3; rotation: THREE.Euler };
    browR: { position: THREE.Vector3; rotation: THREE.Euler };
  };
};

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildParts(source: THREE.Group): ModelParts {
  const root = SkeletonUtils.clone(source) as THREE.Group;
  const byName = new Map<string, THREE.Object3D>();
  const all: THREE.Object3D[] = [];
  root.traverse((object) => {
    all.push(object);
    if (object.name) byName.set(normalizeName(object.name), object);
  });
  const find = (...names: string[]): THREE.Object3D | null => {
    for (const name of names) {
      const hit = byName.get(normalizeName(name));
      if (hit) return hit;
    }
    for (const name of names) {
      const needle = normalizeName(name);
      const hit = all.find((object) =>
        normalizeName(object.name).includes(needle),
      );
      if (hit) return hit;
    }
    return null;
  };

  const materialMap = new Map<string, THREE.Material>();
  const cloneMaterial = (material: THREE.Material): THREE.Material => {
    const key = material.uuid;
    const cached = materialMap.get(key);
    if (cached) return cached;
    const next = material.clone();
    materialMap.set(key, next);
    return next;
  };

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = mesh.name;
    mesh.castShadow = !/highlight|blush|blink|eyerim|eyewhite|iris|pupil|charm|whisker|lash|mouth/i.test(
      name,
    );
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    if (mesh.material) {
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => cloneMaterial(material))
        : cloneMaterial(mesh.material);
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMapIntensity = 0.75;
      }
      if (
        material instanceof THREE.MeshStandardMaterial &&
        /fur|cream/i.test(material.name)
      ) {
        material.roughness = Math.min(1, material.roughness + 0.04);
        material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `
            float anitoonRim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
            gl_FragColor.rgb += vec3(1.0, 0.69, 0.42) * anitoonRim * 0.075;
            #include <dithering_fragment>`,
          );
        };
        material.customProgramCacheKey = () => "anitoon-plush-rim-v1";
        material.needsUpdate = true;
      }
    }
  });

  const mouth =
    (find("Mochi_Mouth", "mouth") as THREE.Mesh | null) ?? null;
  const blushMaterials: THREE.MeshStandardMaterial[] = [];
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (
        material instanceof THREE.MeshStandardMaterial &&
        /blush/i.test(material.name)
      ) {
        blushMaterials.push(material);
      }
    }
  });
  const blush = blushMaterials[0] ?? null;
  if (blush) {
    blush.transparent = true;
    blush.depthWrite = false;
    blush.opacity = 0.45;
  }

  const eyeL = find("Eye_L", "Eye_L.001", "EyeL", "Eye.L");
  const eyeR = find("Eye_R", "EyeR", "Eye.R");
  const irisL = find("Iris_L", "IrisL", "Iris.L");
  const irisR = find("Iris_R", "IrisR", "Iris.R");
  const browL = find("Brow_L", "BrowL", "Brow.L");
  const browR = find("Brow_R", "BrowR", "Brow.R");
  const blinkL = find("Blink_L", "BlinkL", "Blink.L");
  const blinkR = find("Blink_R", "BlinkR", "Blink.R");

  return {
    root,
    head: find("head", "HeadBone"),
    neck: find("neck"),
    rootBone: find("root"),
    earL: find("ear_L", "earL", "ear.L"),
    earR: find("ear_R", "earR", "ear.R"),
    tailTip: find("tail3"),
    eyeL,
    eyeR,
    irisL,
    irisR,
    browL,
    browR,
    blinkL,
    blinkR,
    mouth,
    blush,
    base: {
      eyeL: eyeL?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      eyeR: eyeR?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      irisL: irisL?.position.clone() ?? new THREE.Vector3(),
      irisR: irisR?.position.clone() ?? new THREE.Vector3(),
      browL: {
        position: browL?.position.clone() ?? new THREE.Vector3(),
        rotation: browL?.rotation.clone() ?? new THREE.Euler(),
      },
      browR: {
        position: browR?.position.clone() ?? new THREE.Vector3(),
        rotation: browR?.rotation.clone() ?? new THREE.Euler(),
      },
    },
  };
}

type SceneProps = {
  move: Motion3DId;
  expression: ExpressionId;
  playing: boolean;
  speed: number;
  scrub: number | null;
  showSkeleton: boolean;
  reducedMotion: boolean;
  active: boolean;
  onTime?: (time: number, duration: number) => void;
  onReady?: () => void;
};

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.95;
    camera.position.set(portrait ? 1.55 : 1.85, portrait ? 1.36 : 1.32, portrait ? 5.15 : 4.45);
    camera.lookAt(0, 1.0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function MascotScene({
  move,
  expression,
  playing,
  speed,
  scrub,
  showSkeleton,
  reducedMotion,
  active,
  onTime,
  onReady,
}: SceneProps) {
  const gltf = useGLTF(MODEL_URL, false, true);
  const parts = useMemo(() => buildParts(gltf.scene), [gltf.scene]);
  const { actions, mixer } = useAnimations(gltf.animations, parts.root);
  const current = useRef<THREE.AnimationAction | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkRequest = useRef(0);
  const timeReport = useRef(0);
  const readySent = useRef(false);
  const { pointer } = useThree();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const exprRef = useRef<Expression3D>(EXPRESSIONS_3D[expression]);
  const baseQ = useRef({
    ready: false,
    head: new THREE.Quaternion(),
    neck: new THREE.Quaternion(),
    earL: new THREE.Quaternion(),
    earR: new THREE.Quaternion(),
    tail: new THREE.Quaternion(),
  });
  const state = useRef({
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    gazeX: 0,
    gazeY: 0,
    mouth: [1, 0, 0, 0, 0],
    blush: EXPRESSIONS_3D[expression].blush,
    ear: EXPRESSIONS_3D[expression].ear,
    tail: EXPRESSIONS_3D[expression].tail,
    blinkStart: -10,
    nextBlink: 2.4,
    double: false,
    didDouble: false,
    pointerX: 0,
    pointerY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
    lastBlink: -10,
    shadowScale: 1,
    shadowOpacity: 0.28,
  });

  // switch clips with a soft, filmic crossfade
  useEffect(() => {
    const action = actions[move] ?? actions.idle;
    if (!action) return;
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.setEffectiveWeight(1);
    action.play();
    const previous = current.current;
    if (previous && previous !== action) {
      previous.fadeOut(0.22);
      action.fadeIn(0.22);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => {
        previous.stop();
      }, 320);
    } else {
      action.fadeIn(0.4);
    }
    current.current = action;
    blinkRequest.current += 1;
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [actions, move]);

  useEffect(() => {
    exprRef.current = EXPRESSIONS_3D[expression];
    blinkRequest.current += 1;
  }, [expression]);

  useEffect(() => {
    if (!mixer) return;
    mixer.timeScale = playing ? speed : 0;
  }, [mixer, playing, speed]);

  useEffect(() => {
    if (readySent.current) return;
    readySent.current = true;
    const raf = requestAnimationFrame(() => onReady?.());
    return () => {
      readySent.current = false;
      cancelAnimationFrame(raf);
    };
  }, [onReady]);

  useEffect(() => {
    if (!active) {
      // keep the skeleton clean when the stage is offscreen
      mixer?.update(0);
    }
  }, [active, mixer]);

  const helper = useMemo(() => {
    const skeleton = new THREE.SkeletonHelper(parts.root);
    const material = new THREE.LineBasicMaterial({
      color: "#ff5a45",
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    skeleton.material = material;
    skeleton.renderOrder = 20;
    skeleton.visible = false;
    return skeleton;
  }, [parts.root]);

  useEffect(() => {
    helper.visible = showSkeleton;
  }, [helper, showSkeleton]);

  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpEuler = useMemo(() => new THREE.Euler(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
      gradient.addColorStop(0, "rgba(42,29,18,0.55)");
      gradient.addColorStop(0.5, "rgba(42,29,18,0.24)");
      gradient.addColorStop(1, "rgba(42,29,18,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const shadowRef = useRef<THREE.Mesh>(null);

  useFrame((rootState, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    const now = rootState.clock.elapsedTime;
    const expr = exprRef.current;
    const s = state.current;
    const bases = baseQ.current;

    // undo the previous frame's procedural puppet layer before the mixer
    // writes the clean clip pose (mixer.update(0) is not guaranteed to reset
    // bones when paused or scrubbed).
    if (bases.ready) {
      parts.head?.quaternion.copy(bases.head);
      parts.neck?.quaternion.copy(bases.neck);
      parts.earL?.quaternion.copy(bases.earL);
      parts.earR?.quaternion.copy(bases.earR);
      parts.tailTip?.quaternion.copy(bases.tail);
    }

    if (mixer) {
      if (scrub !== null && current.current) {
        mixer.timeScale = 0;
        current.current.time = scrub;
        mixer.update(0);
      } else if (playing) {
        mixer.timeScale = speed;
        mixer.update(delta);
      } else {
        mixer.update(0);
      }
    }

    if (bases.ready) {
      if (parts.head) bases.head.copy(parts.head.quaternion);
      if (parts.neck) bases.neck.copy(parts.neck.quaternion);
      if (parts.earL) bases.earL.copy(parts.earL.quaternion);
      if (parts.earR) bases.earR.copy(parts.earR.quaternion);
      if (parts.tailTip) bases.tail.copy(parts.tailTip.quaternion);
    } else {
      if (parts.head) bases.head.copy(parts.head.quaternion);
      if (parts.neck) bases.neck.copy(parts.neck.quaternion);
      if (parts.earL) bases.earL.copy(parts.earL.quaternion);
      if (parts.earR) bases.earR.copy(parts.earR.quaternion);
      if (parts.tailTip) bases.tail.copy(parts.tailTip.quaternion);
      bases.ready = true;
    }

    if (current.current && onTime) {
      if (now - timeReport.current > 0.09) {
        timeReport.current = now;
        onTime(current.current.time, current.current.getClip().duration);
      }
    }

    // pointer → head and eye attention, with micro saccades and a soft hold
    const px = reducedMotion ? 0 : THREE.MathUtils.clamp(pointer.x, -1, 1);
    const py = reducedMotion ? 0 : THREE.MathUtils.clamp(pointer.y, -1, 1);
    const pointerSpeed =
      Math.hypot(px - s.lastPointerX, py - s.lastPointerY) /
      Math.max(0.016, now - s.lastPointerTime);
    if (
      !reducedMotion &&
      pointerSpeed > 2.6 &&
      now - s.lastBlink > 1.15 &&
      now - s.blinkStart > 0.5
    ) {
      s.blinkStart = now;
      s.lastBlink = now;
      s.didDouble = false;
      s.double = Math.random() < 0.22;
    }
    s.lastPointerX = px;
    s.lastPointerY = py;
    s.lastPointerTime = now;
    s.pointerX = px;
    s.pointerY = py;

    const targetYaw = px * 0.17 + expr.head.yaw;
    const targetPitch = -py * 0.085 + expr.head.pitch;
    const targetRoll = expr.head.roll + px * 0.018;
    s.headYaw = damp(s.headYaw, targetYaw, 5.5, delta);
    s.headPitch = damp(s.headPitch, targetPitch, 5.5, delta);
    s.headRoll = damp(s.headRoll, targetRoll, 4.5, delta);
    if (parts.head) {
      tmpEuler.set(s.headPitch, s.headYaw, s.headRoll, "YXZ");
      parts.head.quaternion.multiply(tmpQuat.setFromEuler(tmpEuler));
    }
    if (parts.neck) {
      tmpEuler.set(s.headPitch * 0.24, s.headYaw * 0.28, s.headRoll * 0.2, "YXZ");
      parts.neck.quaternion.multiply(tmpQuat.setFromEuler(tmpEuler));
    }
    if (parts.earL) {
      tmpEuler.set(expr.ear * 0.7, 0, expr.ear * 0.45, "XYZ");
      parts.earL.quaternion.multiply(tmpQuat.setFromEuler(tmpEuler));
    }
    if (parts.earR) {
      tmpEuler.set(expr.ear * 0.7, 0, -expr.ear * 0.45, "XYZ");
      parts.earR.quaternion.multiply(tmpQuat.setFromEuler(tmpEuler));
    }
    if (parts.tailTip && !reducedMotion) {
      const energy = expr.tail;
      tmpEuler.set(0, 0, Math.sin(now * 5.2) * 0.055 * energy, "XYZ");
      parts.tailTip.quaternion.multiply(tmpQuat.setFromEuler(tmpEuler));
    }

    // blink state machine: ~110ms close, 40ms hold, 190ms open
    if (blinkRequest.current > 0 && now - s.blinkStart > 0.45) {
      blinkRequest.current = 0;
      s.blinkStart = now;
      s.lastBlink = now;
      s.didDouble = false;
      s.double = Math.random() < 0.18;
    }
    if (now > s.nextBlink && now - s.blinkStart > 0.5) {
      s.blinkStart = now;
      s.lastBlink = now;
      s.nextBlink = now + 3.2 + Math.random() * 2.2;
      s.didDouble = false;
      s.double = Math.random() < 0.24;
    }
    const bt = now - s.blinkStart;
    const close = 0.105;
    const hold = 0.045;
    const open = 0.19;
    let blinkScale = 1;
    if (bt < close) blinkScale = 1 - 0.95 * smoothstep(0, close, bt);
    else if (bt < close + hold) blinkScale = 0.05;
    else if (bt < close + hold + open)
      blinkScale = 0.05 + 0.95 * smoothstep(close + hold, close + hold + open, bt);
    if (
      s.double &&
      !s.didDouble &&
      bt > close + hold + open + 0.12 &&
      bt < 0.9
    ) {
      s.didDouble = true;
      s.blinkStart = now;
      s.lastBlink = now;
    }

    const winkR = expr.wink === "R";
    const winkL = expr.wink === "L";
    const targetEyeL = Math.min(expr.eyeOpen, winkL ? 0.08 : blinkScale);
    const targetEyeR = Math.min(expr.eyeOpen, winkR ? 0.08 : blinkScale);
    if (parts.eyeL) {
      parts.eyeL.scale.set(parts.base.eyeL.x, targetEyeL, parts.base.eyeL.z);
    }
    if (parts.eyeR) {
      parts.eyeR.scale.set(parts.base.eyeR.x, targetEyeR, parts.base.eyeR.z);
    }

    const lineVisibleL = winkL || (targetEyeL < 0.3 && expr.eyeOpen > 0.5);
    const lineVisibleR = winkR || (targetEyeR < 0.3 && expr.eyeOpen > 0.5);
    if (parts.blinkL) {
      parts.blinkL.visible = lineVisibleL;
      parts.blinkL.scale.setScalar(lineVisibleL ? 1 : 0.001);
    }
    if (parts.blinkR) {
      parts.blinkR.visible = lineVisibleR;
      parts.blinkR.scale.setScalar(lineVisibleR ? 1 : 0.001);
    }

    const gazeBaseX = expr.gaze[0] + px * 0.013;
    const gazeBaseY = expr.gaze[1] + py * 0.009;
    s.gazeX = damp(s.gazeX, gazeBaseX, 4.4, delta);
    s.gazeY = damp(s.gazeY, gazeBaseY, 4.4, delta);
    if (parts.irisL) {
      parts.irisL.position.set(
        parts.base.irisL.x + s.gazeX,
        parts.base.irisL.y + s.gazeY,
        parts.base.irisL.z,
      );
      parts.irisL.scale.setScalar(damp(parts.irisL.scale.x, expr.irisScale, 6, delta));
    }
    if (parts.irisR) {
      parts.irisR.position.set(
        parts.base.irisR.x + s.gazeX,
        parts.base.irisR.y + s.gazeY,
        parts.base.irisR.z,
      );
      parts.irisR.scale.setScalar(damp(parts.irisR.scale.x, expr.irisScale, 6, delta));
    }

    // brows: a tiny world-space puppet layer on top of the baked acting
    if (parts.browL && parts.browR) {
      const asym = expr.browAsym;
      parts.browL.position.copy(parts.base.browL.position);
      parts.browL.position.y += expr.browRaise + asym;
      parts.browL.rotation.set(
        parts.base.browL.rotation.x,
        parts.base.browL.rotation.y,
        parts.base.browL.rotation.z + expr.browTilt,
      );
      parts.browR.position.copy(parts.base.browR.position);
      parts.browR.position.y += expr.browRaise;
      parts.browR.rotation.set(
        parts.base.browR.rotation.x,
        parts.base.browR.rotation.y,
        parts.base.browR.rotation.z - expr.browTilt,
      );
    }

    if (parts.mouth?.morphTargetInfluences && parts.mouth.morphTargetDictionary) {
      const dict = parts.mouth.morphTargetDictionary;
      EXPRESSION_KEYS.forEach((key, index) => {
        const target = expr.mouth[key] ?? 0;
        const currentValue = s.mouth[index] ?? 0;
        s.mouth[index] = damp(currentValue, target, 8, delta);
        const idx = dict[key];
        if (idx !== undefined) {
          parts.mouth!.morphTargetInfluences![idx] = s.mouth[index];
        }
      });
    }

    if (parts.blush) {
      s.blush = damp(s.blush, expr.blush, 5, delta);
      parts.blush.opacity = s.blush;
    }

    // floor shadow: stays on the ground, softens and spreads with height
    if (parts.rootBone && shadowRef.current) {
      parts.rootBone.getWorldPosition(tmpVec);
      const lift = Math.max(0, tmpVec.y - 0.03);
      const targetScale = 1 + lift * 0.55;
      const targetOpacity = 0.32 / (1 + lift * 1.8);
      s.shadowScale = damp(s.shadowScale, targetScale, 8, delta);
      s.shadowOpacity = damp(s.shadowOpacity, targetOpacity, 8, delta);
      shadowRef.current.scale.setScalar(s.shadowScale);
      const material = shadowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = s.shadowOpacity;
    }
  });

  return (
    <group>
      <CameraRig />
      <group position={[0, 0.009, 0]}>
        <primitive object={parts.root} />
        <primitive object={helper} />
      </group>

      <group position={[0, 0, 0]}>
        <mesh
          receiveShadow
          castShadow={false}
          position={[0, -0.045, 0]}
        >
          <cylinderGeometry args={[1.22, 1.27, 0.09, 80]} />
          <meshStandardMaterial color="#e7dcc9" roughness={0.92} metalness={0} />
        </mesh>
        <mesh receiveShadow position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.208, 80]} />
          <meshStandardMaterial color="#f4ead7" roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.155, 1.19, 96]} />
          <meshBasicMaterial color="#c8bba4" transparent opacity={0.65} />
        </mesh>
        <mesh
          ref={shadowRef}
          position={[0, 0.012, 0.02]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
        >
          <planeGeometry args={[1.9, 1.5]} />
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.3}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {!isMobile && (
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.32}
          scale={3}
          blur={2.6}
          far={2.2}
          resolution={512}
          color="#3b2a1d"
          frames={Infinity}
        />
      )}

      <ambientLight intensity={0.36} color="#fff4e3" />
      <hemisphereLight args={["#fff4df", "#c7bda9", 0.5]} />
      <directionalLight
        castShadow
        position={[-3.4, 4.5, 3.6]}
        intensity={2.5}
        color="#fff0d8"
        shadow-mapSize={[isMobile ? 512 : 1024, isMobile ? 512 : 1024]}
        shadow-bias={-0.0002}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.6, 2.6, 2.8, -2.2, 0.1, 12]} />
      </directionalLight>
      <directionalLight
        position={[4.2, 2.6, 2.4]}
        intensity={0.95}
        color="#cfdcff"
      />
      <spotLight
        position={[0.3, 3.5, -3.2]}
        intensity={22}
        angle={0.7}
        penumbra={1}
        color="#ffd9b4"
        distance={12}
      />

      <Environment frames={1} resolution={isMobile ? 64 : 128}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff2de"
          position={[-4, 4, 3]}
          scale={[7, 6, 1]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#bed1ff"
          position={[4, 2.4, 2]}
          scale={[4, 5, 1]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#ffcfa6"
          position={[0, 4, -4]}
          scale={[6, 4, 1]}
          target={[0, 1, 0]}
        />
      </Environment>

      <OrbitControls
        makeDefault
        target={[0, 1.0, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        minDistance={3.2}
        maxDistance={6.2}
        minPolarAngle={0.95}
        maxPolarAngle={1.53}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.95}
      />
    </group>
  );
}

function StageLoader() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#efece4]/75 backdrop-blur-[2px]">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#fefdf9] shadow-sm">
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#4b63ff]" />
        <span className="absolute h-2.5 w-2.5 rounded-full bg-[#4b63ff]" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f6759]">
        Lighting the 3D stage
      </p>
    </div>
  );
}

class StageErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#efece4]/85 px-6 text-center">
          <p className="font-display text-xl font-extrabold text-[#111111]">
            The 3D stage could not load.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6f6759]">
            The 2D vector studio and exports are still available.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export type MascotThreeStageProps = {
  move?: Motion3DId;
  expression?: ExpressionId;
  playing?: boolean;
  speed?: number;
  scrub?: number | null;
  showSkeleton?: boolean;
  reducedMotion?: boolean;
  active?: boolean;
  className?: string;
  onTime?: (time: number, duration: number) => void;
  onReady?: () => void;
  onError?: () => void;
};

export function MascotThreeStage({
  move = "idle",
  expression = "happy",
  playing = true,
  speed = 1,
  scrub = null,
  showSkeleton = false,
  reducedMotion = false,
  active = true,
  className,
  onTime,
  onReady,
  onError,
}: MascotThreeStageProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <StageErrorBoundary
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      >
        <Canvas
          shadows
          dpr={[1, 1.75]}
          frameloop={active && !failed ? "always" : "never"}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [1.85, 1.32, 4.45], fov: 33, near: 0.1, far: 30 }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
            gl.shadowMap.type = THREE.PCFShadowMap;
            gl.setClearColor(0x000000, 0);
            scene.background = null;
          }}
        >
          <Suspense fallback={null}>
            <MascotScene
              move={move}
              expression={expression}
              playing={playing}
              speed={speed}
              scrub={scrub}
              showSkeleton={showSkeleton}
              reducedMotion={reducedMotion}
              active={active}
              onTime={onTime}
              onReady={() => {
                setReady(true);
                onReady?.();
              }}
            />
          </Suspense>
        </Canvas>
      </StageErrorBoundary>
      {!ready && !failed && <StageLoader />}
    </div>
  );
}
