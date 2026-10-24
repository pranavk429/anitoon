"""Build Mochi, the Anitoon 3D flagship mascot.

Usage:
    blender -b --python tools/blender/build_mochi.py -- [--render] [--export]

The script is deterministic and writes:
    public/three/mochi.glb
    .shots3d/*.png
"""

from __future__ import annotations

import math
import os
import sys

import bpy
import bmesh
from mathutils import Euler, Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import mochi_anim

from mochi_lib import (  # noqa: E402
    catmull_rom,
    ellipsoid,
    lerp,
    mesh_object,
    principled,
    reset_scene,
    smooth,
    smoothstep,
    srgb,
    torus,
    tube,
)

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
DO_RENDER = "--render" in ARGS
DO_EXPORT = "--export" in ARGS or not DO_RENDER
OUT_DIR = os.path.join(ROOT, ".shots3d")
GLB_PATH = os.path.join(ROOT, "public", "three", "mochi.glb")

# ---------------------------------------------------------------------------
# palette
# ---------------------------------------------------------------------------

C_FUR = srgb("#F0924A")
C_FUR_DEEP = srgb("#C9662B")
C_FUR_LIGHT = srgb("#F7B97C")
C_CREAM = srgb("#FFF0DC")
C_CREAM_DEEP = srgb("#F6DFC2")
C_PINK = srgb("#F3A6B2")
C_BLUSH = srgb("#FF8E7E")
C_NOSE = srgb("#D5736E")
C_MOUTH = srgb("#42241F")
C_TONGUE = srgb("#F2787F")
C_EYE_WHITE = srgb("#FFFDF8")
C_IRIS = srgb("#2339C9")
C_IRIS_DEEP = srgb("#4E6CFF")
C_PUPIL = srgb("#10173A")
C_BLUE = srgb("#3C55FF")
C_BLUE_DEEP = srgb("#2438C9")
C_GOLD = srgb("#FFC53D")
C_GOLD_DEEP = srgb("#E9A312")
C_INK = srgb("#2A201A")

# ---------------------------------------------------------------------------
# materials
# ---------------------------------------------------------------------------

M = {}


def build_materials() -> None:
    M["fur"] = principled("Mochi_Fur", C_FUR, roughness=0.82, specular=0.3, sheen=0.25)
    M["fur_deep"] = principled("Mochi_FurDeep", C_FUR_DEEP, roughness=0.85, specular=0.25)
    M["fur_light"] = principled("Mochi_FurLight", C_FUR_LIGHT, roughness=0.84, specular=0.25)
    M["cream"] = principled("Mochi_Cream", C_CREAM, roughness=0.86, specular=0.22, sheen=0.25)
    M["cream_deep"] = principled("Mochi_CreamDeep", C_CREAM_DEEP, roughness=0.88, specular=0.2)
    M["pink"] = principled("Mochi_Pink", C_PINK, roughness=0.8, specular=0.25)
    M["blush"] = principled("Mochi_Blush", C_BLUSH, roughness=0.9, alpha=0.72, emission=C_BLUSH, emission_strength=0.05)
    M["nose"] = principled("Mochi_Nose", C_NOSE, roughness=0.42, specular=0.6)
    M["mouth"] = principled("Mochi_Mouth", C_MOUTH, roughness=0.55, specular=0.35)
    M["tongue"] = principled("Mochi_Tongue", C_TONGUE, roughness=0.55, specular=0.4)
    M["eye_white"] = principled("Mochi_EyeWhite", C_EYE_WHITE, roughness=0.16, specular=0.7)
    M["iris"] = principled("Mochi_Iris", C_IRIS, roughness=0.2, specular=0.7)
    M["iris_deep"] = principled("Mochi_IrisDeep", C_IRIS_DEEP, roughness=0.3, specular=0.6)
    M["pupil"] = principled("Mochi_Pupil", C_PUPIL, roughness=0.12, specular=0.8)
    M["highlight"] = principled("Mochi_Highlight", (1, 1, 1), roughness=0.1, specular=0.9, emission=(1, 1, 1), emission_strength=0.6)
    M["lash"] = principled("Mochi_Lash", C_INK, roughness=0.55)
    M["blue"] = principled("Mochi_Scarf", C_BLUE, roughness=0.62, specular=0.35, sheen=0.35)
    M["blue_deep"] = principled("Mochi_ScarfFold", C_BLUE_DEEP, roughness=0.65, specular=0.3)
    M["gold"] = principled("Mochi_Gold", C_GOLD, roughness=0.28, metallic=0.72, specular=0.6)
    M["gold_deep"] = principled("Mochi_GoldDeep", C_GOLD_DEEP, roughness=0.35, metallic=0.6)
    M["ink"] = principled("Mochi_Ink", C_INK, roughness=0.5)


# ---------------------------------------------------------------------------
# geometry
# ---------------------------------------------------------------------------

HEAD_C = Vector((0.0, 0.0, 1.34))
HEAD_R = Vector((0.505, 0.455, 0.455))
EYE = {"L": Vector((0.205, -0.402, 1.425)), "R": Vector((-0.205, -0.402, 1.425))}


def head_deform(p: Vector) -> Vector:
    d = p - HEAD_C
    nx = d.x / HEAD_R.x
    ny = d.y / HEAD_R.y
    nz = d.z / HEAD_R.z
    # Chubby lower cheeks: push the lower sides outward.
    cheek = math.exp(-((nz + 0.4) / 0.42) ** 2) * (1.0 - ny * 0.35)
    d.x *= 1.0 + 0.115 * cheek
    d.z *= 1.0 + 0.015 * cheek
    # A soft, slightly flat face makes the features sit cleanly.
    if ny < 0:
        d.y *= 1.0 - 0.05 * (-ny) ** 1.5
    # Gently flatten the crown so the ears read separately.
    if nz > 0.55:
        d.z -= 0.012 * smoothstep(0.55, 1.0, nz)
    return HEAD_C + d


