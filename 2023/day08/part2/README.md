# 2023 Day 8 Part 2 — Haunted Wasteland

## Consumer Usage

Import `manifest` from `2023/day08/part2` for site registration, or `solver` from `2023/day08/part2/domain` for pure CLI/domain execution (`parse`, `solve`, `trace`).

## Maintainer Architecture

- `domain/crt.ts`: Arbitrary-precision `extGcdBigInt`, immutable `Congruence` value objects, and frontier merging (`mergeCongruenceSets`).
- `domain/ghostCycle.ts`: `(node, ip)` rho-cycle extraction (`prefixLength`, `cycleLength`, `preCycleHits`, `cycleHits`) into immutable `GhostCycle` instances.
- `domain/convergence.ts`: Pre-cycle convergence scan over `[1, maxPrefixLength)`, followed by deterministic generalized CRT folding classified into `pre-cycle`, `aligned-lcm`, or `general-crt`.
- `domain/trace.ts` & `domain/solver.ts`: Bounded `GhostConvergenceFrame` generation (with lockstep verification strip when `answer <= 24n`) and frozen `PuzzleSolver`.
- `viz/`: Interactive rho-track, `log2ScaleRatio` bar, CRT frontier display, and optional lockstep table.
