import {
  ellipse,
  mapPath,
  multiply,
  pathToD,
  polyline,
  roundRect,
  smooth,
  compose,
  matRotate,
  matScale,
  matTranslate,
  applyMat,
  pathPoints,
  type Mat,
  type Path,
  type Vec,
} from "./geometry";
import { derivePalette, type MascotSpec, type Palette, type SpeciesId } from "./spec";

export type ShapeStyle = {
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
  cap?: "round" | "butt" | "square";
  join?: "round" | "miter" | "bevel";
};

export type Shape = {
  path: Path;
  d: string;
  style: ShapeStyle;
};

export type Layer = {
  bone: string;
  z: number;
  shapes: Shape[];
};

export type Bone = {
  id: string;
  parent: string | null;
  x: number;
  y: number;
  rot?: number;
  sx?: number;
  sy?: number;
  /** Keep this bone's shape un-squashed when the torso squashes. */
  counterParentScale?: boolean;
};

export type Build = {
  spec: MascotSpec;
  palette: Palette;
  bones: Bone[];
  byId: Record<string, Bone>;
  layers: Layer[];
  fit: Mat;
  bounds: { x: number; y: number; w: number; h: number };
  stage: { w: number; h: number; ground: number };
};

const STAGE = { w: 420, h: 430, ground: 380 };
const FIT_BOX = { w: 386, h: 312, bottom: 372, cx: 210 };

/* ------------------------------------------------------------------ */
/* Species config                                                      */
/* ------------------------------------------------------------------ */

const EYE_POS: Record<SpeciesId, Vec> = {
  cat: [31, -78],
  dog: [30, -74],
  fox: [30, -78],
  bear: [29, -76],
  bunny: [31, -76],
  frog: [35, -80],
  robot: [34, -78],
  blob: [29, -74],
};

const EAR_POS: Record<SpeciesId, Vec> = {
  cat: [44, -106],
  dog: [57, -92],
  fox: [46, -110],
  bear: [48, -108],
  bunny: [30, -112],
  frog: [0, 0],
  robot: [0, 0],
  blob: [0, 0],
};

const LIMB: Record<
  SpeciesId,
  {
    upperArm: number;
    foreArm: number;
    armLen: number;
    foreLen: number;
    hand: number;
    thigh: number;
    shin: number;
    legLen: number;
    shinLen: number;
    footX: number;
    footY: number;
    footRx: number;
    footRy: number;
  }
> = {
  cat: { upperArm: 23, foreArm: 21, armLen: 44, foreLen: 38, hand: 12, thigh: 27, shin: 22, legLen: 34, shinLen: 31, footX: 7, footY: 32, footRx: 18, footRy: 10 },
  dog: { upperArm: 25, foreArm: 23, armLen: 46, foreLen: 39, hand: 13, thigh: 29, shin: 24, legLen: 34, shinLen: 31, footX: 8, footY: 32, footRx: 20, footRy: 11 },
  fox: { upperArm: 21, foreArm: 19, armLen: 45, foreLen: 39, hand: 11, thigh: 24, shin: 20, legLen: 35, shinLen: 32, footX: 8, footY: 33, footRx: 18, footRy: 9 },
  bear: { upperArm: 27, foreArm: 25, armLen: 45, foreLen: 38, hand: 14, thigh: 30, shin: 25, legLen: 33, shinLen: 30, footX: 8, footY: 31, footRx: 21, footRy: 11 },
  bunny: { upperArm: 20, foreArm: 18, armLen: 44, foreLen: 39, hand: 11, thigh: 24, shin: 20, legLen: 35, shinLen: 32, footX: 9, footY: 33, footRx: 21, footRy: 9 },
  frog: { upperArm: 19, foreArm: 17, armLen: 42, foreLen: 38, hand: 10, thigh: 23, shin: 19, legLen: 36, shinLen: 33, footX: 10, footY: 34, footRx: 20, footRy: 9 },
  robot: { upperArm: 24, foreArm: 22, armLen: 44, foreLen: 37, hand: 12, thigh: 26, shin: 22, legLen: 34, shinLen: 31, footX: 5, footY: 32, footRx: 19, footRy: 10 },
  blob: { upperArm: 26, foreArm: 24, armLen: 40, foreLen: 34, hand: 12, thigh: 34, shin: 30, legLen: 30, shinLen: 27, footX: 6, footY: 28, footRx: 19, footRy: 10 },
};

/* ------------------------------------------------------------------ */
/* Silhouettes                                                         */
/* ------------------------------------------------------------------ */

const BODY_POINTS: Record<SpeciesId, Vec[]> = {
  cat: [[0, -150], [30, -148], [55, -136], [71, -115], [79, -87], [82, -55], [78, -26], [67, -5], [47, 9], [22, 15], [0, 16], [-24, 15], [-49, 9], [-69, -5], [-79, -26], [-82, -55], [-79, -87], [-71, -115], [-55, -136], [-30, -148]],
  dog: [[0, -146], [34, -146], [62, -132], [78, -108], [86, -76], [88, -42], [82, -12], [64, 6], [36, 15], [0, 18], [-38, 15], [-66, 6], [-83, -12], [-88, -42], [-86, -76], [-78, -108], [-62, -132], [-34, -146]],
  fox: [[0, -154], [28, -151], [52, -138], [68, -114], [76, -84], [78, -52], [74, -24], [62, -6], [42, 8], [18, 14], [0, 15], [-20, 14], [-44, 8], [-64, -6], [-74, -24], [-78, -52], [-76, -84], [-68, -114], [-52, -138], [-28, -151]],
  bear: [[0, -144], [34, -144], [64, -132], [80, -108], [88, -76], [90, -40], [84, -10], [66, 8], [38, 17], [0, 20], [-40, 17], [-68, 8], [-85, -10], [-90, -40], [-88, -76], [-80, -108], [-64, -132], [-36, -144]],
  bunny: [[0, -156], [26, -153], [48, -141], [63, -118], [70, -90], [72, -58], [68, -28], [58, -7], [40, 10], [20, 17], [0, 18], [-22, 17], [-42, 10], [-60, -7], [-69, -28], [-72, -58], [-70, -90], [-62, -118], [-47, -141], [-25, -153]],
  frog: [[0, -136], [34, -135], [60, -124], [78, -102], [86, -72], [87, -38], [78, -10], [56, 8], [28, 17], [0, 19], [-30, 17], [-58, 8], [-79, -10], [-87, -38], [-86, -72], [-78, -102], [-59, -124], [-33, -135]],
  robot: [],
  blob: [[0, -146], [28, -144], [51, -131], [66, -109], [72, -85], [70, -61], [77, -37], [74, -14], [55, 4], [27, 13], [0, 15], [-29, 13], [-54, 4], [-72, -14], [-76, -37], [-70, -61], [-73, -85], [-66, -109], [-52, -131], [-29, -144]],
};