def build_head() -> bpy.types.Object:
    ob = ellipsoid(
        "Mochi_Head",
        HEAD_C,
        HEAD_R,
        M["fur"],
        segments=96,
        rings=64,
        deform=head_deform,
    )
    return ob


def ear_shape(center: Vector, flip: float) -> object:
    rx, ry, rz = 0.215, 0.080, 0.205
    c = Vector((center.x, center.y, center.z))
    tilt = -0.40 * flip
    back = -0.10

    def deform(p: Vector) -> Vector:
        d = p - c
        nz = d.z / rz
        taper = 1.0 - 0.62 * smoothstep(-0.25, 1.0, nz) ** 1.05
        d.x *= taper
        d.y *= 0.86 * taper
        d.x += 0.055 * smoothstep(-0.1, 1.0, nz) * flip
        d.z += 0.018 * smoothstep(0.4, 1.0, nz)
        rot = Matrix.Rotation(tilt, 3, "Y") @ Matrix.Rotation(back, 3, "X")
        return c + rot @ d

    return ellipsoid(
        "Ear" + ("L" if flip > 0 else "R"),
        c,
        (rx, ry, rz),
        M["fur"],
        segments=48,
        rings=32,
        deform=deform,
    )


def build_ears() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    ears = []
    inners = []
    for flip, label in ((1, "L"), (-1, "R")):
        c = Vector((0.300 * flip, 0.015, 1.740))
        ear = ear_shape(c, flip)
        ear.name = f"Mochi_Ear.{label}"
        ears.append(ear)
        inner_c = Vector((0.300 * flip, -0.048, 1.740))
        inner = ear_shape(inner_c, flip)
        inner.name = f"Mochi_EarInner.{label}"
        # scale about the ear centre rather than the origin
        for v in inner.data.vertices:
            d = v.co - inner_c
            v.co = inner_c + Vector((d.x * 0.64, d.y * 0.55, d.z * 0.63))
        inner.data.materials.clear()
        inner.data.materials.append(M["pink"])
        smooth(inner)
        inners.append(inner)
    return ears[0], ears[1], inners[0], inners[1]


def build_body() -> bpy.types.Object:
    ob = ellipsoid(
        "Mochi_Body",
        (0.0, 0.0, 0.655),
        (0.375, 0.335, 0.445),
        M["fur"],
        segments=80,
        rings=56,
    )
    # plush pear silhouette: a touch wider at the base
    for v in ob.data.vertices:
        z = v.co.z
        f = 1.0 + 0.08 * smoothstep(0.85, 0.35, z)
        v.co.x *= f
        v.co.y *= f
    smooth(ob)
    return ob


ARM_EXT = 1.22
ARM_SHOULDER = Vector((0.275, -0.010, 0.905))
ARM_ELBOW_OFF = Vector((0.180, -0.060, -0.295))
ARM_WRIST_OFF = Vector((0.187, -0.110, -0.450))


def arm_points(flip: float) -> list[Vector]:
    def p(off: Vector) -> Vector:
        return Vector((ARM_SHOULDER.x * flip + off.x * flip, ARM_SHOULDER.y + off.y, ARM_SHOULDER.z + off.z))

    return [
        p(Vector((-0.185, 0.010, 0.065))),
        p(Vector((0.0, 0.0, 0.0))),
        p(Vector((0.120, -0.020, -0.125)) * ARM_EXT),
        p(ARM_ELBOW_OFF * ARM_EXT),
        p(ARM_WRIST_OFF * ARM_EXT),
    ]


def build_arm(flip: float) -> bpy.types.Object:
    pts = arm_points(flip)
    label = "L" if flip > 0 else "R"

    def weights(t: float) -> dict[str, float]:
        f = smoothstep(0.60, 0.90, t)
        return {f"upperarm.{label}": 1 - f, f"forearm.{label}": f}

    return tube(
        f"Mochi_Arm.{label}",
        pts,
        [0.132, 0.128, 0.118, 0.102, 0.082],
        M["fur"],
        segments=22,
        samples_per_segment=12,
        weight_fn=weights,
    )


def build_shoulder(flip: float) -> bpy.types.Object:
    label = "L" if flip > 0 else "R"
    c = arm_points(flip)[1] + Vector((0.0, 0.0, 0.005))
    return ellipsoid(
        f"Mochi_Shoulder.{label}",
        c,
        (0.138, 0.132, 0.142),
        M["fur"],
        segments=40,
        rings=28,
    )


def build_paw(flip: float) -> bpy.types.Object:
    label = "L" if flip > 0 else "R"
    wrist = arm_points(flip)[-1]
    c = wrist + Vector((0.0, -0.035, -0.050))
    paw = ellipsoid(
        f"Mochi_Paw.{label}",
        c,
        (0.118, 0.112, 0.118),
        M["fur"],
        segments=48,
        rings=32,
    )
    # soft mitten dimple
    for v in paw.data.vertices:
        d = v.co - c
        if d.z < -0.03 and d.y < 0:
            v.co.z += 0.012 * smoothstep(0.0, 0.08, -d.z)
    smooth(paw)
    return paw


