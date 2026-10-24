"""Authoring for Mochi's six signature moves.

All poses are described in world-space Euler offsets (degrees) relative to the
rest pose and converted into local bone space, which keeps the intent of a
pose readable even as the hierarchy rotates.
"""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Callable

import bpy
from mathutils import Quaternion, Vector

TAU = math.pi * 2.0

BONES = [
    "root",
    "hips",
    "spine",
    "chest",
    "neck",
    "head",
    "ear.L",
    "ear.R",
    "ahoge",
    "shoulder.L",
    "upperarm.L",
    "forearm.L",
    "hand.L",
    "shoulder.R",
    "upperarm.R",
    "forearm.R",
    "hand.R",
    "thigh.L",
    "shin.L",
    "foot.L",
    "thigh.R",
    "shin.R",
    "foot.R",
    "tail1",
    "tail2",
    "tail3",
    "scarfTail",
]

CLIPS = [
    ("idle", 4.0),
    ("wave", 3.6),
    ("jump", 3.0),
    ("dance", 4.0),
    ("think", 4.0),
    ("celebrate", 3.2),
]


def rad(deg: float) -> float:
    return math.radians(deg)


def smoothstep(a: float, b: float, x: float) -> float:
    if a == b:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def ease_in_out(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def curve(t: float, points: list[tuple[float, float]]) -> float:
    """Piecewise smoothstep curve, clamped outside the supplied range."""
    if t <= points[0][0]:
        return points[0][1]
    if t >= points[-1][0]:
        return points[-1][1]
    for i in range(len(points) - 1):
        t0, v0 = points[i]
        t1, v1 = points[i + 1]
        if t0 <= t <= t1:
            return v0 + (v1 - v0) * ease_in_out((t - t0) / (t1 - t0))
    return points[-1][1]


class Pose:
    def __init__(self) -> None:
        self.rot: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
        self.loc: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
        self.scale: dict[str, list[float]] = defaultdict(lambda: [1.0, 1.0, 1.0])

    def r(self, bone: str, x: float = 0.0, y: float = 0.0, z: float = 0.0) -> "Pose":
        self.rot[bone][0] += rad(x)
        self.rot[bone][1] += rad(y)
        self.rot[bone][2] += rad(z)
        return self

    def t(self, bone: str, x: float = 0.0, y: float = 0.0, z: float = 0.0) -> "Pose":
        self.loc[bone][0] += x
        self.loc[bone][1] += y
        self.loc[bone][2] += z
        return self

    def s(self, bone: str, x: float = 1.0, y: float = 1.0, z: float = 1.0) -> "Pose":
        self.scale[bone][0] *= x
        self.scale[bone][1] *= y
        self.scale[bone][2] *= z
        return self


# ---------------------------------------------------------------------------
# organic base layers
# ---------------------------------------------------------------------------


def breathing(p: Pose, t: float, period: float, amp: float = 1.0) -> None:
    """A common living layer: breath, sway, blink-adjacent head motion."""
    a = TAU * t / period
    p.t("root", x=0.007 * amp * math.sin(a + 0.2), z=0.006 * amp * math.sin(2 * a + 0.35))
    p.r("hips", x=0.8 * amp * math.sin(2 * a), y=1.8 * amp * math.sin(a + 0.4))
    p.r("spine", x=1.0 * amp * math.sin(2 * a + 0.6), y=-1.1 * amp * math.sin(a + 0.6))
    p.r("chest", x=-0.7 * amp * math.sin(2 * a + 0.9), y=0.7 * amp * math.sin(a + 1.0))
    p.r("neck", x=1.4 * amp * math.sin(2 * a + 1.1), z=1.8 * amp * math.sin(a + 0.3))
    p.r("head", x=1.2 * amp * math.sin(2 * a + 1.2), y=1.6 * amp * math.sin(a + 1.1), z=3.2 * amp * math.sin(a + 0.5))
    p.r("ear.L", x=2.4 * amp * math.sin(2 * a + 1.5), z=3.0 * amp * math.sin(a + 1.3))
    p.r("ear.R", x=2.1 * amp * math.sin(2 * a + 1.9), z=-2.6 * amp * math.sin(a + 1.8))
    p.r("upperarm.L", x=1.2 * amp * math.sin(2 * a + 1.4), y=-1.0 * amp * math.sin(a + 0.9))
    p.r("upperarm.R", x=1.1 * amp * math.sin(2 * a + 1.8), y=1.0 * amp * math.sin(a + 1.2))
    p.r("forearm.L", x=1.6 * amp * math.sin(2 * a + 1.9))
    p.r("forearm.R", x=1.4 * amp * math.sin(2 * a + 2.3))
    p.r("tail1", z=2.6 * amp * math.sin(a + 0.4), x=1.2 * amp * math.sin(2 * a))
    p.r("tail2", z=4.2 * amp * math.sin(a - 0.15), x=1.8 * amp * math.sin(2 * a + 0.4))
    p.r("tail3", z=6.0 * amp * math.sin(a - 0.65), x=2.4 * amp * math.sin(2 * a + 0.8))
    p.r("ahoge", x=3.2 * amp * math.sin(2 * a + 1.6), y=2.6 * amp * math.sin(a + 0.8))
    p.r("scarfTail", x=2.0 * amp * math.sin(2 * a + 1.0), z=1.6 * amp * math.sin(a + 0.2))


# ---------------------------------------------------------------------------
# idle
# ---------------------------------------------------------------------------


def idle(t: float) -> Pose:
    p = Pose()
    a = TAU * t / 4.0
    breathing(p, t, 4.0, amp=1.0)
    # an extra slow look and weight shift so the loop never feels metronomic
    p.t("root", x=0.006 * math.sin(a + 0.7))
    p.r("hips", z=1.4 * math.sin(a + 0.2))
    p.r("chest", z=-0.8 * math.sin(a + 0.3))
    p.r("head", z=3.6 * math.sin(a + 0.9), y=1.2 * math.sin(2 * a + 0.4))
    p.r("ear.L", z=2.2 * math.sin(a + 2.0))
    p.r("ear.R", z=-1.8 * math.sin(a + 2.3))
    p.r("tail2", z=2.4 * math.sin(a + 1.4))
    p.r("tail3", z=3.4 * math.sin(a + 1.1))
    return p


# ---------------------------------------------------------------------------
# wave
# ---------------------------------------------------------------------------


def wave(t: float) -> Pose:
    p = Pose()
    breathing(p, t, 3.6, amp=0.5)
    u = t / 3.6
    raise_amt = smoothstep(0.04, 0.22, u) * (1.0 - smoothstep(0.82, 0.97, u))
    osc = math.sin(TAU * 3.2 * (u - 0.22) + 0.2) * raise_amt
    bob = math.sin(TAU * 1.8 * u) * raise_amt

    # solved greeting: paw up in front of the chest, palm out, clear of the head
    p.r("upperarm.L", x=-81.2 * raise_amt, y=1.8 * raise_amt, z=-14.1 * raise_amt)
    p.r("forearm.L", x=31.8 * raise_amt, y=-40.6 * raise_amt, z=-39.6 * raise_amt + 5 * osc)
    p.r("hand.L", x=129.8 * raise_amt, y=11.7 * raise_amt, z=140.0 * raise_amt + 10 * osc)
    p.r("shoulder.L", y=-3 * raise_amt)

    # the free arm settles inward; asymmetry keeps the pose alive
    p.r("upperarm.R", x=4 * raise_amt, y=-12 * raise_amt)
    p.r("forearm.R", x=-42 * raise_amt, z=4 * raise_amt)
    p.r("hand.R", x=-8 * raise_amt)

    p.r("hips", y=1.4 * raise_amt, z=-2.0 * raise_amt)
    p.r("spine", y=0.8 * raise_amt)
    p.r("chest", y=-1.2 * raise_amt, z=2.0 * raise_amt)
    p.r("neck", x=1.0 * raise_amt, y=-2.0 * raise_amt, z=1.6 * raise_amt)
    p.r("head", x=-2.0 * raise_amt, y=-2.6 * raise_amt, z=2.5 * raise_amt)
    p.t("root", x=0.006 * raise_amt, z=0.008 * bob)

    p.r("ear.L", x=-4.0 * raise_amt, z=6.0 * raise_amt)
    p.r("ear.R", x=2.0 * raise_amt, z=-2.0 * raise_amt)
    p.r("tail1", z=-2.0 * raise_amt)
    p.r("tail2", z=-5.0 * raise_amt + 4.0 * osc)
    p.r("tail3", z=-8.0 * raise_amt + 8.0 * osc)
    p.r("ahoge", x=2.0 * bob, y=-4.0 * osc)
    p.r("scarfTail", x=2.0 * bob, z=-2.0 * osc)
    p.r("thigh.L", y=0.8 * raise_amt)
    p.r("thigh.R", y=-0.8 * raise_amt)
    return p


# ---------------------------------------------------------------------------
# jump
# ---------------------------------------------------------------------------


def jump(t: float) -> Pose:
    p = Pose()
    # the ground story: a real anticipation, launch, hang, fall and squash
    lift = curve(
        t,
        [
            (0.0, 0.0),
            (0.18, -0.09),
            (0.30, 0.0),
            (0.46, 0.48),
            (0.64, 0.64),
            (0.78, 0.58),
            (0.96, 0.0),
            (1.04, -0.075),
            (1.16, 0.012),
            (1.34, 0.0),
            (3.0, 0.0),
        ],
    )
    crouch = curve(
        t,
        [(0.0, 0.0), (0.18, 1.0), (0.30, 0.15), (0.42, 0.0), (0.92, 0.0), (1.04, 0.9), (1.16, 0.22), (1.34, 0.0), (3.0, 0.0)],
    )
    stretch = curve(
        t,
        [(0.0, 0.0), (0.18, 0.0), (0.31, 0.85), (0.5, 0.65), (0.7, 0.3), (0.9, 0.0), (1.0, 0.0), (1.16, 0.15), (1.3, 0.0), (3.0, 0.0)],
    )
    airborne = curve(t, [(0.0, 0.0), (0.34, 0.0), (0.44, 1.0), (0.86, 1.0), (0.99, 0.0), (3.0, 0.0)])
    arms_up = curve(t, [(0.0, 0.0), (0.2, 0.0), (0.36, 0.8), (0.55, 1.0), (0.72, 0.65), (0.9, 0.2), (1.0, 0.0), (3.0, 0.0)])
    land_arms = curve(t, [(0.0, 0.0), (0.9, 0.0), (1.02, 1.0), (1.2, 0.35), (1.4, 0.0), (3.0, 0.0)])

    p.t("root", z=lift)
    p.s("root", x=1.0 + 0.05 * crouch - 0.015 * stretch, y=1.0 + 0.05 * crouch - 0.015 * stretch, z=1.0 - 0.075 * crouch + 0.035 * stretch)

    p.r("hips", x=13 * crouch - 2 * stretch)
    p.r("spine", x=9 * crouch - 2 * stretch)
    p.r("chest", x=4 * crouch - 2 * stretch)
    p.r("neck", x=-6 * crouch + 5 * stretch)
    p.r("head", x=-5 * crouch + 8 * airborne, z=3 * math.sin(t * 4) * airborne)

    p.r("thigh.L", x=-26 * crouch - 30 * airborne, y=2 * airborne)
    p.r("shin.L", x=52 * crouch + 58 * airborne)
    p.r("foot.L", x=-16 * crouch + 28 * airborne)
    p.r("thigh.R", x=-26 * crouch - 24 * airborne, y=-2 * airborne)
    p.r("shin.R", x=52 * crouch + 50 * airborne)
    p.r("foot.R", x=-16 * crouch + 24 * airborne)

    out = max(arms_up, 0.72 * land_arms)
    p.r("upperarm.L", x=22 * crouch - 62.7 * out, y=-41.9 * out, z=37.3 * out)
    p.r("forearm.L", x=8 * crouch - 58.5 * out, y=-46.3 * out, z=28.0 * out)
    p.r("hand.L", x=79.5 * out, y=-64.1 * out, z=-136.4 * out)
    p.r("upperarm.R", x=22 * crouch - 62.7 * out, y=41.9 * out, z=-37.3 * out)
    p.r("forearm.R", x=8 * crouch - 58.5 * out, y=46.3 * out, z=-28.0 * out)
    p.r("hand.R", x=79.5 * out, y=64.1 * out, z=136.4 * out)

    p.r("ear.L", x=10 * crouch - 12 * airborne, z=4 * airborne)
    p.r("ear.R", x=10 * crouch - 10 * airborne, z=-4 * airborne)
    p.r("tail1", x=10 * crouch - 14 * airborne, z=4 * airborne)
    p.r("tail2", x=6 * crouch - 10 * airborne, z=6 * airborne)
    p.r("tail3", x=4 * crouch - 6 * airborne, z=8 * airborne)
    p.r("ahoge", x=8 * crouch - 12 * airborne)
    p.r("scarfTail", x=-8 * airborne)

    # settle breathing after landing
    settle = smoothstep(1.2, 1.6, t) * (1.0 - smoothstep(2.6, 3.0, t))
    if t > 1.2:
        a = TAU * (t - 1.2) / 1.8
        p.r("spine", x=1.0 * math.sin(2 * a) * settle)
        p.r("chest", x=-1.2 * math.sin(2 * a + 0.5) * settle)
        p.r("head", z=2.0 * math.sin(a) * settle)
        p.r("tail2", z=3.0 * math.sin(a + 0.3) * settle)
    return p


# ---------------------------------------------------------------------------
# dance
# ---------------------------------------------------------------------------


def dance(t: float) -> Pose:
    p = Pose()
    breathing(p, t, 4.0, amp=0.45)
    a = TAU * t / 4.0
    sway = math.sin(2 * a)
    bounce = 0.5 - 0.5 * math.cos(4 * a)
    p.t("root", x=0.048 * sway, z=0.020 * bounce)
    p.s("root", x=1.0 + 0.012 * bounce, y=1.0 + 0.012 * bounce, z=1.0 - 0.02 * bounce)
    p.r("hips", y=9 * sway, z=5.0 * math.sin(2 * a + 0.3), x=1.5 * math.sin(4 * a))
    p.r("spine", y=-4.5 * sway, x=1.0 * math.sin(4 * a + 0.4))
    p.r("chest", y=-5.5 * sway, z=-3.5 * math.sin(2 * a + 0.2))
    p.r("neck", z=3.0 * math.sin(2 * a + 0.7))
    p.r("head", z=-7.0 * math.sin(2 * a + 0.5), y=4.0 * math.sin(2 * a + 1.2), x=2.0 * math.sin(4 * a + 0.8))

    env_l = max(0.0, math.sin(2 * a + 0.1)) ** 1.25
    env_r = max(0.0, -math.sin(2 * a + 0.1)) ** 1.25
    p.r("shoulder.L", y=-6 * env_l)
    p.r("upperarm.L", x=-62.7 * env_l, y=-41.9 * env_l, z=37.3 * env_l)
    p.r("forearm.L", x=-58.5 * env_l, y=-46.3 * env_l, z=28.0 * env_l)
    p.r("hand.L", x=79.5 * env_l, y=-64.1 * env_l, z=-136.4 * env_l + 12 * math.sin(4 * a) * env_l)
    p.r("shoulder.R", y=6 * env_r)
    p.r("upperarm.R", x=-62.7 * env_r, y=41.9 * env_r, z=-37.3 * env_r)
    p.r("forearm.R", x=-58.5 * env_r, y=46.3 * env_r, z=-28.0 * env_r)
    p.r("hand.R", x=79.5 * env_r, y=64.1 * env_r, z=136.4 * env_r + 12 * math.sin(4 * a + 1.0) * env_r)

    p.r("thigh.L", x=-8 * bounce, y=4 * sway)
    p.r("shin.L", x=12 * bounce)
    p.r("foot.L", x=-6 * bounce)
    p.r("thigh.R", x=-8 * (1 - bounce), y=4 * sway)
    p.r("shin.R", x=12 * (1 - bounce))
    p.r("foot.R", x=-6 * (1 - bounce))

    p.r("ear.L", x=6 * math.sin(2 * a + 1.5), z=5 * math.sin(2 * a + 1.1))
    p.r("ear.R", x=5 * math.sin(2 * a + 2.0), z=-5 * math.sin(2 * a + 1.5))
    p.r("tail1", z=8 * math.sin(2 * a + 0.6))
    p.r("tail2", z=14 * math.sin(2 * a + 0.1))
    p.r("tail3", z=20 * math.sin(2 * a - 0.4))
    p.r("ahoge", x=8 * math.sin(4 * a + 1.2), y=6 * math.sin(2 * a + 0.4))
    p.r("scarfTail", x=4 * math.sin(4 * a + 0.8), z=4 * math.sin(2 * a + 0.2))
    return p


# ---------------------------------------------------------------------------
# think
# ---------------------------------------------------------------------------


def think(t: float) -> Pose:
    p = Pose()
    breathing(p, t, 4.0, amp=0.65)
    a = TAU * t / 4.0
    # hand to chin, head tilted, weight parked on one leg
    p.r("upperarm.L", x=-64.2, y=1.1, z=-20.4)
    p.r("forearm.L", x=-47.0, y=-21.6, z=-13.4)
    p.r("hand.L", x=-12, y=8)
    p.r("shoulder.L", x=-3, y=5)
    p.r("upperarm.R", x=6, y=16)
    p.r("forearm.R", x=-42, z=-4)
    p.r("hand.R", x=-10)
    p.r("hips", y=-2.5, z=3.5)
    p.r("spine", y=1.5)
    p.r("chest", y=2.0, z=-2.0)
    p.r("neck", x=3.0, y=2.0, z=3.0)
    p.r("head", x=4.0, y=4.0, z=5.0)
    p.r("head", x=1.8 * math.sin(2 * a + 0.8), z=2.0 * math.sin(a + 0.4))
    p.t("root", x=-0.012)
    p.r("thigh.L", x=-5, y=3)
    p.r("thigh.R", x=3, y=-2)
    p.r("ear.L", x=-4, z=5)
    p.r("ear.R", x=2, z=-4)
    p.r("ear.L", z=2.5 * math.sin(a + 1.0))
    p.r("ear.R", z=-2.0 * math.sin(a + 1.6))
    p.r("tail1", z=3.0 * math.sin(a + 0.4))
    p.r("tail2", z=5.0 * math.sin(a - 0.1))
    p.r("tail3", z=7.0 * math.sin(a - 0.6))
    p.r("ahoge", x=3.0 * math.sin(2 * a))
    p.r("scarfTail", x=1.5 * math.sin(a + 0.5))
    # a small chin tap / moving hold
    tap = max(0.0, math.sin(2 * a + 0.2)) ** 3
    p.r("hand.L", z=8 * tap)
    p.r("forearm.L", z=3 * tap)
    return p


# ---------------------------------------------------------------------------
# celebrate
# ---------------------------------------------------------------------------


def celebrate(t: float) -> Pose:
    p = Pose()
    breathing(p, t, 3.2, amp=0.45)
    a = TAU * t / 3.2
    bounce = 0.5 - 0.5 * math.cos(2 * a)
    bounce2 = max(0.0, math.sin(2 * a)) ** 1.5
    p.t("root", z=0.035 * bounce + 0.015 * bounce2)
    p.s("root", x=1.0 + 0.015 * bounce, y=1.0 + 0.015 * bounce, z=1.0 - 0.028 * bounce)
    p.r("hips", x=-3 * bounce, y=3 * math.sin(a))
    p.r("spine", x=-5 * bounce)
    p.r("chest", x=-4 * bounce, z=2 * math.sin(a))
    p.r("neck", x=-5, z=2 * math.sin(a + 0.5))
    p.r("head", x=-8 + 3 * math.sin(2 * a + 0.4), z=5 * math.sin(a + 0.4), y=3 * math.sin(a))
    p.r("upperarm.L", x=-62.7 + 5 * bounce, y=-41.9, z=37.3)
    p.r("forearm.L", x=-58.5, y=-46.3, z=28.0)
    p.r("hand.L", x=79.5, y=-64.1, z=-136.4 + 10 * math.sin(2 * a + 0.6))
    p.r("upperarm.R", x=-62.7 + 5 * bounce, y=41.9, z=-37.3)
    p.r("forearm.R", x=-58.5, y=46.3, z=-28.0)
    p.r("hand.R", x=79.5, y=64.1, z=136.4 + 10 * math.sin(2 * a + 1.2))
    p.r("thigh.L", x=-10 * bounce, y=3)
    p.r("shin.L", x=14 * bounce)
    p.r("foot.L", x=-5 * bounce)
    p.r("thigh.R", x=-10 * bounce, y=-3)
    p.r("shin.R", x=14 * bounce)
    p.r("foot.R", x=-5 * bounce)
    p.r("ear.L", x=-10 + 5 * math.sin(2 * a + 1.0), z=6)
    p.r("ear.R", x=-10 + 5 * math.sin(2 * a + 1.6), z=-6)
    p.r("tail1", z=7 * math.sin(a + 0.2))
    p.r("tail2", z=12 * math.sin(a - 0.2))
    p.r("tail3", z=18 * math.sin(a - 0.6))
    p.r("ahoge", x=-4 + 8 * math.sin(2 * a + 0.8), y=5 * math.sin(a))
    p.r("scarfTail", x=-3 + 3 * math.sin(2 * a + 0.4))
    return p


FUNCS = {
    "idle": idle,
    "wave": wave,
    "jump": jump,
    "dance": dance,
    "think": think,
    "celebrate": celebrate,
}


# ---------------------------------------------------------------------------
# rig application / action baking
# ---------------------------------------------------------------------------


def apply_pose(arm: bpy.types.Object, pose: Pose, frame: int, step: bool = True) -> None:
    rest = {b.name: b.matrix_local.to_quaternion() for b in arm.data.bones}
    for name in BONES:
        pb = arm.pose.bones.get(name)
        if pb is None:
            continue
        pb.rotation_mode = "QUATERNION"
        rx, ry, rz = pose.rot.get(name, (0.0, 0.0, 0.0))
        qw = Quaternion((0, 0, 1), rz) @ Quaternion((0, 1, 0), ry) @ Quaternion((1, 0, 0), rx)
        rq = rest[name]
        pb.rotation_quaternion = rq.inverted() @ qw @ rq
        if name in pose.loc:
            lx, ly, lz = pose.loc[name]
            pb.location = rq.inverted() @ Vector((lx, ly, lz))
        else:
            pb.location = (0.0, 0.0, 0.0)
        if name in pose.scale:
            sx, sy, sz = pose.scale[name]
            # root bone local axes: X = world X, Y = world Z, Z = world -Y
            if name == "root":
                pb.scale = (sx, sz, sy)
            else:
                pb.scale = (sx, sy, sz)
        else:
            pb.scale = (1.0, 1.0, 1.0)
        if step:
            pb.keyframe_insert("rotation_quaternion", frame=frame, group=name)
            if name in pose.loc or name == "root":
                pb.keyframe_insert("location", frame=frame, group=name)
            if name in pose.scale or name == "root":
                pb.keyframe_insert("scale", frame=frame, group=name)


def bake_actions(arm: bpy.types.Object, fps: int = 60, key_step: int = 2) -> list[bpy.types.Action]:
    if arm.animation_data is None:
        arm.animation_data_create()
    scene = bpy.context.scene
    scene.render.fps = fps
    actions = []
    for name, duration in CLIPS:
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        arm.animation_data.action = action
        # Blender 4.4+ slotted actions: make sure we target the armature.
        if hasattr(arm.animation_data, "action_slot") and action.slots:
            arm.animation_data.action_slot = action.slots[0]
        fn = FUNCS[name]
        frames = int(round(duration * fps))
        for frame in range(1, frames + 2, key_step):
            t = (frame - 1) / fps
            apply_pose(arm, fn(t), frame)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        for kp in fc.keyframe_points:
                            kp.interpolation = "BEZIER"
                            kp.handle_left_type = "AUTO_CLAMPED"
                            kp.handle_right_type = "AUTO_CLAMPED"
        action.use_frame_range = True
        action.frame_start = 1
        action.frame_end = frames + 1
        actions.append(action)
        arm.animation_data.action = None
    # clear the pose
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    return actions
