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
import {
  derivePalette,
  type MascotSpec,
  type Palette,
  type SpeciesId,
  type ExpressionId,
} from "./spec";

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
  cat: [31, -62],
  dog: [30, -60],
  fox: [31, -62],
  bear: [29, -58],
  bunny: [30, -62],
  frog: [34, -66],
  robot: [33, -74],
  blob: [29, -60],
};

const EAR_POS: Record<SpeciesId, Vec> = {
  cat: [46, -108],
  dog: [58, -92],
  fox: [48, -112],
  bear: [48, -108],
  bunny: [28, -114],
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
  cat: { upperArm: 22, foreArm: 20, armLen: 36, foreLen: 32, hand: 13, thigh: 25, shin: 20, legLen: 28, shinLen: 25, footX: 5, footY: 25, footRx: 17, footRy: 10 },
  dog: { upperArm: 24, foreArm: 22, armLen: 37, foreLen: 33, hand: 14, thigh: 27, shin: 22, legLen: 28, shinLen: 25, footX: 6, footY: 25, footRx: 18, footRy: 11 },
  fox: { upperArm: 21, foreArm: 19, armLen: 36, foreLen: 33, hand: 13, thigh: 24, shin: 19, legLen: 29, shinLen: 26, footX: 6, footY: 26, footRx: 17, footRy: 10 },
  bear: { upperArm: 26, foreArm: 24, armLen: 36, foreLen: 32, hand: 15, thigh: 28, shin: 23, legLen: 27, shinLen: 24, footX: 6, footY: 24, footRx: 19, footRy: 11 },
  bunny: { upperArm: 20, foreArm: 18, armLen: 35, foreLen: 33, hand: 13, thigh: 23, shin: 19, legLen: 29, shinLen: 26, footX: 7, footY: 26, footRx: 18, footRy: 10 },
  frog: { upperArm: 19, foreArm: 17, armLen: 34, foreLen: 32, hand: 12, thigh: 23, shin: 19, legLen: 30, shinLen: 26, footX: 7, footY: 26, footRx: 18, footRy: 10 },
  robot: { upperArm: 22, foreArm: 20, armLen: 35, foreLen: 31, hand: 13, thigh: 25, shin: 21, legLen: 28, shinLen: 25, footX: 4, footY: 25, footRx: 18, footRy: 10 },
  blob: { upperArm: 24, foreArm: 22, armLen: 32, foreLen: 28, hand: 13, thigh: 28, shin: 24, legLen: 24, shinLen: 22, footX: 5, footY: 22, footRx: 17, footRy: 10 },
};

/* ------------------------------------------------------------------ */
/* Silhouettes & plush anime curves                                    */
/* ------------------------------------------------------------------ */

// Enhanced anime-cute head points with plush flared cheek fluff
const HEAD_POINTS: Record<SpeciesId, Vec[]> = {
  cat: [
    [0, -135],
    [28, -133],
    [54, -121],
    [72, -99],
    [82, -73],
    [86, -49],
    [95, -41], // upper cheek fluff spike
    [85, -34],
    [93, -24], // lower cheek fluff spike
    [76, -12],
    [52, 0],
    [24, 7],
    [0, 8],    // chin
    [-24, 7],
    [-52, 0],
    [-76, -12],
    [-93, -24],
    [-85, -34],
    [-95, -41],
    [-86, -49],
    [-82, -73],
    [-72, -99],
    [-54, -121],
    [-28, -133],
  ],
  fox: [
    [0, -137],
    [26, -134],
    [52, -122],
    [70, -100],
    [82, -74],
    [88, -48],
    [98, -40], // sharp stylish cheek tuft
    [86, -32],
    [96, -20],
    [72, -6],
    [44, 4],
    [18, 10],
    [0, 11],
    [-18, 10],
    [-44, 4],
    [-72, -6],
    [-96, -20],
    [-86, -32],
    [-98, -40],
    [-88, -48],
    [-82, -74],
    [-70, -100],
    [-52, -122],
    [-26, -134],
  ],
  dog: [
    [0, -132],
    [32, -130],
    [60, -118],
    [78, -96],
    [88, -66],
    [90, -36], // chubby jowls
    [84, -10],
    [68, 6],
    [40, 14],
    [0, 16],
    [-40, 14],
    [-68, 6],
    [-84, -10],
    [-90, -36],
    [-88, -66],
    [-78, -96],
    [-60, -118],
    [-32, -130],
  ],
  bear: [
    [0, -130],
    [34, -128],
    [64, -116],
    [84, -92],
    [92, -62], // ultra chubby cheeks
    [92, -32],
    [84, -6],
    [66, 11],
    [36, 18],
    [0, 19],
    [-36, 18],
    [-66, 11],
    [-84, -6],
    [-92, -32],
    [-92, -62],
    [-84, -92],
    [-64, -116],
    [-34, -128],
  ],
  bunny: [
    [0, -136],
    [26, -133],
    [52, -120],
    [70, -96],
    [80, -68],
    [85, -40],
    [90, -22], // sweet round cheek bulge
    [78, -2],
    [50, 10],
    [24, 16],
    [0, 17],
    [-24, 16],
    [-50, 10],
    [-78, -2],
    [-90, -22],
    [-85, -40],
    [-80, -68],
    [-70, -96],
    [-52, -120],
    [-26, -133],
  ],
  frog: [
    [0, -132],
    [36, -130],
    [68, -116],
    [88, -90],
    [92, -56],
    [88, -24],
    [74, 2],
    [48, 15],
    [22, 21],
    [0, 22],
    [-22, 21],
    [-48, 15],
    [-74, 2],
    [-88, -24],
    [-92, -56],
    [-88, -90],
    [-68, -116],
    [-36, -130],
  ],
  robot: [],
  blob: [
    [0, -140],
    [22, -136],
    [48, -122],
    [68, -96],
    [78, -66],
    [82, -34],
    [86, -8], // mochi squish
    [68, 13],
    [36, 21],
    [0, 22],
    [-36, 21],
    [-68, 13],
    [-86, -8],
    [-82, -34],
    [-78, -66],
    [-68, -96],
    [-48, -122],
    [-22, -136],
  ],
};

