# 2021 Day 14 Part 2 — Extended Polymerization

Simulates 40 synchronous pair-insertion steps on a polymer template and reports the BigInt spread between the most and least common elements.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new PolymerizationSolver(PART2_STEPS)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the `NNCB` 16-rule example (`2188189693529`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper rendering `PolymerizationVisualizer`, animating element frequency bars (Linear / Log2), top active pair reactions, and length/spread growth trajectories across 41 sampled frames.
