# Anatomical GLTF odontogram (chairside)

Date: 2026-09-04

## Goal

Load real anatomical tooth GLBs into Charting, mapped by tooth kind. Surface paint stays in the inspector.

## Assets

Drop into `public/dental/teeth/`:

- `incisor.glb` (central + lateral)
- `canine.glb`
- `premolar.glb`
- `molar.glb`

Prefer low-poly, Y-up, crown upright. Until at least one file is present, Charting keeps the SVG odontogram and shows drop instructions.

## Behavior

- Probe via HEAD; preload found kinds
- Missing kinds render a placeholder box in the 3D arch
- Select tooth → inspector opens with surface paint pad + diagnostics
- Orbit controls on the chart canvas

## Non-goals

- Per-FDI unique meshes (32 files)
- Painting directly on GLTF surface geometry
- Bundling third-party meshes in git without a license file from the user