const HEAD_POINTS: Record<SpeciesId, Vec[]> = {
  cat: [[0, -127], [32, -124], [56, -112], [70, -91], [76, -65], [74, -39], [64, -18], [46, -4], [22, 3], [0, 4], [-24, 3], [-50, -4], [-67, -18], [-75, -39], [-76, -65], [-70, -91], [-56, -112], [-32, -124]],
  dog: [[0, -124], [34, -124], [59, -113], [74, -93], [80, -66], [79, -38], [72, -14], [54, 2], [28, 9], [0, 10], [-30, 9], [-56, 2], [-73, -14], [-80, -38], [-80, -66], [-74, -93], [-59, -113], [-34, -124]],
  fox: [[0, -128], [31, -125], [54, -113], [68, -92], [73, -66], [71, -40], [61, -19], [43, -5], [20, 2], [0, 3], [-22, 2], [-45, -5], [-62, -19], [-72, -40], [-73, -66], [-68, -92], [-54, -113], [-31, -125]],
  bear: [[0, -124], [35, -124], [62, -113], [77, -92], [82, -65], [81, -38], [74, -16], [57, 0], [30, 7], [0, 8], [-32, 7], [-58, 0], [-75, -16], [-82, -38], [-82, -65], [-77, -92], [-62, -113], [-35, -124]],
  bunny: [[0, -128], [30, -126], [54, -114], [68, -93], [73, -67], [71, -41], [61, -19], [43, -5], [20, 2], [0, 3], [-22, 2], [-45, -5], [-62, -19], [-72, -41], [-73, -67], [-68, -93], [-54, -114], [-30, -126]],
  frog: [[0, -126], [37, -125], [63, -112], [80, -88], [85, -58], [83, -28], [72, -4], [51, 10], [25, 16], [0, 17], [-27, 16], [-53, 10], [-73, -4], [-84, -28], [-85, -58], [-80, -88], [-63, -112], [-37, -125]],
  robot: [],
  blob: [[0, -125], [31, -123], [56, -111], [71, -89], [76, -64], [72, -42], [78, -20], [70, 0], [50, 10], [25, 14], [0, 14], [-27, 14], [-52, 10], [-71, 0], [-78, -20], [-72, -42], [-76, -64], [-71, -89], [-56, -111], [-31, -123]],
};

function bodySilhouette(species: SpeciesId): Path {
  if (species === "robot") return roundRect(-66, -148, 132, 162, 42);
  return smooth(BODY_POINTS[species], true, 0.95);
}

function headSilhouette(species: SpeciesId): Path {
  if (species === "robot") return roundRect(-70, -132, 140, 142, 42);
  return smooth(HEAD_POINTS[species], true, 0.95);
}

function limbPath(length: number, width: number, start = 0): Path {
  const hw = width / 2;
  return smooth(
    [
      [-hw * 0.92, start],
      [hw * 0.92, start],
      [hw, start + length * 0.34],
      [hw * 0.9, length * 0.86],
      [hw * 0.62, length],
      [0, length + 2],
      [-hw * 0.62, length],
      [-hw * 0.9, length * 0.86],
      [-hw, start + length * 0.34],
    ],
    true,
    0.55,
  );
}

function star(cx: number, cy: number, r: number, points = 4): Path {
  const verts: Vec[] = [];
  const inner = r * 0.32;
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    verts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }
  return polyline(verts, true);
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

