# 2021 Day 19 Part 2 — Beacon Scanner

Aligns 3D beacon reports from multiple scanners across 24 right-handed cube rotations and translations using at least 12 overlapping beacons, then reports the maximum Manhattan distance between any two scanners.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new BeaconScannerSolver(MAX_SCANNER_MANHATTAN_POLICY)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official 5-scanner example (`3621`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Renders `BeaconScannerVisualizer` using a fixed-bounds orthographic 3D projection (`yaw 35°`, `pitch 22°`) with playback stepping across scanner alignments.