def build_beans(flip: float) -> list[bpy.types.Object]:
    label = "L" if flip > 0 else "R"
    beans = []
    wrist = arm_points(flip)[-1]
    c = wrist + Vector((0.0, -0.035, -0.050))
    base = c + Vector((0.0, -0.108, 0.012))
    for i, (dx, dz, s) in enumerate(((-0.036, 0.008, 0.023), (0.0, 0.016, 0.027), (0.036, 0.008, 0.023))):
        b = ellipsoid(
            f"Mochi_Bean.{label}.{i}",
            (base.x + dx, base.y, base.z + dz),
            (s, s * 0.35, s * 1.05),
            M["pink"],
            segments=24,
            rings=16,
        )
        beans.append(b)
    b = ellipsoid(
        f"Mochi_BeanPad.{label}",
        (base.x, base.y + 0.006, base.z - 0.034),
        (0.052, 0.012, 0.040),
        M["pink"],
        segments=24,
        rings=16,
    )
    beans.append(b)
    return beans


def leg_points(flip: float) -> list[Vector]:
    return [
        Vector((0.185 * flip, -0.005, 0.500)),
        Vector((0.205 * flip, -0.020, 0.310)),
        Vector((0.210 * flip, -0.045, 0.155)),
    ]


def build_leg(flip: float) -> bpy.types.Object:
    pts = leg_points(flip)
    label = "L" if flip > 0 else "R"

    def weights(t: float) -> dict[str, float]:
        f = smoothstep(0.35, 0.72, t)
        return {f"thigh.{label}": 1 - f, f"shin.{label}": f}

    return tube(
        f"Mochi_Leg.{label}",
        pts,
        [0.118, 0.105, 0.088],
        M["fur"],
        segments=20,
        samples_per_segment=10,
        weight_fn=weights,
    )


def build_foot(flip: float) -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    label = "L" if flip > 0 else "R"
    c = Vector((0.212 * flip, -0.105, 0.085))
    foot = ellipsoid(
        f"Mochi_Foot.{label}",
        c,
        (0.155, 0.205, 0.086),
        M["cream"],
        segments=48,
        rings=32,
    )
    for v in foot.data.vertices:
        d = v.co - c
        # squash the sole flat onto the floor
        if d.z < -0.075:
            v.co.z = c.z - 0.083
    smooth(foot)
    toes = []
    for i, dx in enumerate((-0.072, 0.0, 0.072)):
        t = ellipsoid(
            f"Mochi_Toe.{label}.{i}",
            (c.x + dx, c.y - 0.165, c.z + 0.018),
            (0.037, 0.045, 0.032),
            M["cream"],
            segments=24,
            rings=16,
        )
        toes.append(t)
    return foot, toes


def tail_control() -> list[Vector]:
    return [
        Vector((-0.02, 0.245, 0.560)),
        Vector((0.00, 0.450, 0.680)),
        Vector((0.08, 0.580, 0.880)),
        Vector((0.22, 0.630, 1.100)),
        Vector((0.40, 0.580, 1.240)),
        Vector((0.55, 0.440, 1.220)),
        Vector((0.62, 0.300, 1.100)),
    ]


def build_tail() -> bpy.types.Object:
    def weights(t: float) -> dict[str, float]:
        if t < 0.42:
            f = smoothstep(0.18, 0.46, t)
            return {"tail1": 1 - f, "tail2": f}
        f = smoothstep(0.55, 0.86, t)
        return {"tail2": 1 - f, "tail3": f}

    tail = tube(
        "Mochi_Tail",
        tail_control(),
        [0.115, 0.112, 0.108, 0.098, 0.082, 0.062, 0.040],
        M["fur"],
        segments=20,
        samples_per_segment=8,
        weight_fn=weights,
        secondary_material=M["fur_deep"],
        secondary_after=0.86,
        cap_end=True,
    )
    return tail


def build_face() -> dict[str, bpy.types.Object]:
    parts: dict[str, bpy.types.Object] = {}
    parts["muzzle"] = ellipsoid(
        "Mochi_Muzzle",
        (0.0, -0.405, 1.198),
        (0.225, 0.108, 0.148),
        M["cream"],
        segments=64,
        rings=40,
    )
    # nose: two soft lobes + a rounded point
    nose_l = ellipsoid("Mochi_NoseL", (-0.017, -0.523, 1.272), (0.026, 0.021, 0.022), M["nose"], segments=24, rings=16)
    nose_r = ellipsoid("Mochi_NoseR", (0.017, -0.523, 1.272), (0.026, 0.021, 0.022), M["nose"], segments=24, rings=16)
    nose_tip = ellipsoid("Mochi_NoseTip", (0.0, -0.527, 1.250), (0.025, 0.019, 0.024), M["nose"], segments=24, rings=16)
    parts["nose"] = merge_and_remesh("Mochi_Nose", [nose_l, nose_r, nose_tip], 0.006, M["nose"])

    # blush
    for flip, label in ((1, "L"), (-1, "R")):
        b = ellipsoid(
            f"Mochi_Blush.{label}",
            (0.318 * flip, -0.365, 1.245),
            (0.092, 0.011, 0.050),
            M["blush"],
            segments=32,
            rings=20,
            rotation=(0, 0.0, -0.15 * flip),
        )
        faces_to_cull = []
        for poly in b.data.polygons:
            poly.material_index = 0
        parts[f"blush.{label}"] = b

    # whiskers
    for flip, label in ((1, "L"), (-1, "R")):
        for i, (z, lift) in enumerate(((1.255, 0.02), (1.205, -0.015))):
            pts = [
                Vector((0.175 * flip, -0.500, z)),
                Vector((0.300 * flip, -0.505, z + lift)),
                Vector((0.440 * flip, -0.455, z + lift * 1.9)),
            ]
            w = tube(
                f"Mochi_Whisker.{label}.{i}",
                pts,
                [0.0055, 0.0040, 0.0012],
                M["cream_deep"],
                segments=8,
                samples_per_segment=8,
                cap_start=False,
                cap_end=True,
            )
            parts[f"whisker.{label}.{i}"] = w

    # brows: soft tapered fur strokes
    for flip, label in ((1, "L"), (-1, "R")):
        pts = [
            Vector((0.128 * flip, -0.362, 1.558)),
            Vector((0.205 * flip, -0.358, 1.575)),
            Vector((0.285 * flip, -0.340, 1.558)),
        ]
        brow = tube(
            f"Mochi_BrowMesh.{label}",
            pts,
            [0.0045, 0.011, 0.0055],
            M["fur_deep"],
            segments=12,
            samples_per_segment=8,
            cap_start=True,
            cap_end=True,
        )
        parts[f"brow.{label}"] = brow

    # mouth ribbon with shape keys
    parts["mouth"] = build_mouth()
    parts["ahoge"] = build_ahoge()
    for i, stripe in enumerate(build_forehead_stripes()):
        parts[f"stripe.{i}"] = stripe
    return parts