const BODY_POINTS: Record<SpeciesId, Vec[]> = {
  cat: [
    [0, -142],
    [28, -140],
    [52, -128],
    [68, -106],
    [75, -78],
    [77, -48],
    [71, -18],
    [55, 4],
    [28, 14],
    [0, 16],
    [-28, 14],
    [-55, 4],
    [-71, -18],
    [-77, -48],
    [-75, -78],
    [-68, -106],
    [-52, -128],
    [-28, -140],
  ],
  dog: [
    [0, -140],
    [32, -138],
    [58, -124],
    [74, -100],
    [82, -70],
    [84, -38],
    [78, -8],
    [60, 8],
    [32, 16],
    [0, 18],
    [-32, 16],
    [-60, 8],
    [-78, -8],
    [-84, -38],
    [-82, -70],
    [-74, -100],
    [-58, -124],
    [-32, -138],
  ],
  fox: [
    [0, -144],
    [26, -142],
    [48, -128],
    [64, -104],
    [72, -76],
    [74, -46],
    [68, -18],
    [52, 4],
    [26, 13],
    [0, 15],
    [-26, 13],
    [-52, 4],
    [-68, -18],
    [-74, -46],
    [-72, -76],
    [-64, -104],
    [-48, -128],
    [-26, -142],
  ],
  bear: [
    [0, -138],
    [32, -136],
    [60, -124],
    [76, -100],
    [84, -70],
    [86, -36],
    [80, -6],
    [62, 10],
    [34, 18],
    [0, 20],
    [-34, 18],
    [-62, 10],
    [-80, -6],
    [-86, -36],
    [-84, -70],
    [-76, -100],
    [-60, -124],
    [-32, -136],
  ],
  bunny: [
    [0, -144],
    [26, -142],
    [48, -128],
    [63, -104],
    [70, -76],
    [72, -46],
    [67, -18],
    [53, 5],
    [26, 14],
    [0, 16],
    [-26, 14],
    [-53, 5],
    [-67, -18],
    [-72, -46],
    [-70, -76],
    [-63, -104],
    [-48, -128],
    [-26, -142],
  ],
  frog: [
    [0, -134],
    [32, -132],
    [58, -120],
    [74, -96],
    [82, -66],
    [83, -34],
    [74, -6],
    [54, 10],
    [26, 18],
    [0, 20],
    [-26, 18],
    [-54, 10],
    [-74, -6],
    [-83, -34],
    [-82, -66],
    [-74, -96],
    [-58, -120],
    [-32, -132],
  ],
  robot: [],
  blob: [
    [0, -142],
    [26, -140],
    [48, -126],
    [64, -102],
    [70, -78],
    [68, -52],
    [74, -28],
    [70, -4],
    [52, 8],
    [26, 15],
    [0, 17],
    [-26, 15],
    [-52, 8],
    [-70, -4],
    [-74, -28],
    [-68, -52],
    [-70, -78],
    [-64, -102],
    [-48, -126],
    [-26, -140],
  ],
};

function bodySilhouette(species: SpeciesId): Path {
  if (species === "robot") return roundRect(-64, -144, 128, 158, 38);
  return smooth(BODY_POINTS[species], true, 0.92);
}

function headSilhouette(species: SpeciesId): Path {
  if (species === "robot") return roundRect(-70, -136, 140, 142, 38);
  return smooth(HEAD_POINTS[species], true, 0.88);
}

// 100% seamless limb generator: strokes outer contours but never the connecting joint seam!
function makeSeamlessUpperLimb(length: number, rootW: number, tipW: number, start = 0) {
  const hr = rootW / 2;
  const ht = tipW / 2;
  const fillPoints: Vec[] = [
    [-hr * 0.9, start],
    [0, start - 2],
    [hr * 0.9, start],
    [hr, start + length * 0.3],
    [ht * 1.05, start + length * 0.7],
    [ht, start + length],
    [-ht, start + length],
    [-ht * 1.05, start + length * 0.7],
    [-hr, start + length * 0.3],
  ];
  const fill = smooth(fillPoints, true, 0.6);

  // Stroke only the outer edges and shoulder - NEVER cross the elbow joint!
  const strokePoints: Vec[] = [
    [-ht, start + length],
    [-ht * 1.05, start + length * 0.7],
    [-hr, start + length * 0.3],
    [-hr * 0.9, start],
    [0, start - 2],
    [hr * 0.9, start],
    [hr, start + length * 0.3],
    [ht * 1.05, start + length * 0.7],
    [ht, start + length],
  ];
  const outline = smooth(strokePoints, false, 0.6);
  return { fill, outline };
}

