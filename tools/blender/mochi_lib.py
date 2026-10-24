"""Shared geometry / rig helpers for the Anitoon 3D mascot build.

Authored for Blender 5.x headless. Everything is generated from code so the
character can be rebuilt deterministically.
"""

from __future__ import annotations

import math
from typing import Callable, Iterable, Sequence

import bpy
import bmesh
from mathutils import Matrix, Quaternion, Vector


# ---------------------------------------------------------------------------
# scene helpers
# ---------------------------------------------------------------------------


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.armatures,
        bpy.data.materials,
        bpy.data.actions,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def link(obj: bpy.types.Object, collection: bpy.types.Collection | None = None) -> None:
    (collection or bpy.context.scene.collection).objects.link(obj)


def smooth(obj: bpy.types.Object) -> None:
    for poly in obj.data.polygons:
        poly.use_smooth = True


def mesh_object(
    name: str,
    verts: Sequence[Vector],
    faces: Sequence[Sequence[int]],
    material: bpy.types.Material | None = None,
    collection: bpy.types.Collection | None = None,
) -> bpy.types.Object:
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate(verbose=False)
    me.update()
    ob = bpy.data.objects.new(name, me)
    link(ob, collection)
    if material:
        me.materials.append(material)
    smooth(ob)
    return ob


def bmesh_object(
    name: str,
    bm: bmesh.types.BMesh,
    material: bpy.types.Material | None = None,
    collection: bpy.types.Collection | None = None,
) -> bpy.types.Object:
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.update()
    ob = bpy.data.objects.new(name, me)
    link(ob, collection)
    if material:
        me.materials.append(material)
    smooth(ob)
    return ob


# ---------------------------------------------------------------------------
# primitives
# ---------------------------------------------------------------------------


def ellipsoid(
    name: str,
    center: Sequence[float],
    radii: Sequence[float],
    material: bpy.types.Material,
    segments: int = 64,
    rings: int = 40,
    deform: Callable[[Vector], Vector] | None = None,
    rotation: Sequence[float] | None = None,
) -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1.0)
    rot = Quaternion()
    if rotation:
        rot = Quaternion(Vector((1, 0, 0)), 0)
        for axis, angle in zip(("X", "Y", "Z"), rotation):
            if angle:
                vec = {"X": Vector((1, 0, 0)), "Y": Vector((0, 1, 0)), "Z": Vector((0, 0, 1))}[axis]
                rot = Quaternion(vec, angle) @ rot
    c = Vector(center)
    r = Vector(radii)
    for v in bm.verts:
        p = Vector((v.co.x * r.x, v.co.y * r.y, v.co.z * r.z))
        p = rot @ p
        v.co = c + p
    if deform:
        for v in bm.verts:
            v.co = deform(v.co)
    return bmesh_object(name, bm, material)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    if edge0 == edge1:
        return 1.0 if x >= edge1 else 0.0
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def catmull_rom(points: Sequence[Vector], samples_per_segment: int = 12) -> list[Vector]:
    """Sample an open Catmull-Rom spline through the supplied points."""
    pts = [Vector(p) for p in points]
    padded = [pts[0] + (pts[0] - pts[1])] + pts + [pts[-1] + (pts[-1] - pts[-2])]
    out: list[Vector] = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = padded[i], padded[i + 1], padded[i + 2], padded[i + 3]
        for s in range(samples_per_segment):
            t = s / samples_per_segment
            t2, t3 = t * t, t * t * t
            out.append(
                0.5
                * (
                    (2 * p1)
                    + (-p0 + p2) * t
                    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
                )
            )
    out.append(pts[-1])
    return out


def _frames(points: Sequence[Vector]) -> list[Vector]:
    tangents: list[Vector] = []
    for i in range(len(points)):
        if i == 0:
            t = points[1] - points[0]
        elif i == len(points) - 1:
            t = points[-1] - points[-2]
        else:
            t = points[i + 1] - points[i - 1]
        tangents.append(t.normalized())
    normal = Vector((0, 1, 0))
    if abs(tangents[0].dot(normal)) > 0.92:
        normal = Vector((1, 0, 0))
    normal = (normal - tangents[0] * normal.dot(tangents[0])).normalized()
    frames = [normal]
    for i in range(1, len(points)):
        q = tangents[i - 1].rotation_difference(tangents[i])
        n = (q @ frames[-1])
        n = (n - tangents[i] * n.dot(tangents[i])).normalized()
        frames.append(n)
    return frames


