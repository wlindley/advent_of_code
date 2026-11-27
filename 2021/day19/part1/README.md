# 2021 Day 19 Part 1 — Beacon Scanner

Aligns 3D beacon reports from multiple scanners across 24 right-handed cube rotations and translations using at least 12 overlapping beacons, then reports the total unique beacon count.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new BeaconScannerSolver(BEACON_COUNT_POLICY)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official 5-scanner example (`79`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Renders `BeaconScannerVisualizer` using a fixed-bounds orthographic 3D projection (`yaw 35°`, `pitch 22°`) with playback stepping across scanner alignments.