export function buildMascot(spec: MascotSpec): Build {
  const p = derivePalette(spec.primary, spec.accent, spec.ink);
  const species = spec.species;
  const limbs = LIMB[species];
  const side = spec.seed % 2 === 0 ? 1 : -1;
  const isRobot = species === "robot";
  const isBlob = species === "blob";
  const isFrog = species === "frog";

  const bones: Bone[] = [
    { id: "root", parent: null, x: 210, y: STAGE.ground },
    { id: "body", parent: "root", x: 0, y: -92, counterParentScale: false },
    { id: "head", parent: "body", x: 0, y: -142, counterParentScale: true },
    { id: "headTop", parent: "head", x: 0, y: 0 },
    { id: "earL", parent: "head", x: -EAR_POS[species][0], y: EAR_POS[species][1] },
    { id: "earR", parent: "head", x: EAR_POS[species][0], y: EAR_POS[species][1] },
    { id: "eyeL", parent: "head", x: -EYE_POS[species][0], y: EYE_POS[species][1] },
    { id: "eyeR", parent: "head", x: EYE_POS[species][0], y: EYE_POS[species][1] },
    { id: "armL", parent: "body", x: -74, y: -102, rot: 8, counterParentScale: true },
    { id: "foreL", parent: "armL", x: 0, y: limbs.armLen, rot: 3 },
    { id: "armR", parent: "body", x: 74, y: -102, rot: -8, counterParentScale: true },
    { id: "foreR", parent: "armR", x: 0, y: limbs.armLen, rot: -3 },
    { id: "legL", parent: "body", x: -33, y: -4, rot: -1.5, counterParentScale: true },
    { id: "shinL", parent: "legL", x: 0, y: limbs.legLen, rot: 1.5 },
    { id: "legR", parent: "body", x: 33, y: -4, rot: 1.5, counterParentScale: true },
    { id: "shinR", parent: "legR", x: 0, y: limbs.legLen, rot: -1.5 },
    { id: "tail1", parent: "body", x: side * 60, y: -30, rot: side * 34, counterParentScale: true },
    { id: "tail2", parent: "tail1", x: 0, y: -35, rot: side * 16 },
  ];

  const layers: Layer[] = [];
  const getLayer = (bone: string, z: number): Layer => {
    let l = layers.find((x) => x.bone === bone);
    if (!l) {
      l = { bone, z, shapes: [] };
      layers.push(l);
    }
    return l;
  };

  const style = (s: ShapeStyle = {}): ShapeStyle => ({
    stroke: p.ink,
    width: 4.5,
    cap: "round",
    join: "round",
    ...s,
  });

  const shape = (path: Path, s: ShapeStyle = {}): Shape => ({
    path,
    d: pathToD(path),
    style: style(s),
  });

  const add = (bone: string, z: number, shapes: Shape[]) => {
    getLayer(bone, z).shapes.push(...shapes);
  };

  /* ---------------- tail ---------------- */
  if (!isRobot && !isBlob && !isFrog) {
    const thick = species === "fox" ? 18 : species === "bear" ? 13 : species === "bunny" ? 11 : 12;
    const len = species === "bear" ? 22 : species === "bunny" ? 20 : 36;
    const t1 = smooth(
      [
        [-thick * 0.45, 10],
        [thick * 0.55, 8],
        [thick * 0.9, 2],
        [thick * 0.75, -len * 0.45],
        [thick * 0.4, -len * 0.9],
        [0, -len - 2],
        [-thick * 0.55, -len * 0.82],
        [-thick * 0.7, -len * 0.35],
      ],
      true,
      0.8,
    );
    add("tail1", 4, [shape(t1, { fill: p.primary })]);
    if (species === "bunny") {
      add("tail1", 4, [
        shape(ellipse(0, -len - 4, 15, 14), { fill: p.secondary }),
        shape(ellipse(-4, -len - 7, 5, 4), { fill: p.paper, stroke: undefined, opacity: 0.8 }),
      ]);
    } else {
      const t2 = smooth(
        [
          [-thick * 0.4, 6],
          [thick * 0.48, 5],
          [thick * 0.75, -len * 0.35],
          [thick * 0.42, -len * 0.9],
          [0, -len - 4],
          [-thick * 0.45, -len * 0.78],
          [-thick * 0.62, -len * 0.28],
        ],
        true,
        0.8,
      );
      const tipColor = species === "fox" ? p.secondary : p.primary;
      add("tail2", 4, [shape(t2, { fill: tipColor })]);
      if (species === "fox") {
        const tip = smooth(
          [
            [-thick * 0.42, -len * 0.55],
            [thick * 0.5, -len * 0.62],
            [thick * 0.4, -len - 6],
            [0, -len - 9],
            [-thick * 0.5, -len - 2],
          ],
          true,
          0.8,
        );
        add("tail2", 4, [shape(tip, { fill: p.secondary, stroke: undefined })]);
      }
    }
  }

  /* ---------------- legs ---------------- */
  const legColor = isBlob ? p.secondary : p.primary;
  for (const s of [-1, 1] as const) {
    const leg = s === -1 ? "legL" : "legR";
    const shin = s === -1 ? "shinL" : "shinR";
    if (isRobot) {
      add(leg, 6, [
        shape(roundRect(-11, -6, 22, limbs.legLen + 8, 8), { fill: p.secondary, width: 4 }),
        shape(ellipse(0, 2, 6, 6), { fill: p.accent, width: 3 }),
      ]);
      add(shin, 6, [
        shape(roundRect(-9, 0, 18, limbs.shinLen + 4, 7), { fill: p.primary, width: 4 }),
        shape(roundRect(-16, limbs.shinLen - 4, 32, 20, 8), { fill: p.secondary, width: 4 }),
      ]);
    } else {
      add(leg, 6, [
        shape(limbPath(limbs.legLen, limbs.thigh), { fill: legColor }),
      ]);
      add(shin, 6, [
        shape(limbPath(limbs.shinLen, limbs.shin), { fill: legColor }),
        shape(
          ellipse(
            s * limbs.footX,
            limbs.footY,
            limbs.footRx,
            limbs.footRy,
          ),
          { fill: isBlob ? p.primary : p.secondary },
        ),
      ]);
    }
  }

  /* ---------------- body ---------------- */
  const bodyShapes: Shape[] = [];

  if (spec.accessories.includes("cape")) {
    const cape = smooth(
      [
        [-52, -146],
        [-70, -120],
        [-84, -48],
        [-94, 26],
        [-74, 8],
        [-54, 32],
        [-34, 10],
        [-12, 36],
        [10, 10],
        [34, 34],
        [52, 8],
        [78, 30],
        [86, -48],
        [70, -120],
        [50, -146],
      ],
      true,
      0.7,
    );
    bodyShapes.push(shape(cape, { fill: p.accent, width: 5 }));
    bodyShapes.push(
      shape(
        smooth([[-44, -108], [-56, -30], [-46, 6], [-22, 12], [0, 14]], false, 0.6),
        { fill: undefined, stroke: p.ink, width: 2.5, opacity: 0.35 },
      ),
    );
  }

  const body = bodySilhouette(species);
  bodyShapes.push(shape(body, { fill: p.primary, width: 5 }));

  // belly / chest plate
  if (isRobot) {
    bodyShapes.push(
      shape(roundRect(-38, -104, 76, 78, 22), {
        fill: p.secondary,
        width: 3.5,
      }),
    );
    bodyShapes.push(
      shape(ellipse(0, -64, 13, 13), { fill: p.accent, width: 3.5 }),
    );
    bodyShapes.push(
      shape(ellipse(-4, -68, 4, 4), { fill: p.paper, stroke: undefined, opacity: 0.8 }),
    );
    for (const s of [-1, 1] as const) {
      bodyShapes.push(
        shape(ellipse(s * 29, -92, 3.2, 3.2), { fill: p.ink, stroke: undefined, opacity: 0.55 }),
      );
      bodyShapes.push(
        shape(ellipse(s * 29, -34, 3.2, 3.2), { fill: p.ink, stroke: undefined, opacity: 0.55 }),
      );
    }
  } else {
    const belly =
      species === "frog" || species === "blob"
        ? smooth(
            [
              [0, -112],
              [32, -108],
              [48, -82],
              [44, -44],
              [28, -10],
              [0, 2],
              [-30, -10],
              [-44, -44],
              [-48, -82],
              [-32, -108],
            ],
            true,
            0.9,
          )
        : ellipse(0, -56, 44, 54);
    bodyShapes.push(
      shape(belly, { fill: p.secondary, stroke: undefined, opacity: isFrog ? 0.5 : 0.92 }),
    );
  }

  // pattern on body
  const patternColor = p.secondary;
  if (spec.pattern === "spots") {
    const spots: Array<[number, number, number]> = [
      [-44, -62, 14],
      [38, -34, 11],
      [-20, -112, 8],
      [48, -92, 7],
    ];
    for (const [x, y, r] of spots) {
      bodyShapes.push(
        shape(ellipse(x, y, r, r * 0.9), {
          fill: isRobot ? p.accent : patternColor,
          stroke: undefined,
          opacity: isRobot ? 0.9 : 0.75,
        }),
      );
    }
  } else if (spec.pattern === "stripes") {
    for (let i = 0; i < 3; i++) {
      const y = -92 + i * 26;
      const w = 46 - i * 4;
      bodyShapes.push(
        shape(
          smooth(
            [
              [-w, y + 8],
              [-w * 0.4, y - 2],
              [w * 0.4, y + 2],
              [w, y - 6],
            ],
            false,
            0.7,
          ),
          { fill: undefined, stroke: patternColor, width: 11, opacity: 0.65 },
        ),
      );
    }
  }

  // scarf & bow tie live on the torso
  if (spec.accessories.includes("scarf")) {
    const scarfY = -128;
    bodyShapes.push(
      shape(
        smooth(
          [
            [-52, scarfY - 4],
            [-24, scarfY + 8],
            [18, scarfY + 8],
            [48, scarfY - 2],
            [52, scarfY + 12],
            [18, scarfY + 20],
            [-24, scarfY + 20],
            [-55, scarfY + 10],
          ],
          true,
          0.7,
        ),
        { fill: p.accent, width: 4.5 },
      ),
    );
    bodyShapes.push(
      shape(
        smooth(
          [
            [30, scarfY + 12],
            [48, scarfY + 22],
            [54, scarfY + 54],
            [40, scarfY + 48],
            [28, scarfY + 26],
          ],
          true,
          0.6,
        ),
        { fill: p.accent, width: 4 },
      ),
    );
    bodyShapes.push(
      shape(ellipse(36, scarfY + 12, 9, 7), { fill: p.accent, width: 3.5 }),
    );
  }

  if (spec.accessories.includes("bowtie")) {
    const y = -132;
    bodyShapes.push(
      shape(
        smooth(
          [
            [-6, y],
            [-26, y - 12],
            [-30, y + 2],
            [-26, y + 14],
            [-6, y + 4],
          ],
          true,
          0.4,
        ),
        { fill: p.accent, width: 4 },
      ),
    );
    bodyShapes.push(
      shape(
        smooth(
          [
            [6, y],
            [26, y - 12],
            [30, y + 2],
            [26, y + 14],
            [6, y + 4],
          ],
          true,
          0.4,
        ),
        { fill: p.accent, width: 4 },
      ),
    );
    bodyShapes.push(shape(ellipse(0, y + 1, 7, 7), { fill: p.accent, width: 3.5 }));
  }

  add("body", 10, bodyShapes);

  /* ---------------- ears ---------------- */
  if (species === "cat" || species === "fox") {
    const big = species === "fox";
    const outer = smooth(
      [
        [-24, 14],
        [-20, -8],
        [big ? 2 : 6, big ? -42 : -32],
        [big ? 34 : 24, big ? -66 : -52],
        [big ? 40 : 30, big ? -56 : -44],
        [big ? 28 : 22, -16],
        [22, 14],
      ],
      true,
      0.55,
    );
    const inner = smooth(
      [
        [-10, 6],
        [-4, -10],
        [big ? 22 : 16, big ? -46 : -36],
        [big ? 24 : 19, big ? -38 : -30],
        [14, -10],
        [10, 6],
      ],
      true,
      0.55,
    );
    for (const s of [-1, 1] as const) {
      const bone = s === 1 ? "earR" : "earL";
      const flip = (path: Path) =>
        s === 1 ? path : mapPath(path, (v) => [v[0] * -1, v[1]]);
      add(bone, 20, [
        shape(flip(outer), { fill: p.primary, width: 4.5 }),
        shape(flip(inner), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
      ]);
    }
  } else if (species === "bunny") {
    const outer = smooth(
      [
        [-15, 10],
        [-20, -30],
        [-18, -68],
        [-6, -92],
        [8, -94],
        [18, -70],
        [18, -28],
        [14, 10],
      ],
      true,
      0.75,
    );
    const inner = smooth(
      [
        [-6, 2],
        [-10, -32],
        [-8, -64],
        [-1, -80],
        [7, -64],
        [8, -30],
        [6, 2],
      ],
      true,
      0.75,
    );
    for (const s of [-1, 1] as const) {
      const bone = s === 1 ? "earR" : "earL";
      const flip = (path: Path) =>
        s === 1 ? path : mapPath(path, (v) => [v[0] * -1, v[1]]);
      add(bone, 20, [
        shape(flip(outer), { fill: p.primary, width: 4.5 }),
        shape(flip(inner), { fill: p.blush, stroke: undefined, opacity: 0.9 }),
      ]);
    }
  } else if (species === "bear") {
    for (const s of [-1, 1] as const) {
      const bone = s === 1 ? "earR" : "earL";
      add(bone, 20, [
        shape(ellipse(0, -6, 26, 25), { fill: p.primary, width: 4.5 }),
        shape(ellipse(0, -6, 13, 12.5), { fill: p.secondary, stroke: undefined }),
      ]);
    }
  } else if (species === "dog") {
    const outer = smooth(
      [
        [-4, -10],
        [16, -12],
        [28, 6],
        [30, 38],
        [22, 64],
        [4, 72],
        [-12, 56],
        [-18, 24],
        [-16, -2],
      ],
      true,
      0.75,
    );
    for (const s of [-1, 1] as const) {
      const bone = s === 1 ? "earR" : "earL";
      const flip = (path: Path) =>
        s === 1 ? path : mapPath(path, (v) => [v[0] * -1, v[1]]);
      add(bone, 20, [shape(flip(outer), { fill: p.primaryDeep, width: 4.5 })]);
    }
  }

  /* ---------------- arms ---------------- */
  for (const s of [-1, 1] as const) {
    const arm = s === -1 ? "armL" : "armR";
    const fore = s === -1 ? "foreL" : "foreR";
    if (isRobot) {
      add(arm, 30, [
        shape(roundRect(-11, -8, 22, limbs.armLen + 12, 8), { fill: p.secondary, width: 4 }),
        shape(ellipse(0, 0, 7, 7), { fill: p.accent, width: 3 }),
      ]);
      add(fore, 30, [
        shape(roundRect(-9, 0, 18, limbs.foreLen + 2, 7), { fill: p.primary, width: 4 }),
        shape(ellipse(0, limbs.foreLen + 5, limbs.hand, limbs.hand), { fill: p.secondary, width: 4 }),
        shape(ellipse(0, limbs.foreLen + 5, 4, 4), { fill: p.accent, stroke: undefined }),
      ]);
    } else {
      add(arm, 30, [
        shape(limbPath(limbs.armLen, limbs.upperArm, -6), { fill: p.primary }),
      ]);
      add(fore, 30, [
        shape(limbPath(limbs.foreLen, limbs.foreArm), { fill: p.primary }),
        shape(ellipse(0, limbs.foreLen + 4, limbs.hand, limbs.hand), { fill: p.secondary }),
      ]);
    }
  }

  /* ---------------- head ---------------- */
  const headShapes: Shape[] = [];
  const head = headSilhouette(species);
  headShapes.push(shape(head, { fill: p.primary, width: 5 }));

  if (spec.pattern === "patch") {
    headShapes.push(
      shape(ellipse(-31, -78, 35, 37), {
        fill: p.secondary,
        stroke: undefined,
        opacity: 0.95,
      }),
    );
  }

  if (isFrog) {
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(ellipse(s * 38, -108, 31, 30), { fill: p.primary, width: 5 }),
      );
      headShapes.push(
        shape(ellipse(s * 38, -108, 22, 21), { fill: p.secondary, stroke: undefined, opacity: 0.55 }),
      );
    }
  }

  if (isRobot) {
    headShapes.push(
      shape(roundRect(-56, -118, 112, 118, 32), {
        fill: p.secondary,
        width: 4,
        opacity: 0.45,
      }),
    );
    headShapes.push(
      shape(roundRect(-52, -116, 104, 42, 18), {
        fill: p.ink,
        stroke: p.ink,
        width: 3,
        opacity: spec.eyes === "visor" ? 0.92 : 0.18,
      }),
    );
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(roundRect(s * 72 - (s === 1 ? 0 : 12), -92, 14, 34, 7), {
          fill: p.accent,
          width: 3.5,
        }),
      );
    }
    headShapes.push(
      shape(
        smooth(
          [
            [-30, -130],
            [-10, -150],
            [0, -166],
            [10, -150],
            [30, -130],
          ],
          false,
          0.7,
        ),
        { fill: undefined, stroke: p.ink, width: 5 },
      ),
    );
    headShapes.push(
      shape(ellipse(0, -170, 9, 9), { fill: p.accent, width: 4 }),
    );
  }

  if (species === "blob") {
    headShapes.push(
      shape(
        smooth(
          [
            [-30, -104],
            [-38, -118],
            [-28, -126],
            [-14, -120],
            [-6, -128],
            [6, -122],
            [18, -130],
            [30, -120],
            [44, -124],
            [48, -110],
          ],
          false,
          0.8,
        ),
        { fill: undefined, stroke: p.ink, width: 4, opacity: 0.55 },
      ),
    );
  }

  if (isRobot) {
    // visor glow is drawn by the eye layers
  } else {
    const muzzle =
      species === "dog" || species === "fox" || species === "bear"
        ? smooth(
            [
              [0, -58],
              [30, -56],
              [46, -38],
              [42, -14],
              [22, 2],
              [0, 4],
              [-22, 2],
              [-42, -14],
              [-46, -38],
              [-30, -56],
            ],
            true,
            0.9,
          )
        : null;
    if (muzzle) {
      headShapes.push(
        shape(muzzle, {
          fill: species === "bear" ? p.secondary : p.paper,
          stroke: undefined,
          opacity: species === "bear" ? 0.85 : 0.92,
        }),
      );
    }
  }

  // head pattern
  if (spec.pattern === "spots") {
    headShapes.push(
      shape(ellipse(47, -104, 11, 10), {
        fill: isRobot ? p.accent : patternColor,
        stroke: undefined,
        opacity: 0.7,
      }),
    );
  } else if (spec.pattern === "stripes") {
    for (let i = 0; i < 2; i++) {
      headShapes.push(
        shape(
          smooth(
            [
              [-44 + i * 10, -116],
              [-24 + i * 10, -122],
              [-2 + i * 10, -119],
            ],
            false,
            0.7,
          ),
          { fill: undefined, stroke: patternColor, width: 9, opacity: 0.6 },
        ),
      );
    }
  }

  // blush
  for (const s of [-1, 1] as const) {
    if (isRobot) {
      headShapes.push(
        shape(roundRect(s * 50 - 9, -40, 18, 7, 3), {
          fill: p.accent,
          stroke: undefined,
          opacity: 0.8,
        }),
      );
    } else {
      headShapes.push(
        shape(ellipse(s * 49, -34, 13, 7), {
          fill: p.blush,
          stroke: undefined,
          opacity: 0.55,
        }),
      );
    }
  }

  // freckles
  if (spec.pattern === "freckles") {
    for (const s of [-1, 1] as const) {
      for (let i = 0; i < 3; i++) {
        headShapes.push(
          shape(ellipse(s * (38 + i * 6), -37 + (i % 2) * 7, 2.3, 2.3), {
            fill: p.ink,
            stroke: undefined,
            opacity: 0.55,
          }),
        );
      }
    }
  }

  // brows
  if (spec.vibe === "mischievous" || spec.vibe === "heroic" || spec.vibe === "chaotic") {
    for (const s of [-1, 1] as const) {
      const lift = spec.vibe === "mischievous" ? (s === 1 ? -8 : 2) : 0;
      headShapes.push(
        shape(
          smooth(
            [
              [s * 14, -104 + lift - 3],
              [s * 28, -111 + lift],
              [s * 44, -105 + lift + 1],
            ],
            false,
            0.7,
          ),
          {
            fill: undefined,
            stroke: p.ink,
            width: 4.5,
            cap: "round",
          },
        ),
      );
    }
  }

  // nose
  const noseY = species === "frog" ? -44 : -46;
  if (isRobot) {
    headShapes.push(
      shape(roundRect(-7, noseY - 2, 14, 5, 2.5), {
        fill: p.accent,
        stroke: undefined,
      }),
    );
  } else if (species === "frog") {
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(ellipse(s * 10, noseY, 2.5, 2), {
          fill: p.ink,
          stroke: undefined,
          opacity: 0.75,
        }),
      );
    }
  } else if (species === "bunny") {
    headShapes.push(
      shape(
        smooth(
          [[-8, noseY - 2], [8, noseY - 2], [0, noseY + 7]],
          true,
          0.4,
        ),
        { fill: p.blush, width: 3 },
      ),
    );
  } else {
    headShapes.push(
      shape(
        smooth(
          [[-8, noseY - 2], [8, noseY - 2], [0, noseY + 7]],
          true,
          0.4,
        ),
        { fill: p.ink, stroke: undefined },
      ),
    );
  }

  // mouth
  const my = species === "frog" ? -28 : -28;
  if (spec.mouth === "smile") {
    const w = species === "frog" ? 28 : 16;
    headShapes.push(
      shape(
        smooth(
          [
            [-w, my],
            [-w * 0.45, my + 10],
            [w * 0.45, my + 10],
            [w, my],
          ],
          false,
          0.8,
        ),
        { fill: undefined, stroke: p.ink, width: 5 },
      ),
    );
  } else if (spec.mouth === "grin") {
    const w = species === "frog" ? 36 : 22;
    const mouth = smooth(
      [
        [-w, my - 2],
        [-w * 0.55, my + 14],
        [0, my + 18],
        [w * 0.55, my + 14],
        [w, my - 2],
        [w * 0.5, my + 2],
        [0, my + 4],
        [-w * 0.5, my + 2],
      ],
      true,
      0.55,
    );
    headShapes.push(shape(mouth, { fill: p.ink, width: 4.5 }));
    headShapes.push(
      shape(
        smooth(
          [
            [-w * 0.52, my + 4],
            [-w * 0.18, my + 12],
            [0, my + 13],
            [w * 0.18, my + 12],
            [w * 0.52, my + 4],
            [0, my + 6],
          ],
          true,
          0.5,
        ),
        { fill: p.blush, stroke: undefined, opacity: 0.9 },
      ),
    );
    headShapes.push(
      shape(roundRect(-w * 0.62, my + 1, w * 1.24, 6, 3), {
        fill: p.paper,
        stroke: undefined,
        opacity: 0.95,
      }),
    );
  } else if (spec.mouth === "smirk") {
    headShapes.push(
      shape(
        smooth(
          [
            [-14, my + 1],
            [-2, my + 6],
            [10, my + 1],
            [17, my - 5],
          ],
          false,
          0.7,
        ),
        { fill: undefined, stroke: p.ink, width: 5 },
      ),
    );
  } else if (spec.mouth === "o") {
    headShapes.push(
      shape(ellipse(0, my + 4, 7, 9), { fill: p.ink, width: 3.5 }),
    );
    headShapes.push(
      shape(ellipse(0, my + 8, 4, 3), { fill: p.blush, stroke: undefined }),
    );
  } else {
    headShapes.push(
      shape(
        smooth([[-13, my + 2], [0, my + 4], [13, my + 1]], false, 0.5),
        { fill: undefined, stroke: p.ink, width: 5 },
      ),
    );
  }

  if (species === "dog") {
    headShapes.push(
      shape(
        smooth(
          [
            [2, my + 7],
            [11, my + 8],
            [10, my + 22],
            [1, my + 20],
            [-3, my + 10],
          ],
          true,
          0.6,
        ),
        { fill: p.blush, width: 3 },
      ),
    );
  }

  if (species === "bunny") {
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(roundRect(s * 8 - 4, my + 6, 8, 14, 3), {
          fill: p.paper,
          width: 2.8,
        }),
      );
    }
  }

  if (species === "cat" || species === "fox") {
    for (const s of [-1, 1] as const) {
      for (let i = 0; i < 3; i++) {
        const y = -48 + i * 9;
        headShapes.push(
          shape(
            smooth(
              [
                [s * 26, y],
                [s * 48, y - 3 + i * 2],
                [s * 70, y - 6 + i * 4],
              ],
              false,
              0.35,
            ),
            {
              fill: undefined,
              stroke: p.ink,
              width: 2.2,
              opacity: 0.55,
            },
          ),
        );
      }
    }
  }

  if (spec.eyes === "visor" && !isRobot) {
    headShapes.push(
      shape(roundRect(-73, -100, 146, 43, 21), { fill: p.ink, width: 4.5 }),
    );
    headShapes.push(
      shape(
        smooth([[-54, -86], [0, -92], [54, -86]], false, 0.6),
        { fill: undefined, stroke: p.accent, width: 3, opacity: 0.55 },
      ),
    );
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(ellipse(s * 68, -78, 2.6, 2.6), {
          fill: p.accent,
          stroke: undefined,
          opacity: 0.9,
        }),
      );
    }
  }

  add("head", 40, headShapes);

  /* ---------------- eyes ---------------- */
  const eyeZ = spec.eyes === "visor" && isRobot ? 46 : 50;
  for (const s of [-1, 1] as const) {
    const bone = s === -1 ? "eyeL" : "eyeR";
    const eyes: Shape[] = [];
    if (spec.eyes === "sparkle") {
      eyes.push(shape(ellipse(0, 0, 16, 18), { fill: p.paper, width: 3.6 }));
      eyes.push(shape(ellipse(0, 2, 8, 10), { fill: p.ink, stroke: undefined }));
      eyes.push(shape(ellipse(-3, -3, 3.4, 3.4), { fill: p.paper, stroke: undefined }));
      eyes.push(shape(ellipse(4, 6, 1.7, 1.7), { fill: p.paper, stroke: undefined, opacity: 0.8 }));
    } else if (spec.eyes === "dot") {
      eyes.push(shape(ellipse(0, 0, 9, 10), { fill: p.ink, stroke: undefined }));
      eyes.push(shape(ellipse(-2.6, -3, 2.6, 2.6), { fill: p.paper, stroke: undefined }));
    } else if (spec.eyes === "sleepy") {
      eyes.push(
        shape(
          smooth([[-13, -1], [0, 7], [13, -1]], false, 0.75),
          { fill: undefined, stroke: p.ink, width: 5.5 },
        ),
      );
      eyes.push(
        shape(
          smooth([[-11, 8], [0, 10], [11, 8]], false, 0.6),
          { fill: undefined, stroke: p.ink, width: 2, opacity: 0.25 },
        ),
      );
    } else if (spec.eyes === "happy") {
      eyes.push(
        shape(
          smooth([[-14, 5], [0, -7], [14, 5]], false, 0.8),
          { fill: undefined, stroke: p.ink, width: 5.5 },
        ),
      );
    } else {
      // visor glow
      eyes.push(
        shape(ellipse(0, 0, 9, 7), {
          fill: p.paper,
          stroke: undefined,
        }),
      );
      eyes.push(
        shape(ellipse(0, 0, 4.5, 4.5), {
          fill: p.accent,
          stroke: undefined,
        }),
      );
    }
    add(bone, eyeZ, eyes);
  }

  /* ---------------- top accessories ---------------- */
  const top: Shape[] = [];

  if (spec.accessories.includes("glasses")) {
    const zGlasses = 62;
    const lenses: Shape[] = [];
    for (const s of [-1, 1] as const) {
      lenses.push(
        shape(ellipse(s * 31, -78, 26, 24), {
          fill: p.paper,
          stroke: p.ink,
          width: 4.5,
          opacity: 0.18,
        }),
      );
      lenses.push(
        shape(ellipse(s * 31, -78, 26, 24), {
          fill: undefined,
          stroke: p.ink,
          width: 5,
        }),
      );
    }
    lenses.push(
      shape(
        smooth([[-6, -78], [0, -82], [6, -78]], false, 0.5),
        { fill: undefined, stroke: p.ink, width: 4.5 },
      ),
    );
    for (const s of [-1, 1] as const) {
      lenses.push(
        shape(
          smooth(
            [
              [s * 57, -80],
              [s * 66, -88],
            ],
            false,
            0.3,
          ),
          { fill: undefined, stroke: p.ink, width: 4 },
        ),
      );
    }
    add("headTop", zGlasses, lenses);
  }

  if (spec.accessories.includes("cap")) {
    const cap = smooth(
      [
        [-56, -118],
        [-44, -142],
        [-16, -158],
        [16, -158],
        [46, -142],
        [56, -116],
        [30, -110],
        [0, -108],
        [-30, -110],
      ],
      true,
      0.72,
    );
    const brim = smooth(
      [
        [18, -116],
        [52, -114],
        [82, -104],
        [80, -96],
        [48, -98],
        [20, -104],
      ],
      true,
      0.6,
    );
    top.push(shape(brim, { fill: p.primaryDeep, width: 4.5 }));
    top.push(shape(cap, { fill: p.accent, width: 4.5 }));
    top.push(
      shape(ellipse(0, -156, 7, 7), { fill: p.primaryDeep, width: 3 }),
    );
    top.push(
      shape(
        smooth([[-34, -126], [0, -120], [34, -126]], false, 0.6),
        { fill: undefined, stroke: p.ink, width: 2, opacity: 0.25 },
      ),
    );
    add("headTop", 60, top);
  }

  if (spec.accessories.includes("headphones")) {
    const band = smooth(
      [
        [-64, -96],
        [-56, -138],
        [-22, -162],
        [22, -162],
        [56, -138],
        [64, -96],
      ],
      false,
      0.7,
    );
    const phones: Shape[] = [
      shape(band, { fill: undefined, stroke: p.ink, width: 14 }),
      shape(band, { fill: undefined, stroke: p.accent, width: 9 }),
    ];
    for (const s of [-1, 1] as const) {
      phones.push(
        shape(roundRect(s * 64 - 14, -104, 28, 46, 13), {
          fill: p.accent,
          width: 4.5,
        }),
      );
      phones.push(
        shape(roundRect(s * 64 - 7, -96, 14, 30, 7), {
          fill: p.primaryDeep,
          stroke: undefined,
          opacity: 0.55,
        }),
      );
    }
    add("headTop", 60, phones);
  }

  if (spec.accessories.includes("crown")) {
    const crown = smooth(
      [
        [-44, -122],
        [-46, -150],
        [-26, -140],
        [-12, -164],
        [0, -142],
        [14, -164],
        [28, -140],
        [46, -150],
        [44, -122],
      ],
      true,
      0.45,
    );
    add("headTop", 60, [
      shape(crown, { fill: p.accent, width: 4.5 }),
      shape(ellipse(0, -166, 5, 5), { fill: p.paper, stroke: p.ink, width: 2.5 }),
      shape(ellipse(-13, -151, 4, 4), { fill: p.paper, stroke: p.ink, width: 2.2 }),
      shape(ellipse(13, -151, 4, 4), { fill: p.paper, stroke: p.ink, width: 2.2 }),
    ]);
  }

  if (spec.accessories.includes("flower")) {
    const fx = -54;
    const fy = -112;
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      petals.push(
        shape(ellipse(fx + Math.cos(a) * 15, fy + Math.sin(a) * 15, 10, 10), {
          fill: p.accent,
          width: 3,
        }),
      );
    }
    petals.push(
      shape(ellipse(fx, fy, 8, 8), { fill: p.paper, width: 3 }),
    );
    petals.push(
      shape(
        smooth(
          [
            [fx + 8, fy + 16],
            [fx + 22, fy + 28],
            [fx + 18, fy + 34],
            [fx + 6, fy + 24],
          ],
          true,
          0.6,
        ),
        { fill: p.primaryDeep, width: 3 },
      ),
    );
    add("headTop", 60, petals);
  }

  /* ---------------- finalize ---------------- */
  const byId: Record<string, Bone> = Object.fromEntries(bones.map((b) => [b.id, b]));

  const bounds = computeRestBounds(layers, byId);
  const fit = fitMatrix(bounds);
  layers.sort((a, b) => a.z - b.z);

  return { spec, palette: p, bones, byId, layers, fit, bounds, stage: STAGE };
}

