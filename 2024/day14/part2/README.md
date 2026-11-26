# 2024 Day 14 Part 2 — Restroom Redoubt

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site discovery, selecting `SYNTHETIC_EXAMPLE_SPACE` (`15×13`, answer `42`) for the built-in 37-robot tree example and `DEFAULT_REDOUBT_SPACE` (`101×103`) otherwise.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<readonly Robot[], number, RedoubtSnapshot>`) using `DEFAULT_REDOUBT_SPACE`.
- **Visualizer**: `./viz/RestroomRedoubtPart2Visualizer.tsx` runs `analyzeEasterEgg` once per input, displays a max-pooled full-period `AdjacencySparkline`, and animates a bounded convergence trace via `RedoubtCanvas` with a Jump-to-Peak control.

## Maintainer Guide

- **Architecture**: `domain/analysis.ts` validates `robots.length > 0` and uint32 scan bounds (`MAX_SCAN_UINT32`), pre-reduces positions/velocities into `Uint32Array` buffers, and runs a 2-pass generation-stamped adjacency scan per second (`stampAndAdvance`, then `countStampedPairs`) so stacked robots count once per cell. `EasterEggAnalysis` stores only `space` and frozen `adjacencySeries`, computing `period`, `bestSecond`, `peakAdjacency`, and `baselineMeanAdjacency` dynamically.
- **Bounded Traces**: `domain/solver.ts` selects up to `maxSteps` seconds (`t = 0`, top precursors, the 12-second approach window, and `bestSecond`) and exposes `downsamplePeakSeries` for sparkline rendering.
- **Verification**: Unit tests verify 100% line/branch/function/statement coverage across `domain/`; `solver.oracle.test.ts` cross-checks every frame against `countAdjacentOccupied` + `fillOccupancy` on `7×5` and verifies exact agreement against an independent `BigInt` minimum-variance + CRT oracle on both the `15×13` tree (`42`) and a seeded 500-robot `101×103` swarm (`6876`).