def mouth_profile(kind: str, i: int, n: int) -> tuple[float, float, float]:
    """Return (x, z_top, z_bottom) for mouth shape key *kind*."""
    u = (i / (n - 1)) * 2 - 1  # -1..1
    if kind == "neutral":
        w = 0.104
        x = u * w
        top = 1.158 + 0.018 * u * u
        bottom = top - 0.016 - 0.004 * u * u
    elif kind == "smile":
        w = 0.118
        x = u * w
        top = 1.160 + 0.030 * u * u
        bottom = top - 0.014 - 0.009 * (1 - u * u)
    elif kind == "grin":
        w = 0.116
        x = u * w
        top = 1.166 + 0.040 * u * u
        bottom = top - 0.030 - 0.105 * (1 - u * u) ** 0.7
    elif kind == "o":
        w = 0.064
        x = u * w
        top = 1.160 + 0.012 * (1 - u * u)
        bottom = 1.108 - 0.012 * (1 - u * u)
    elif kind == "smirk":
        w = 0.112
        x = u * w
        top = 1.156 + 0.020 * u + 0.034 * u * u
        bottom = top - 0.020 - 0.030 * (1 - u * u) * (1 if u > -0.2 else 0.2)
    elif kind == "flat":
        w = 0.100
        x = u * w
        top = 1.152 + 0.008 * u * u
        bottom = top - 0.013
    else:
        raise ValueError(kind)
    return x, top, bottom


def build_mouth() -> bpy.types.Object:
    n = 19
    verts = []
    # top row then bottom row
    for kind_row in ("top", "bottom"):
        for i in range(n):
            x, top, bottom = mouth_profile("neutral", i, n)
            z = top if kind_row == "top" else bottom
            y = -0.530 + 0.024 * (abs(x) / 0.118) ** 2
            if kind_row == "bottom":
                y += 0.004
            verts.append(Vector((x, y, z)))
    faces = []
    for i in range(n - 1):
        faces.append([i, i + 1, n + i + 1, n + i])
    ob = mesh_object("Mochi_Mouth", verts, faces, M["mouth"])
    ob.shape_key_add(name="Basis", from_mix=False)
    for kind in ("smile", "grin", "o", "smirk", "flat"):
        key = ob.shape_key_add(name=kind, from_mix=False)
        for row in range(2):
            for i in range(n):
                x, top, bottom = mouth_profile(kind, i, n)
                z = top if row == 0 else bottom
                y = -0.530 + 0.024 * (abs(x) / 0.118) ** 2
                if row == 1:
                    y += 0.004
                key.data[row * n + i].co = (x, y, z)
    for key in ob.data.shape_keys.key_blocks:
        key.value = 0.0
    ob.data.shape_keys.key_blocks["smile"].value = 1.0
    return ob


def build_scarf() -> dict[str, bpy.types.Object]:
    parts = {}
    ring = torus(
        "Mochi_ScarfRing",
        (0.0, 0.0, 1.030),
        0.355,
        0.078,
        M["blue"],
        scale=(1.03, 1.0, 0.80),
        rotation=(0.10, 0.0, 0.0),
        major_segments=80,
        minor_segments=18,
    )
    # push the front of the scarf up a touch for an easy, slouched look
    for v in ring.data.vertices:
        if v.co.y < -0.1:
            v.co.z += 0.012 * smoothstep(0.1, 0.4, -v.co.y)
    parts["ring"] = ring

    knot = ellipsoid(
        "Mochi_ScarfKnot",
        (0.205, -0.305, 0.990),
        (0.075, 0.062, 0.072),
        M["blue_deep"],
        segments=32,
        rings=20,
    )
    parts["knot"] = knot

    # hanging scarf ribbon (rounded cloth strip)
    path = [
        Vector((0.205, -0.310, 0.975)),
        Vector((0.215, -0.350, 0.900)),
        Vector((0.235, -0.365, 0.825)),
        Vector((0.255, -0.360, 0.750)),
        Vector((0.265, -0.340, 0.700)),
    ]
    width = 0.135
    thickness = 0.038
    verts = []
    # cross-sections: 4 corners per station
    for p in path:
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            verts.append(Vector((p.x + sx * width * 0.5, p.y + sy * thickness * 0.5, p.z)))
    faces = []
    for i in range(len(path) - 1):
        a = i * 4
        b = (i + 1) * 4
        for s in range(4):
            faces.append([a + s, a + (s + 1) % 4, b + (s + 1) % 4, b + s])
    # end caps
    faces.append([0, 3, 2, 1])
    e = (len(path) - 1) * 4
    faces.append([e, e + 1, e + 2, e + 3])
    ribbon = mesh_object("Mochi_ScarfRibbon", verts, faces, M["blue"])
    parts["ribbon"] = ribbon

    # a thin lighter fold on the ribbon
    fold_pts = [
        Vector((0.190, -0.338, 0.955)),
        Vector((0.195, -0.372, 0.885)),
        Vector((0.225, -0.383, 0.815)),
        Vector((0.240, -0.378, 0.745)),
    ]
    fold = tube(
        "Mochi_ScarfFold",
        fold_pts,
        [0.008, 0.007, 0.006, 0.004],
        M["blue_deep"],
        segments=8,
        samples_per_segment=6,
        cap_start=False,
        cap_end=False,
    )
    parts["fold"] = fold

    # gold charm, a round tag with the Anitoon A
    charm = build_charm()
    parts.update(charm)
    return parts