/* ------------------------------------------------------------------ */
/* Bounds + fit                                                        */
/* ------------------------------------------------------------------ */

export function restMatrices(bones: Bone[]): Record<string, Mat> {
  const byId: Record<string, Bone> = Object.fromEntries(bones.map((b) => [b.id, b]));
  const cache: Record<string, Mat> = {};
  const resolve = (id: string): Mat => {
    if (cache[id]) return cache[id];
    const b = byId[id];
    if (!b) return cache[id] = [1, 0, 0, 1, 0, 0];
    const local = compose(
      matTranslate(b.x, b.y),
      matRotate(b.rot ?? 0),
      matScale(b.sx ?? 1, b.sy ?? 1),
    );
    const m = b.parent ? multiply(resolve(b.parent), local) : local;
    cache[id] = m;
    return m;
  };
  for (const b of bones) resolve(b.id);
  return cache;
}

function computeRestBounds(layers: Layer[], bones: Record<string, Bone>) {
  const mats = restMatrices(Object.values(bones));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const layer of layers) {
    const m = mats[layer.bone];
    if (!m) continue;
    for (const s of layer.shapes) {
      const pad = (s.style.width ?? 0) / 2;
      for (const v of pathPoints(s.path)) {
        const [x, y] = applyMat(m, v);
        minX = Math.min(minX, x - pad);
        minY = Math.min(minY, y - pad);
        maxX = Math.max(maxX, x + pad);
        maxY = Math.max(maxY, y + pad);
      }
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function fitMatrix(b: { x: number; y: number; w: number; h: number }): Mat {
  const scale = Math.min(FIT_BOX.w / b.w, FIT_BOX.h / b.h, 1.18);
  const tx = FIT_BOX.cx - (b.x + b.w / 2) * scale;
  const ty = FIT_BOX.bottom - (b.y + b.h) * scale;
  return multiply(matTranslate(tx, ty), matScale(scale));
}

export { STAGE, EYE_POS, EAR_POS, limbPath, star };