function makeSeamlessLowerLimb(length: number, rootW: number, tipW: number, start = 0) {
  const hr = rootW / 2;
  const ht = tipW / 2;
  const fillPoints: Vec[] = [
    [-hr, start],
    [hr, start],
    [hr * 0.95, start + length * 0.3],
    [ht * 1.05, start + length * 0.7],
    [ht, start + length],
    [0, start + length + 2],
    [-ht, start + length],
    [-ht * 1.05, start + length * 0.7],
    [-hr * 0.95, start + length * 0.3],
  ];
  const fill = smooth(fillPoints, true, 0.6);

  // Stroke only the sides and wrist/ankle - NEVER cross the top joint!
  const strokePoints: Vec[] = [
    [-hr, start],
    [-hr * 0.95, start + length * 0.3],
    [-ht * 1.05, start + length * 0.7],
    [-ht, start + length],
    [0, start + length + 2],
    [ht, start + length],
    [ht * 1.05, start + length * 0.7],
    [hr * 0.95, start + length * 0.3],
    [hr, start],
  ];
  const outline = smooth(strokePoints, false, 0.6);
  return { fill, outline };
}

function limbPath(length: number, width: number, start = 0): Path {
  return makeSeamlessUpperLimb(length, width, width * 0.72, start).fill;
}

