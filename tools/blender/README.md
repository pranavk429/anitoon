# Mochi 3D build pipeline

Mochi is generated from code with **Blender 5.2+** and exported as a self-contained GLB. There are no AI-generated meshes, Mixamo clips, or external character assets.

## Requirements

- Blender 5.2+ on `PATH` (`brew install --cask blender`)
- Node 20+ / npm
- `@gltf-transform/cli` (already in devDependencies)

## Build and export

```bash
# character + 27-joint rig + six 60fps clips → public/three/mochi.glb
blender -b --python tools/blender/build_mochi.py -- --export

# optional 3/4 stills → .shots3d/*.png
blender -b --python tools/blender/build_mochi.py -- --render

# Meshopt compress for the web
npx gltf-transform meshopt public/three/mochi.glb /tmp/mochi.glb --level high
mv /tmp/mochi.glb public/three/mochi.glb
```

The raw Blender export is ~2.4MB. Meshopt brings it to ~0.67MB with skinning, six clips, and five mouth morph targets intact.

## Files

| File | Purpose |
| --- | --- |
| `build_mochi.py` | Materials, mesh construction, armature, weights, facial props, stage/lighting, GLB export |
| `mochi_lib.py` | Ellipsoids, catmull-rom loft tubes, parallel-transport frames, materials |
| `mochi_anim.py` | Pose vocabulary, six authored clips, 60fps baking |
| `../../src/components/three/MascotThreeStage.tsx` | The R3F stage that loads the GLB |
| `../../src/lib/three/mascot3d.ts` | Move/expression metadata |

## Rig

27 joints: `root`, `hips`, `spine`, `chest`, `neck`, `head`, `ear.L/R`, `ahoge`, `shoulder/upperarm/forearm/hand.L/R`, `thigh/shin/foot.L/R`, `tail1-3`, `scarfTail`.

The arms and legs are lofted tubes with smooth per-ring weights, not capsule segments. The shoulders have an extra hidden cap and fill; the scarf covers the head/body join. The face is a mix of mesh mouth blendshapes and bone-parented eye/brow/blink props.

## Clips

`idle` 4.0s, `wave` 3.6s, `jump` 3.0s, `dance` 4.0s, `think` 4.0s, `celebrate` 3.2s. All are loops baked at 60fps and exported by action name. The runtime crossfades them over 220ms.

## Notes

- The GLB uses `EXT_meshopt_compression` and `KHR_mesh_quantization`; load it with a Meshopt-capable glTF loader (three.js `MeshoptDecoder`, as drei's `useGLTF(..., false, true)` does).
- `gltf-transform validate` reports no structural errors; it warns about the unsupported Meshopt extension and unused UV attributes because the validator is not Meshopt-aware.
- The model is original Anitoon artwork. Do not replace it with third-party mascots.
