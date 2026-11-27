# 2021 Day 14 Part 1 — Extended Polymerization

Simulates 10 synchronous pair-insertion steps on a polymer template and reports the BigInt spread between the most and least common elements.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new PolymerizationSolver(PART1_STEPS)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the `NNCB` 16-rule example (`1588`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper rendering `PolymerizationVisualizer`, animating element frequency bars (Linear / Log2), top active pair reactions, and length/spread growth trajectories.