function star(cx: number, cy: number, r: number, points = 4): Path {
  const verts: Vec[] = [];
  const inner = r * 0.28;
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
  const species = spec.species && spec.species in LIMB ? spec.species : "cat";
  const expression: ExpressionId = spec.expression ?? "happy";
  const limbs = LIMB[species];
  const side = spec.seed % 2 === 0 ? 1 : -1;
  const isRobot = species === "robot";
  const isBlob = species === "blob";
  const isFrog = species === "frog";

  // Branded, charming asymmetric anime default stance (no stiff T-pose!)
  const bones: Bone[] = [
    { id: "root", parent: null, x: 210, y: STAGE.ground },
    { id: "body", parent: "root", x: 0, y: -94, rot: 1.5, counterParentScale: false },
    { id: "head", parent: "body", x: 0, y: -142, rot: -2.8, counterParentScale: true },
    { id: "headTop", parent: "head", x: 0, y: 0 },
    { id: "earL", parent: "head", x: -EAR_POS[species][0], y: EAR_POS[species][1], rot: -2.5 },
    { id: "earR", parent: "head", x: EAR_POS[species][0], y: EAR_POS[species][1], rot: 2 },
    { id: "eyeL", parent: "head", x: -EYE_POS[species][0], y: EYE_POS[species][1] },
    { id: "eyeR", parent: "head", x: EYE_POS[species][0], y: EYE_POS[species][1] },
    { id: "armL", parent: "body", x: -64, y: -106, rot: -28, counterParentScale: true },
    { id: "foreL", parent: "armL", x: 0, y: limbs.armLen, rot: 56 },
    { id: "armR", parent: "body", x: 64, y: -106, rot: 12, counterParentScale: true },
    { id: "foreR", parent: "armR", x: 0, y: limbs.armLen, rot: -12 },
    { id: "legL", parent: "body", x: -26, y: -4, rot: -2.5, counterParentScale: true },
    { id: "shinL", parent: "legL", x: 0, y: limbs.legLen, rot: 2 },
    { id: "legR", parent: "body", x: 26, y: -4, rot: 3.5, counterParentScale: true },
    { id: "shinR", parent: "legR", x: 0, y: limbs.legLen, rot: -2 },
    { id: "tail1", parent: "body", x: side * 68, y: -36, rot: side * 36, counterParentScale: true },
    { id: "tail2", parent: "tail1", x: 0, y: -34, rot: side * 20 },
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

  /* ---------------- contact floor shadow ---------------- */
  add("root", 2, [
    shape(ellipse(0, 4, 88, 12), { fill: p.ink, stroke: undefined, opacity: 0.12 }),
    shape(ellipse(0, 2, 60, 7), { fill: p.ink, stroke: undefined, opacity: 0.08 }),
  ]);

  /* ---------------- tail ---------------- */
  if (!isRobot && !isBlob && !isFrog) {
    const thick = species === "fox" ? 30 : species === "bear" ? 18 : species === "bunny" ? 14 : 17;
    const len = species === "fox" ? 48 : species === "bear" ? 24 : species === "bunny" ? 22 : 44;
    const t1 = smooth(
      [
        [-thick * 0.45, 10],
        [thick * 0.55, 8],
        [thick * 0.95, 2],
        [thick * 0.8, -len * 0.45],
        [thick * 0.45, -len * 0.9],
        [0, -len - 2],
        [-thick * 0.55, -len * 0.82],
        [-thick * 0.75, -len * 0.35],
      ],
      true,
      0.8,
    );
    add("tail1", 4, [shape(t1, { fill: p.primary })]);
    if (species === "bunny") {
      add("tail1", 4, [
        shape(ellipse(0, -len - 4, 17, 16), { fill: p.secondary }),
        shape(ellipse(-4, -len - 7, 6, 5), { fill: p.paper, stroke: undefined, opacity: 0.85 }),
      ]);
    } else {
      const t2 = smooth(
        [
          [-thick * 0.4, 6],
          [thick * 0.5, 5],
          [thick * 0.8, -len * 0.35],
          [thick * 0.45, -len * 0.9],
          [0, -len - 4],
          [-thick * 0.48, -len * 0.78],
          [-thick * 0.65, -len * 0.28],
        ],
        true,
        0.8,
      );
      const tipColor = species === "fox" ? p.secondary : p.primary;
      add("tail2", 4, [shape(t2, { fill: tipColor })]);
      if (species === "fox") {
        // Dramatic white plume tip for anime fox
        const tip = smooth(
          [
            [-thick * 0.45, -len * 0.55],
            [thick * 0.52, -len * 0.62],
            [thick * 0.42, -len - 8],
            [0, -len - 12],
            [-thick * 0.52, -len - 4],
          ],
          true,
          0.8,
        );
        add("tail2", 4, [
          shape(tip, { fill: p.paper, stroke: undefined }),
          shape(smooth([[-thick * 0.2, -len * 0.58], [0, -len * 0.75], [thick * 0.2, -len * 0.62]], false, 0.6), {
            fill: undefined,
            stroke: p.ink,
            width: 2.5,
            opacity: 0.4,
          }),
        ]);
      }
    }
  }

  /* ---------------- legs & planted feet ---------------- */
  const legColor = isBlob ? p.secondary : p.primary;
  for (const s of [-1, 1] as const) {
    const leg = s === -1 ? "legL" : "legR";
    const shin = s === -1 ? "shinL" : "shinR";
    if (isRobot) {
      add(leg, 6, [
        shape(roundRect(-10, -6, 20, limbs.legLen + 8, 8), { fill: p.secondary, width: 4 }),
        shape(ellipse(0, 2, 6, 6), { fill: p.accent, width: 3 }),
      ]);
      add(shin, 6, [
        shape(roundRect(-9, 0, 18, limbs.shinLen + 4, 7), { fill: p.primary, width: 4 }),
        shape(roundRect(-16, limbs.shinLen - 4, 32, 20, 8), { fill: p.secondary, width: 4 }),
      ]);
    } else {
      const thigh = makeSeamlessUpperLimb(limbs.legLen, limbs.thigh, limbs.thigh * 0.8);
      add(leg, 6, [
        shape(thigh.fill, { fill: legColor, stroke: undefined }),
        shape(thigh.outline, { fill: undefined, stroke: p.ink, width: 4.5 }),
      ]);
      // Shin with knee joint cover (eliminates puppet joint line!) and plush planted feet
      const shinLimb = makeSeamlessLowerLimb(limbs.shinLen, limbs.shin, limbs.shin * 0.78);
      const shinShapes: Shape[] = [
        shape(shinLimb.fill, { fill: legColor, stroke: undefined }),
        shape(shinLimb.outline, { fill: undefined, stroke: p.ink, width: 4.5 }),
        // Planted plush foot with subtle toe indent
        shape(
          ellipse(
            s * limbs.footX,
            limbs.footY,
            limbs.footRx,
            limbs.footRy,
          ),
          { fill: isBlob ? p.primary : p.secondary },
        ),
        // Toe bean separation lines
        shape(
          polyline([
            [s * limbs.footX - 4, limbs.footY + 2],
            [s * limbs.footX - 4, limbs.footY + limbs.footRy - 1],
          ]),
          { fill: undefined, stroke: p.ink, width: 2, opacity: 0.35 },
        ),
        shape(
          polyline([
            [s * limbs.footX + 4, limbs.footY + 2],
            [s * limbs.footX + 4, limbs.footY + limbs.footRy - 1],
          ]),
          { fill: undefined, stroke: p.ink, width: 2, opacity: 0.35 },
        ),
      ];
      add(shin, 6, shinShapes);
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

  // Base body silhouette
  const body = bodySilhouette(species);
  bodyShapes.push(shape(body, { fill: p.primary, width: 5 }));

  // Cel shade on lower body contour
  bodyShapes.push(
    shape(
      smooth(
        [
          [-54, -2],
          [-28, 12],
          [0, 15],
          [28, 12],
          [54, -2],
          [36, -8],
          [0, -4],
          [-36, -8],
        ],
        true,
        0.7,
      ),
      { fill: p.primaryDeep, stroke: undefined, opacity: 0.4 },
    ),
  );

  // Belly / chest plate
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
        : ellipse(0, -56, 44, 52);
    bodyShapes.push(
      shape(belly, { fill: p.secondary, stroke: undefined, opacity: isFrog ? 0.6 : 0.94 }),
    );
  }

  // Soft chest fluff / neck tuft covering the neck boundary
  if (!isRobot) {
    const chestTuft = smooth(
      [
        [-34, -136],
        [-42, -122],
        [-24, -116],
        [-30, -108],
        [0, -104],
        [30, -108],
        [24, -116],
        [42, -122],
        [34, -136],
      ],
      true,
      0.7,
    );
    bodyShapes.push(shape(chestTuft, { fill: p.secondary, stroke: undefined, opacity: 0.9 }));
  }

  // Pattern on body
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

  // Scarf with signature golden "A" brand charm tag!
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
    // Scarf drape tail
    bodyShapes.push(
      shape(
        smooth(
          [
            [28, scarfY + 12],
            [46, scarfY + 22],
            [52, scarfY + 54],
            [38, scarfY + 48],
            [26, scarfY + 26],
          ],
          true,
          0.6,
        ),
        { fill: p.accent, width: 4 },
      ),
    );
    bodyShapes.push(
      shape(ellipse(34, scarfY + 12, 9, 7), { fill: p.accent, width: 3.5 }),
    );
    // Brand charm: Golden Anitoon "A" tag dangling from the knot
    const charmX = 36;
    const charmY = scarfY + 26;
    bodyShapes.push(
      // Jump ring
      shape(ellipse(charmX, charmY - 6, 3, 3), { fill: "#FFC53D", width: 2 }),
      // Coin tag
      shape(ellipse(charmX, charmY + 2, 7.5, 7.5), { fill: "#FFC53D", width: 2.2 }),
      shape(ellipse(charmX - 2, charmY, 5.5, 5.5), { fill: "#FFEAA0", stroke: undefined }),
      // Engraved "A" monogram
      shape(
        smooth(
          [
            [charmX - 3.5, charmY + 5],
            [charmX, charmY - 3],
            [charmX + 3.5, charmY + 5],
          ],
          false,
          0.2,
        ),
        { fill: undefined, stroke: p.ink, width: 1.8, cap: "round" },
      ),
      shape(
        polyline([
          [charmX - 2.2, charmY + 1.5],
          [charmX + 2.2, charmY + 1.5],
        ]),
        { fill: undefined, stroke: p.ink, width: 1.6, cap: "round" },
      ),
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
        [big ? 2 : 6, big ? -44 : -34],
        [big ? 34 : 24, big ? -68 : -54],
        [big ? 40 : 30, big ? -58 : -46],
        [big ? 28 : 22, -16],
        [22, 14],
      ],
      true,
      0.55,
    );
    // Inner ear fluff with layered tufts
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
    const fluffTuft = smooth(
      [
        [-6, 4],
        [4, -12],
        [12, -4],
        [18, -16],
        [20, 2],
      ],
      true,
      0.6,
    );
    for (const s of [-1, 1] as const) {
      const bone = s === 1 ? "earR" : "earL";
      const flip = (path: Path) =>
        s === 1 ? path : mapPath(path, (v) => [v[0] * -1, v[1]]);
      add(bone, 20, [
        shape(flip(outer), { fill: p.primary, width: 4.5 }),
        shape(flip(inner), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
        shape(flip(fluffTuft), { fill: p.paper, stroke: undefined, opacity: 0.9 }),
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
      add(bone, 20, [
        shape(flip(outer), { fill: p.primaryDeep, width: 4.5 }),
        shape(flip(smooth([[0, 10], [14, 28], [8, 52], [-4, 46]], true, 0.7)), {
          fill: p.primary,
          stroke: undefined,
          opacity: 0.5,
        }),
      ]);
    }
  }

  /* ---------------- arms & seamless joints ---------------- */
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
      // Upper arm: tapered smoothly toward elbow with seamless open joint
      const upper = makeSeamlessUpperLimb(limbs.armLen, limbs.upperArm, limbs.upperArm * 0.76, -4);
      add(arm, 30, [
        shape(upper.fill, { fill: p.primary, stroke: undefined }),
        shape(upper.outline, { fill: undefined, stroke: p.ink, width: 4.5 }),
      ]);

      // Forearm with seamless joint and toe-bean paw!
      const pawY = limbs.foreLen + 5;
      const lower = makeSeamlessLowerLimb(limbs.foreLen, limbs.foreArm, limbs.foreArm * 0.78);
      const foreShapes: Shape[] = [
        shape(lower.fill, { fill: p.primary, stroke: undefined }),
        shape(lower.outline, { fill: undefined, stroke: p.ink, width: 4.5 }),
        // Plush rounded paw
        shape(ellipse(0, pawY, limbs.hand + 1, limbs.hand), { fill: p.secondary, width: 4 }),
        // Sweet toe bean pads!
        shape(ellipse(-5, pawY - 4, 2.6, 2.8), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
        shape(ellipse(0, pawY - 6, 2.8, 3.0), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
        shape(ellipse(5, pawY - 4, 2.6, 2.8), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
        // Heart-shaped main palm pad
        shape(ellipse(0, pawY + 2, 5.2, 4.2), { fill: p.blush, stroke: undefined, opacity: 0.85 }),
      ];
      add(fore, 30, foreShapes);
    }
  }

  /* ---------------- head ---------------- */
  const headShapes: Shape[] = [];
  const head = headSilhouette(species);
  headShapes.push(shape(head, { fill: p.primary, width: 5 }));

  // Soft cel-shading under chin & lower cheeks
  headShapes.push(
    shape(
      smooth(
        [
          [-62, -18],
          [-34, -2],
          [0, 2],
          [34, -2],
          [62, -18],
          [48, -26],
          [0, -18],
          [-48, -26],
        ],
        true,
        0.7,
      ),
      { fill: p.primaryDeep, stroke: undefined, opacity: 0.35 },
    ),
  );

  // Soft forehead highlight
  headShapes.push(
    shape(ellipse(0, -118, 38, 14), { fill: p.paper, stroke: undefined, opacity: 0.22 }),
  );

  if (spec.pattern === "patch") {
    headShapes.push(
      shape(ellipse(-31, -74, 34, 36), {
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
      // Frog eye dome highlight
      headShapes.push(
        shape(ellipse(s * 38 - 4, -114, 7, 5), { fill: p.paper, stroke: undefined, opacity: 0.75 }),
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
      shape(ellipse(-2, -172, 3, 3), { fill: p.paper, stroke: undefined, opacity: 0.85 }),
    );
  }

  if (species === "blob") {
    // Glossy jelly light reflections
    headShapes.push(
      shape(
        smooth(
          [
            [-24, -114],
            [-36, -122],
            [-20, -128],
            [0, -132],
            [24, -128],
            [12, -120],
          ],
          true,
          0.75,
        ),
        { fill: p.paper, stroke: undefined, opacity: 0.4 },
      ),
    );
  }

  // Muzzle for dog, fox, bear
  const muzzle =
    species === "dog" || species === "fox" || species === "bear"
      ? smooth(
          [
            [0, -56],
            [28, -54],
            [44, -36],
            [40, -14],
            [22, 2],
            [0, 4],
            [-22, 2],
            [-40, -14],
            [-44, -36],
            [-28, -54],
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
        opacity: species === "bear" ? 0.85 : 0.94,
      }),
    );
  }

  // Head patterns
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

  // Anime rosy cheeks + cute diagonal blush ticks
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
      // Rosy oval
      headShapes.push(
        shape(ellipse(s * 49, -34, 14, 8), {
          fill: p.blush,
          stroke: undefined,
          opacity: expression === "shy" ? 0.8 : 0.58,
        }),
      );
      // 2 diagonal anime blush hatch lines
      headShapes.push(
        shape(
          polyline([
            [s * 45, -31],
            [s * 48, -37],
          ]),
          { fill: undefined, stroke: p.primaryDeep, width: 1.8, opacity: 0.5 },
        ),
        shape(
          polyline([
            [s * 51, -31],
            [s * 54, -37],
          ]),
          { fill: undefined, stroke: p.primaryDeep, width: 1.8, opacity: 0.5 },
        ),
      );
    }
  }

  // Freckles
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

  // Expressive anime eyebrows tailored to expression!
  for (const s of [-1, 1] as const) {
    let browPath: Path;
    if (expression === "excited") {
      browPath = smooth(
        [
          [s * 14, -110],
          [s * 30, -120],
          [s * 46, -112],
        ],
        false,
        0.7,
      );
    } else if (expression === "shy") {
      browPath = smooth(
        [
          [s * 14, -112],
          [s * 28, -108],
          [s * 44, -102],
        ],
        false,
        0.7,
      );
    } else if (expression === "sleepy") {
      browPath = smooth(
        [
          [s * 16, -100],
          [s * 30, -102],
          [s * 44, -100],
        ],
        false,
        0.6,
      );
    } else if (expression === "determined") {
      browPath = smooth(
        [
          [s * 14, -102],
          [s * 30, -112],
          [s * 46, -116],
        ],
        false,
        0.7,
      );
    } else if (expression === "mischievous") {
      const lift = s === 1 ? -12 : 2;
      browPath = smooth(
        [
          [s * 14, -104 + lift],
          [s * 28, -114 + lift],
          [s * 44, -108 + lift],
        ],
        false,
        0.7,
      );
    } else if (expression === "surprised") {
      browPath = smooth(
        [
          [s * 16, -116],
          [s * 30, -126],
          [s * 46, -118],
        ],
        false,
        0.7,
      );
    } else {
      // happy (default)
      browPath = smooth(
        [
          [s * 16, -104],
          [s * 30, -112],
          [s * 46, -106],
        ],
        false,
        0.7,
      );
    }
    headShapes.push(
      shape(browPath, {
        fill: undefined,
        stroke: p.ink,
        width: 4.2,
        cap: "round",
      }),
    );
  }

  // Tiny cute button nose
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
        shape(ellipse(s * 9, noseY, 2.5, 2), {
          fill: p.ink,
          stroke: undefined,
          opacity: 0.75,
        }),
      );
    }
  } else if (species === "bunny") {
    headShapes.push(
      shape(
        smooth([[-7, noseY - 2], [7, noseY - 2], [0, noseY + 6]], true, 0.4),
        { fill: p.blush, width: 2.8 },
      ),
    );
  } else {
    headShapes.push(
      shape(
        smooth([[-8, noseY - 2], [8, noseY - 2], [0, noseY + 6]], true, 0.4),
        { fill: p.ink, stroke: undefined },
      ),
    );
  }

  // Expressive anime mouth tailored to expression & mouth style
  const my = species === "frog" ? -26 : -26;
  if (expression === "excited" || spec.mouth === "grin") {
    // Wide joyful open grin with teeth and tongue
    const w = species === "frog" ? 34 : 22;
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
    // Pink tongue
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
        { fill: p.blush, stroke: undefined, opacity: 0.95 },
      ),
    );
    // Upper white tooth bar
    headShapes.push(
      shape(roundRect(-w * 0.62, my + 1, w * 1.24, 6, 3), {
        fill: p.paper,
        stroke: undefined,
        opacity: 0.95,
      }),
    );
  } else if (expression === "shy") {
    // Sweet anime ":3" cat mouth
    headShapes.push(
      shape(
        smooth([[-14, my + 2], [-7, my + 6], [0, my + 2]], false, 0.7),
        { fill: undefined, stroke: p.ink, width: 4.5, cap: "round" },
      ),
      shape(
        smooth([[0, my + 2], [7, my + 6], [14, my + 2]], false, 0.7),
        { fill: undefined, stroke: p.ink, width: 4.5, cap: "round" },
      ),
    );
  } else if (expression === "mischievous" || spec.mouth === "smirk") {
    // Sly anime smirk with tiny tooth / fang
    headShapes.push(
      shape(
        smooth(
          [
            [-14, my + 1],
            [-2, my + 5],
            [10, my],
            [18, my - 6],
          ],
          false,
          0.7,
        ),
        { fill: undefined, stroke: p.ink, width: 4.8, cap: "round" },
      ),
      // Cute tiny white fang
      shape(
        smooth([[9, my + 1], [14, my - 2], [11.5, my + 7]], true, 0.3),
        { fill: p.paper, width: 1.8 },
      ),
    );
  } else if (expression === "surprised" || spec.mouth === "o") {
    // Cute open "o" mouth
    headShapes.push(
      shape(ellipse(0, my + 4, 8, 11), { fill: p.ink, width: 3.5 }),
      shape(ellipse(0, my + 8, 4.5, 4), { fill: p.blush, stroke: undefined }),
    );
  } else if (expression === "determined") {
    // Confident smirk
    headShapes.push(
      shape(
        smooth([[-13, my + 4], [0, my + 1], [14, my - 4]], false, 0.65),
        { fill: undefined, stroke: p.ink, width: 4.6, cap: "round" },
      ),
    );
  } else {
    // Happy open smile
    const w = species === "frog" ? 28 : 17;
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
        { fill: undefined, stroke: p.ink, width: 4.8, cap: "round" },
      ),
    );
  }

  // Dog tongue peeking
  if (species === "dog" && (expression === "happy" || expression === "excited")) {
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

  // Bunny buck teeth
  if (species === "bunny") {
    for (const s of [-1, 1] as const) {
      headShapes.push(
        shape(roundRect(s * 7 - 3.5, my + 6, 7, 12, 3), {
          fill: p.paper,
          width: 2.6,
        }),
      );
    }
  }

  // Cat & Fox delicate tapered whiskers
  if (species === "cat" || species === "fox") {
    for (const s of [-1, 1] as const) {
      for (let i = 0; i < 2; i++) {
        const y = -44 + i * 11;
        headShapes.push(
          shape(
            smooth(
              [
                [s * 32, y],
                [s * 58, y - 4 + i * 5],
                [s * 82, y - 7 + i * 8],
              ],
              false,
              0.4,
            ),
            {
              fill: undefined,
              stroke: p.ink,
              width: 2.2,
              opacity: 0.6,
            },
          ),
        );
      }
    }
  }

  add("head", 40, headShapes);

  /* ---------------- eyes (large anime glossy eyes with two catchlights) ---------------- */
  const eyeZ = spec.eyes === "visor" && isRobot ? 46 : 50;
  for (const s of [-1, 1] as const) {
    const bone = s === -1 ? "eyeL" : "eyeR";
    const eyes: Shape[] = [];

    // Wink on mischievous expression (right eye winks, left eye open sparkle!)
    const isWink = expression === "mischievous" && s === 1;

    if (isWink || spec.eyes === "happy") {
      // Classic joyful curved anime arch (^ . ^) with eyelash flick
      eyes.push(
        shape(
          smooth([[-18, 4], [-9, -9], [9, -9], [18, 4]], false, 0.8),
          { fill: undefined, stroke: p.ink, width: 5.5, cap: "round" },
        ),
        shape(
          polyline([[15, 2], [22, -3]]),
          { fill: undefined, stroke: p.ink, width: 4, cap: "round" },
        ),
      );
    } else if (spec.eyes === "sleepy" || expression === "sleepy") {
      // Heavy sleepy eyelid half-covering glossy iris
      eyes.push(
        shape(ellipse(0, 0, 19, 22), { fill: p.paper, width: 3.6 }),
        shape(ellipse(0, 6, 14, 16), { fill: p.accent, stroke: undefined }),
        shape(ellipse(0, 6, 7.5, 10), { fill: p.ink, stroke: undefined }),
        shape(ellipse(-4, 3, 4.2, 4.2), { fill: p.paper, stroke: undefined }),
        shape(
          smooth([[-20, -2], [-10, 5], [10, 5], [20, -2]], false, 0.7),
          { fill: undefined, stroke: p.ink, width: 5.5, cap: "round" },
        ),
        shape(
          smooth([[-14, -8], [0, -6], [14, -8]], false, 0.6),
          { fill: undefined, stroke: p.ink, width: 2, opacity: 0.3 },
        ),
      );
    } else if (spec.eyes === "dot") {
      // Glossy chibi bead eye with two catchlights
      eyes.push(
        shape(ellipse(0, 0, 14, 16), { fill: p.ink, stroke: undefined }),
        shape(ellipse(-4, -4.5, 4.8, 5.2), { fill: p.paper, stroke: undefined }),
        shape(ellipse(4, 5, 2.5, 2.5), { fill: p.paper, stroke: undefined, opacity: 0.85 }),
        shape(
          smooth([[-15, -8], [0, -14], [15, -8]], false, 0.6),
          { fill: undefined, stroke: p.ink, width: 3.8, cap: "round" },
        ),
      );
    } else if (spec.eyes === "visor") {
      // Visor eye
      eyes.push(
        shape(roundRect(-15, -8, 30, 16, 7), { fill: p.ink, stroke: undefined }),
        shape(roundRect(-11, -6, 22, 12, 5), { fill: p.accent, stroke: undefined }),
        shape(ellipse(0, 0, 6, 5), { fill: p.paper, stroke: undefined }),
      );
    } else {
      // Large glossy anime eye with sclera, two-tone iris, pupil, TWO catchlights, lash flick
      const gazeY = expression === "shy" ? 3 : 1;
      const gazeX = expression === "shy" ? -s * 1.5 : 0;
      // 1. Sclera
      eyes.push(shape(ellipse(0, 0, 20, 25), { fill: p.paper, width: 3.6 }));
      // 2. Outer iris
      eyes.push(shape(ellipse(gazeX, gazeY + 2, 15, 19), { fill: p.accent, stroke: undefined }));
      // 3. Iris top shadow
      eyes.push(shape(ellipse(gazeX, gazeY - 3, 15, 11), { fill: p.ink, stroke: undefined, opacity: 0.35 }));
      // 4. Iris bottom glass reflection
      eyes.push(
        shape(
          smooth(
            [
              [gazeX - 11, gazeY + 7],
              [gazeX - 6, gazeY + 15],
              [gazeX, gazeY + 16],
              [gazeX + 6, gazeY + 15],
              [gazeX + 11, gazeY + 7],
              [gazeX, gazeY + 9],
            ],
            true,
            0.6,
          ),
          { fill: p.paper, stroke: undefined, opacity: 0.45 },
        ),
      );
      // 5. Dark center pupil
      eyes.push(shape(ellipse(gazeX, gazeY + 2, 8, 11), { fill: p.ink, stroke: undefined }));
      // 6. Catchlight 1 (large primary)
      eyes.push(shape(ellipse(gazeX - 5, gazeY - 4, 5.2, 5.8), { fill: p.paper, stroke: undefined }));
      // 7. Catchlight 2 (sweet secondary)
      eyes.push(shape(ellipse(gazeX + 5, gazeY + 8, 2.8, 2.8), { fill: p.paper, stroke: undefined, opacity: 0.9 }));
      // 8. Cute star sparkle if excited
      if (expression === "excited") {
        eyes.push(shape(star(gazeX + 6, gazeY - 5, 3.6), { fill: p.paper, stroke: undefined }));
      }
      // 9. Bold curved anime top eyelash line with outer corner flick
      eyes.push(
        shape(
          smooth([[-19, -6], [-10, -22], [5, -22], [20, -14], [25, -18]], false, 0.75),
          { fill: undefined, stroke: p.ink, width: 5.2, cap: "round" },
        ),
      );
      // 10. Delicate lower lid rim
      eyes.push(
        shape(
          smooth([[-12, 21], [0, 23], [12, 21]], false, 0.6),
          { fill: undefined, stroke: p.ink, width: 2.2, opacity: 0.5 },
        ),
      );
    }
    add(bone, eyeZ, eyes);
  }

  /* ---------------- top accessories & cute ahoge hair tuft ---------------- */
  const top: Shape[] = [];

  // Adorable ahoge / hair tuft on headTop for that signature anime-plush charm!
  if (!isRobot && !isFrog) {
    top.push(
      shape(
        smooth(
          [
            [0, -135],
            [6, -148],
            [-4, -162],
            [8, -172],
            [14, -162],
            [4, -150],
            [0, -135],
          ],
          true,
          0.65,
        ),
        { fill: p.primary, width: 3.5 },
      ),
    );
  }

  if (spec.accessories.includes("glasses")) {
    const zGlasses = 62;
    const lenses: Shape[] = [];
    for (const s of [-1, 1] as const) {
      lenses.push(
        shape(ellipse(s * 32, -74, 27, 25), {
          fill: p.paper,
          stroke: p.ink,
          width: 4.5,
          opacity: 0.18,
        }),
      );
      lenses.push(
        shape(ellipse(s * 32, -74, 27, 25), {
          fill: undefined,
          stroke: p.ink,
          width: 5,
        }),
      );
    }
    lenses.push(
      shape(
        smooth([[-6, -74], [0, -78], [6, -74]], false, 0.5),
        { fill: undefined, stroke: p.ink, width: 4.5 },
      ),
    );
    for (const s of [-1, 1] as const) {
      lenses.push(
        shape(
          smooth(
            [
              [s * 59, -76],
              [s * 68, -84],
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