def build_charm() -> dict[str, bpy.types.Object]:
    parts = {}
    disc = None
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48,
        radius=0.072,
        depth=0.020,
        location=(0.272, -0.372, 0.735),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    disc = bpy.context.object
    disc.name = "Mochi_CharmDisc"
    bevel = disc.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.007
    bevel.segments = 3
    bpy.context.view_layer.objects.active = disc
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    disc.data.materials.append(M["gold"])
    smooth(disc)
    parts["charm_disc"] = disc

    ring = torus(
        "Mochi_CharmLoop",
        (0.272, -0.372, 0.808),
        0.020,
        0.007,
        M["gold_deep"],
        scale=(1, 1, 1),
        rotation=(math.pi / 2, 0, 0),
        major_segments=24,
        minor_segments=8,
    )
    parts["charm_loop"] = ring

    bpy.ops.object.text_add(location=(0.272, -0.386, 0.735), rotation=(math.pi / 2, 0, 0))
    text = bpy.context.object
    text.name = "Mochi_CharmA"
    text.data.body = "A"
    text.data.align_x = "CENTER"
    text.data.align_y = "CENTER"
    text.data.size = 0.095
    text.data.extrude = 0.003
    text.data.bevel_depth = 0.0015
    text.data.bevel_resolution = 1
    text.data.materials.append(M["ink"])
    bpy.context.view_layer.objects.active = text
    bpy.ops.object.convert(target="MESH")
    text = bpy.context.object
    if len(text.data.polygons) > 1200:
        dec = text.modifiers.new("Decimate", "DECIMATE")
        dec.ratio = 0.5
        bpy.ops.object.modifier_apply(modifier=dec.name)
    smooth(text)
    parts["charm_a"] = text
    return parts


def head_surface_y(x: float, z: float) -> float:
    nx = x / HEAD_R.x
    nz = (z - HEAD_C.z) / HEAD_R.z
    rem = max(0.0, 1.0 - nx * nx - nz * nz)
    return -HEAD_R.y * math.sqrt(rem)


def build_forehead_stripes() -> list[bpy.types.Object]:
    stripes = []
    for i, (x, lean, top) in enumerate(
        ((-0.105, -0.015, 1.728), (0.0, 0.0, 1.748), (0.105, 0.015, 1.728))
    ):
        pts = []
        for t in (0.0, 0.35, 0.7, 1.0):
            z = lerp(1.600, top, t)
            xx = x + lean * t * 4 + 0.006 * math.sin(t * 3.1)
            y = head_surface_y(xx, z) - 0.003
            pts.append(Vector((xx, y, z)))
        s = tube(
            f"Mochi_Stripe.{i}",
            pts,
            [0.006, 0.013, 0.014, 0.006],
            M["fur_deep"],
            segments=10,
            samples_per_segment=6,
            cap_start=True,
            cap_end=True,
        )
        stripes.append(s)
    return stripes


def build_ahoge() -> bpy.types.Object:
    pts = [
        Vector((0.0, 0.035, 1.780)),
        Vector((0.010, 0.030, 1.865)),
        Vector((0.050, 0.010, 1.935)),
        Vector((0.120, -0.015, 1.948)),
        Vector((0.160, -0.030, 1.900)),
        Vector((0.155, -0.040, 1.858)),
    ]
    return tube(
        "Mochi_Ahoge",
        pts,
        [0.040, 0.030, 0.022, 0.015, 0.008, 0.002],
        M["fur"],
        segments=14,
        samples_per_segment=8,
        weight_fn=lambda t: {"ahoge": 1.0},
        cap_start=True,
        cap_end=True,
    )

# ---------------------------------------------------------------------------
# armature
# ---------------------------------------------------------------------------


