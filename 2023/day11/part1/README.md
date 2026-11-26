# 2023 Day 11 Part 1 — Cosmic Expansion

## Consumer Guide

- **Manifest**: `2023/day11/part1/index.ts` exports `manifest: PuzzlePartManifest` (auto-discovered by `site/registry.ts`).
- **Domain Solver**: `2023/day11/part1/domain/index.ts` exports `PART1_EXPANSION_FACTOR` (`2n`) and `solver: PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame>`.
- **Visualization**: `CosmicExpansionPart1Visualizer` wraps `CosmicExpansionVisualizer` with `expansionFactor = 2n`, showing empty cosmic rifts, animated row/column sweep cuts, cyan prefix vs. amber suffix galaxies, and a click-to-select 2-galaxy Manhattan path inspector.

## Maintainer Notes

- **Architecture**: `part1/domain/` delegates parsing, exact `BigInt` axis-sweep summation, and bounded trace generation to `2023/day11/shared/` (`createCosmicExpansionSolver`).
- **Correctness**: `solver.oracle.test.ts` cross-checks the $O(R + C)$ sweep against an $O(G^2)$ expanded-coordinate pairwise oracle, a literal expanded-grid `DIRS_4` BFS oracle, affine linearity in $F$, and transpose/reflection symmetries.