def tube(
    name: str,
    control_points: Sequence[Sequence[float]],
    radii: Sequence[float],
    material: bpy.types.Material,
    segments: int = 18,
    samples_per_segment: int = 10,
    weight_fn: Callable[[float], dict[str, float]] | None = None,
    secondary_material: bpy.types.Material | None = None,
    secondary_after: float | None = None,
    cap_start: bool = True,
    cap_end: bool = True,
) -> bpy.types.Object:
    """Loft a circular tube with parallel-transport frames.

    ``weight_fn`` receives a 0..1 parameter along the tube and returns
    vertex-group weights, which makes deterministic limb skinning easy.
    """
    pts = catmull_rom([Vector(p) for p in control_points], samples_per_segment)
    frames = _frames(pts)
    n = len(pts)
    # radius profile through control points
    r_ctrl = list(radii)
    verts: list[Vector] = []
    for i, (p, normal) in enumerate(zip(pts, frames)):
        t = i / (n - 1)
        # piecewise linear radius over the control polygon
        scaled = t * (len(r_ctrl) - 1)
        lo = min(int(math.floor(scaled)), len(r_ctrl) - 2)
        frac = scaled - lo
        rad = lerp(r_ctrl[lo], r_ctrl[lo + 1], frac)
        tangent = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        binormal = tangent.cross(normal).normalized()
        for s in range(segments):
            ang = 2 * math.pi * s / segments
            verts.append(p + normal * (math.cos(ang) * rad) + binormal * (math.sin(ang) * rad))

    faces: list[list[int]] = []
    for i in range(n - 1):
        for s in range(segments):
            a = i * segments + s
            b = i * segments + (s + 1) % segments
            c = (i + 1) * segments + (s + 1) % segments
            d = (i + 1) * segments + s
            faces.append([a, b, c, d])
    if cap_start:
        c0 = len(verts)
        verts.append(pts[0])
        for s in range(segments):
            faces.append([c0, (s + 1) % segments, s])
    if cap_end:
        c1 = len(verts)
        verts.append(pts[-1])
        base = (n - 1) * segments
        for s in range(segments):
            faces.append([c1, base + s, base + (s + 1) % segments])

    ob = mesh_object(name, verts, faces, material)
    if secondary_material:
        ob.data.materials.append(secondary_material)
        threshold = secondary_after if secondary_after is not None else 0.8
        ring_cut = int(threshold * (n - 1))
        side_faces = (n - 1) * segments
        for poly in ob.data.polygons:
            idx = poly.index
            if idx < side_faces:
                ring = idx // segments
                if ring >= ring_cut:
                    poly.material_index = 1
            elif cap_end and idx >= len(faces) - segments:
                poly.material_index = 1
    if weight_fn:
        groups: dict[str, bpy.types.VertexGroup] = {}
        for i in range(n):
            t = i / (n - 1)
            weights = weight_fn(t)
            for bone_name, w in weights.items():
                if w <= 1e-5:
                    continue
                if bone_name not in groups:
                    groups[bone_name] = ob.vertex_groups.new(name=bone_name)
                groups[bone_name].add(list(range(i * segments, (i + 1) * segments)), w, "REPLACE")
        for extra_idx in range(n * segments, len(verts)):
            t = 1.0 if cap_end else 0.0
            weights = weight_fn(t)
            for bone_name, w in weights.items():
                if w <= 1e-5:
                    continue
                if bone_name not in groups:
                    groups[bone_name] = ob.vertex_groups.new(name=bone_name)
                groups[bone_name].add([extra_idx], w, "REPLACE")
    return ob


def torus(
    name: str,
    center: Sequence[float],
    major: float,
    minor: float,
    material: bpy.types.Material,
    scale: Sequence[float] = (1, 1, 1),
    rotation: Sequence[float] = (0, 0, 0),
    major_segments: int = 64,
    minor_segments: int = 16,
) -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=1, v_segments=1, radius=0.001)
    bm.free()
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=center,
    )
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    ob.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if material:
        ob.data.materials.clear()
        ob.data.materials.append(material)
    smooth(ob)
    return ob


# ---------------------------------------------------------------------------
# materials
# ---------------------------------------------------------------------------


def principled(
    name: str,
    color: Sequence[float],
    roughness: float = 0.8,
    metallic: float = 0.0,
    specular: float = 0.35,
    sheen: float = 0.0,
    emission: Sequence[float] | None = None,
    emission_strength: float = 0.0,
    alpha: float = 1.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    inp = bsdf.inputs
    inp["Base Color"].default_value = (*color, 1.0)
    inp["Roughness"].default_value = roughness
    inp["Metallic"].default_value = metallic
    if "Specular IOR Level" in inp:
        inp["Specular IOR Level"].default_value = specular
    if "Sheen Weight" in inp:
        inp["Sheen Weight"].default_value = sheen
        if "Sheen Roughness" in inp:
            inp["Sheen Roughness"].default_value = 0.6
        if "Sheen Tint" in inp:
            inp["Sheen Tint"].default_value = (*color, 1.0)
    if emission:
        inp["Emission Color"].default_value = (*emission, 1.0)
        inp["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        inp["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
        mat.use_transparency_overlap = False
    mat.diffuse_color = (*color, alpha)
    return mat


def srgb(hex_code: str) -> tuple[float, float, float]:
    h = hex_code.lstrip("#")
    vals = [int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4)]
    # Blender node colors are linear.
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in vals)