def build_armature() -> bpy.types.Object:
    arm_data = bpy.data.armatures.new("MochiRigData")
    arm_obj = bpy.data.objects.new("MochiRig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add(name, head, tail, parent=None, deform=True, roll=0.0):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        b.roll = roll
        b.use_deform = deform
        if parent:
            b.parent = eb[parent]
        return b

    add("root", (0, 0, 0.02), (0, 0, 0.16), deform=False)
    add("hips", (0, 0, 0.44), (0, 0, 0.56), "root")
    add("spine", (0, 0, 0.56), (0, 0, 0.78), "hips")
    add("chest", (0, 0, 0.78), (0, 0, 0.99), "spine")
    add("neck", (0, 0, 0.99), (0, 0, 1.08), "chest")
    add("head", (0, 0, 1.08), (0, 0, 1.53), "neck")
    add("ear.L", (0.30, 0.01, 1.60), (0.40, 0.02, 1.88), "head")
    add("ear.R", (-0.30, 0.01, 1.60), (-0.40, 0.02, 1.88), "head")
    add("ahoge", (0.0, 0.04, 1.79), (0.12, -0.03, 1.95), "head")

    for flip, label in ((1, "L"), (-1, "R")):
        a = arm_points(flip)
        add(f"shoulder.{label}", (0.12 * flip, 0, 0.915), (a[0].x, a[0].y, a[0].z), "chest")
        add(f"upperarm.{label}", a[0], a[2], f"shoulder.{label}")
        add(f"forearm.{label}", a[2], a[3], f"upperarm.{label}")
        add(f"hand.{label}", a[3], a[3] + Vector((0, -0.080 * 1.0, -0.050 * 1.0)), f"forearm.{label}")
        add(f"thigh.{label}", (0.185 * flip, -0.005, 0.50), (0.205 * flip, -0.02, 0.31), "hips")
        add(f"shin.{label}", (0.205 * flip, -0.02, 0.31), (0.210 * flip, -0.045, 0.155), f"thigh.{label}")
        add(f"foot.{label}", (0.210 * flip, -0.045, 0.155), (0.212 * flip, -0.20, 0.075), f"shin.{label}")

    add("tail1", (-0.02, 0.245, 0.56), (0.08, 0.58, 0.88), "hips")
    add("tail2", (0.08, 0.58, 0.88), (0.40, 0.58, 1.24), "tail1")
    add("tail3", (0.40, 0.58, 1.24), (0.62, 0.30, 1.10), "tail2")
    add("scarfTail", (0.205, -0.31, 0.975), (0.265, -0.34, 0.70), "chest")

    bpy.ops.object.mode_set(mode="OBJECT")
    arm_obj.show_in_front = True
    arm_obj.data.display_type = "OCTAHEDRAL"
    return arm_obj


def bind_skinned(ob: bpy.types.Object, arm: bpy.types.Object) -> None:
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    mod.use_vertex_groups = True
    ob.parent = arm


def assign_weights_by_z(ob: bpy.types.Object) -> None:
    groups = {
        name: ob.vertex_groups.new(name=name)
        for name in ("hips", "spine", "chest")
    }
    for v in ob.data.vertices:
        z = v.co.z
        w_hips = 1.0 - smoothstep(0.44, 0.70, z)
        w_chest = smoothstep(0.80, 1.02, z)
        w_spine = max(0.0, 1.0 - w_hips - w_chest)
        total = w_hips + w_spine + w_chest
        for name, w in (("hips", w_hips), ("spine", w_spine), ("chest", w_chest)):
            if w > 1e-5:
                groups[name].add([v.index], w / total, "REPLACE")


def bone_parent(ob: bpy.types.Object, arm: bpy.types.Object, bone: str) -> None:
    """Parent while preserving world transform, including bone-tail offset."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    arm.select_set(True)
    arm.data.bones.active = arm.data.bones[bone]
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="BONE", keep_transform=True)


def parent_keep(ob: bpy.types.Object, parent: bpy.types.Object) -> None:
    world = ob.matrix_world.copy()
    ob.parent = parent
    ob.matrix_world = world


def make_empty(name: str, loc: Sequence[float]) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.05
    e.location = Vector(loc)
    bpy.context.scene.collection.objects.link(e)
    return e


def merge_and_remesh(
    name: str,
    objects: list[bpy.types.Object],
    voxel: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.clear()
    ob.data.materials.append(material)
    mod = ob.modifiers.new("Remesh", "REMESH")
    mod.mode = "VOXEL"
    mod.voxel_size = voxel
    mod.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    sm = ob.modifiers.new("Smooth", "SMOOTH")
    sm.factor = 0.55
    sm.iterations = 4
    bpy.ops.object.modifier_apply(modifier=sm.name)
    smooth(ob)
    return ob


def build_belly_patch(body: bpy.types.Object) -> bpy.types.Object:
    import bmesh
    bm = bmesh.new()
    rings = 9
    segs = 40
    verts = [bm.verts.new((0.0, -0.60, 0.64))]
    for r in range(1, rings):
        rr = r / (rings - 1)
        for s in range(segs):
            a = 2 * math.pi * s / segs
            verts.append(bm.verts.new((math.cos(a) * 0.205 * rr, -0.60, 0.64 + math.sin(a) * 0.235 * rr)))
    bm.verts.ensure_lookup_table()
    for s in range(segs):
        bm.faces.new((verts[0], verts[1 + s], verts[1 + (s + 1) % segs]))
    for r in range(1, rings - 1):
        base = 1 + (r - 1) * segs
        nbase = 1 + r * segs
        for s in range(segs):
            bm.faces.new(
                (
                    verts[base + s],
                    verts[nbase + s],
                    verts[nbase + (s + 1) % segs],
                    verts[base + (s + 1) % segs],
                )
            )
    me = bpy.data.meshes.new("Mochi_Belly")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Mochi_Belly", me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(M["cream"])
    smooth(ob)
    mod = ob.modifiers.new("Shrinkwrap", "SHRINKWRAP")
    mod.target = body
    mod.wrap_method = "NEAREST_SURFACEPOINT"
    mod.offset = 0.004
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth(ob)
    return ob


# ---------------------------------------------------------------------------
# assembly
# ---------------------------------------------------------------------------


def build_character() -> bpy.types.Object:
    build_materials()
    arm = build_armature()

    head = build_head()
    head.vertex_groups.new(name="head").add(list(range(len(head.data.vertices))), 1.0, "REPLACE")
    bind_skinned(head, arm)

    body = build_body()
    assign_weights_by_z(body)
    bind_skinned(body, arm)

    for flip, label in ((1, "L"), (-1, "R")):
        arm_mesh = build_arm(flip)
        bind_skinned(arm_mesh, arm)
        shoulder = build_shoulder(flip)
        bone_parent(shoulder, arm, f"upperarm.{label}")
        paw = build_paw(flip)
        bone_parent(paw, arm, f"hand.{label}")
        for bean in build_beans(flip):
            parent_keep(bean, paw)

        leg = build_leg(flip)
        bind_skinned(leg, arm)
        foot, toes = build_foot(flip)
        bone_parent(foot, arm, f"foot.{label}")
        for toe in toes:
            parent_keep(toe, foot)

    tail = build_tail()
    bind_skinned(tail, arm)
    # tail tip lives with tail3
    tip = bpy.data.objects.get("Mochi_TailTip")
    if tip:
        bone_parent(tip, arm, "tail3")

    ears = build_ears()
    for ear, inner, label in ((ears[0], ears[2], "L"), (ears[1], ears[3], "R")):
        bone_parent(ear, arm, f"ear.{label}")
        parent_keep(inner, ear)

    face = build_face()

    # muzzle, nose and whiskers ride the head
    for key in ("muzzle", "whisker.L.0", "whisker.L.1", "whisker.R.0", "whisker.R.1"):
        bone_parent(face[key], arm, "head")
    bone_parent(face["nose"], arm, "head")

    # mouth + tongue
    bone_parent(face["mouth"], arm, "head")

    # eyes: empty hierarchy so gaze and blink can be procedural
    for label in ("L", "R"):
        sign = 1 if label == "L" else -1
        eye_c = EYE[label]
        eye = make_empty(f"Eye.{label}", eye_c)
        bone_parent(eye, arm, "head")
        sclera = ellipsoid(
            f"Mochi_Sclera.{label}",
            eye_c,
            (0.119, 0.058, 0.148),
            M["eye_white"],
            segments=48,
            rings=32,
            rotation=(0, 0.0, 0.14 * sign),
        )
        parent_keep(sclera, eye)

        rim = ellipsoid(
            f"Mochi_EyeRim.{label}",
            eye_c,
            (0.1198, 0.054, 0.1492),
            M["lash"],
            segments=48,
            rings=32,
            rotation=(0, 0.0, 0.14 * sign),
        )
        # nudge the rim up, then remove the lower half so it reads as an
        # upper eyeliner rather than a heavy outline
        for v in rim.data.vertices:
            if v.co.z > eye_c.z:
                v.co.z += 0.002
        bm = bmesh.new()
        bm.from_mesh(rim.data)
        doomed = [f for f in bm.faces if f.calc_center_median().z < eye_c.z + 0.020]
        bmesh.ops.delete(bm, geom=doomed, context="FACES")
        bm.to_mesh(rim.data)
        bm.free()
        rim.data.update()
        parent_keep(rim, eye)

        iris = make_empty(f"Iris.{label}", (eye_c.x, -0.452, eye_c.z - 0.006))
        parent_keep(iris, eye)
        iris_mesh = ellipsoid(
            f"Mochi_Iris.{label}",
            (eye_c.x, -0.452, eye_c.z - 0.006),
            (0.092, 0.026, 0.124),
            M["iris"],
            segments=40,
            rings=28,
        )
        parent_keep(iris_mesh, iris)
        pupil = ellipsoid(
            f"Mochi_Pupil.{label}",
            (eye_c.x, -0.466, eye_c.z - 0.008),
            (0.043, 0.017, 0.068),
            M["pupil"],
            segments=32,
            rings=20,
        )
        parent_keep(pupil, iris)
        hl1 = ellipsoid(
            f"Mochi_Highlight.{label}.0",
            (eye_c.x - 0.032, -0.485, eye_c.z + 0.052),
            (0.031, 0.010, 0.038),
            M["highlight"],
            segments=24,
            rings=16,
        )
        parent_keep(hl1, iris)
        hl2 = ellipsoid(
            f"Mochi_Highlight.{label}.1",
            (eye_c.x + 0.028, -0.487, eye_c.z - 0.050),
            (0.014, 0.007, 0.017),
            M["highlight"],
            segments=20,
            rings=12,
        )
        parent_keep(hl2, iris)

        # blink line hidden below the eye until needed
        blink = make_empty(f"Blink.{label}", (eye_c.x, -0.472, eye_c.z - 0.005))
        bone_parent(blink, arm, "head")
        b1 = ellipsoid(
            f"Mochi_BlinkLine.{label}",
            (eye_c.x, -0.472, eye_c.z - 0.005),
            (0.084, 0.009, 0.010),
            M["lash"],
            segments=24,
            rings=12,
        )
        parent_keep(b1, blink)
        blink.scale = (0.001, 0.001, 0.001)

        # blush
        b = face[f"blush.{label}"]
        bone_parent(b, arm, "head")

    # brows on pivots
    for label in ("L", "R"):
        b = face[f"brow.{label}"]
        pivot = make_empty(f"Brow.{label}", (0.205 if label == "L" else -0.205, -0.358, 1.570))
        bone_parent(pivot, arm, "head")
        parent_keep(b, pivot)


    ahoge = face["ahoge"]
    bind_skinned(ahoge, arm)
    for i in range(3):
        bone_parent(face[f"stripe.{i}"], arm, "head")
    scarf = build_scarf()
    bone_parent(scarf["ring"], arm, "chest")
    bone_parent(scarf["knot"], arm, "chest")
    bone_parent(scarf["ribbon"], arm, "scarfTail")
    bone_parent(scarf["fold"], arm, "scarfTail")
    bone_parent(scarf["charm_disc"], arm, "scarfTail")
    bone_parent(scarf["charm_loop"], arm, "scarfTail")
    bone_parent(scarf["charm_a"], arm, "scarfTail")

    return arm


def build_lash(label: str, center: Vector, sign: float) -> bpy.types.Object:
    """Anime lash arc sitting on the upper rim of the eye."""
    pts = []
    steps = 16
    for i in range(steps):
        t = i / (steps - 1)
        ang = math.radians(168 - 138 * t)
        x = center.x + math.cos(ang) * 0.117 * sign
        z = center.z + math.sin(ang) * 0.132
        y = -0.461
        if t > 0.9:
            # outer lash flick
            x += 0.020 * sign * ((t - 0.9) / 0.1)
            z += 0.016 * ((t - 0.9) / 0.1)
        pts.append(Vector((x, y, z)))
    return tube(
        f"Mochi_Lash.{label}",
        pts,
        [0.0045, 0.0070, 0.0078, 0.0082, 0.0086, 0.0086, 0.0082, 0.0078, 0.0078, 0.0078, 0.0080, 0.0082, 0.0088, 0.0095, 0.0105, 0.0115],
        M["lash"],
        segments=8,
        samples_per_segment=4,
        cap_start=True,
        cap_end=True,
    )


# ---------------------------------------------------------------------------
# lighting / render
# ---------------------------------------------------------------------------


def build_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.fps = 60
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.62, 0.58, 0.5)
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (*srgb("#E9E4D8"), 1)
    bg.inputs[1].default_value = 0.55
    scene.eevee.taa_render_samples = 48
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_options.use_denoise = True

    # floor
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "StudioFloor"
    mat = principled("StudioFloor", srgb("#E6E0D3"), roughness=0.95)
    floor.data.materials.append(mat)

    # backdrop curve
    bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 3.4, 4.0), rotation=(math.pi / 2, 0, 0))
    backdrop = bpy.context.object
    backdrop.name = "StudioBackdrop"
    bmat = principled("StudioBackdrop", srgb("#EFEBE1"), roughness=1.0)
    backdrop.data.materials.append(bmat)

    # camera
    bpy.ops.object.camera_add(location=(2.6, -5.2, 2.35))
    cam = bpy.context.object
    cam.name = "MochiCam"
    cam.data.lens = 70
    scene.camera = cam
    target = make_empty("CamTarget", (0, 0, 0.95))
    c = cam.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

    def area(name, loc, energy, size, color, shape="DISK"):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = shape
        data.size = size
        data.color = color
        ob = bpy.data.objects.new(name, data)
        ob.location = loc
        bpy.context.scene.collection.objects.link(ob)
        tr = ob.constraints.new("TRACK_TO")
        tr.target = target
        tr.track_axis = "TRACK_NEGATIVE_Z"
        tr.up_axis = "UP_Y"
        return ob

    area("Key", (-3.4, -3.0, 4.4), 620, 4.0, (1.0, 0.94, 0.84))
    area("Fill", (3.8, -2.2, 2.4), 240, 3.5, (0.78, 0.86, 1.0))
    area("Rim", (1.2, 3.4, 3.6), 520, 3.0, (1.0, 0.82, 0.65))
    area("Bounce", (0.0, -1.4, 0.15), 45, 2.4, (1.0, 0.96, 0.9))

    # soft contact shadow helper plane not needed; EEVEE raytracing gives it.


def render_still(name: str, cam_loc, target=(0, 0, 0.98), lens=70) -> None:
    scene = bpy.context.scene
    cam = scene.camera
    cam.location = Vector(cam_loc)
    cam.data.lens = lens
    t = bpy.data.objects.get("CamTarget")
    t.location = Vector(target)
    bpy.context.view_layer.update()
    os.makedirs(OUT_DIR, exist_ok=True)
    scene.render.filepath = os.path.join(OUT_DIR, name)
    bpy.ops.render.render(write_still=True)


def do_renders() -> None:
    views = {
        "hero": ((2.8, -5.2, 2.1), (0, 0, 1.02), 72),
        "front": ((0.0, -5.4, 1.55), (0, 0, 1.0), 70),
        "threequarter": ((3.2, -4.6, 2.0), (0, 0, 1.0), 70),
        "side": ((5.1, -0.7, 1.7), (0, 0, 0.98), 70),
        "back": ((1.4, 5.1, 2.0), (0, 0, 1.0), 70),
        "closeup": ((1.2, -3.0, 1.85), (0, 0, 1.42), 85),
    }
    for name, (loc, target, lens) in views.items():
        render_still(name, loc, target, lens)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main() -> None:
    reset_scene()
    arm = build_character()
    bpy.context.scene.render.fps = 60
    mochi_anim.bake_actions(arm, fps=60, key_step=2)
    if DO_EXPORT:
        os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
        # selection only would need lights/camera excluded; export whole scene
        # after hiding the studio set.
        for name in ("StudioFloor", "StudioBackdrop", "MochiCam", "Key", "Fill", "Rim", "Bounce", "CamTarget"):
            ob = bpy.data.objects.get(name)
            if ob:
                ob.hide_render = True
        bpy.ops.export_scene.gltf(
            filepath=GLB_PATH,
            export_format="GLB",
            use_selection=False,
            export_apply=False,
            export_yup=True,
            export_animations=True,
            export_animation_mode="ACTIONS",
            export_nla_strips=False,
            export_force_sampling=True,
            export_frame_step=1,
            export_optimize_animation_size=True,
            export_optimize_animation_keep_anim_armature=True,
            export_anim_slide_to_zero=True,
            export_anim_single_armature=True,
            export_skins=True,
            export_morph=True,
            export_morph_normal=True,
            export_cameras=False,
            export_lights=False,
            export_extras=True,
        )
        print("WROTE", GLB_PATH, os.path.getsize(GLB_PATH))
    build_scene()
    if DO_RENDER:
        do_renders()


if __name__ == "__main__":
    main()
