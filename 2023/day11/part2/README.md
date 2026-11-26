# 2023 Day 11 Part 2 — Cosmic Expansion

## Consumer Guide

- **Manifest**: `2023/day11/part2/index.ts` exports `manifest: PuzzlePartManifest` (auto-discovered by `site/registry.ts`).
- **Domain Solver**: `2023/day11/part2/domain/index.ts` exports `PART2_EXPANSION_FACTOR` (`1_000_000n`) and `solver: PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame>`.
- **Visualization**: `CosmicExpansionPart2Visualizer` wraps `CosmicExpansionVisualizer` with `expansionFactor = 1_000_000n`, displaying empty cosmic rifts, animated row/column sweep cuts, cyan prefix vs. amber suffix galaxies, and an interactive 2-galaxy Manhattan distance inspector.

## Maintainer Notes

- **Architecture**: `part2/domain/` delegates parsing, exact `BigInt` axis-sweep summation, and bounded trace generation to `2023/day11/shared/` (`createCosmicExpansionSolver`), with zero cross-part imports from `part1/`.
- **Correctness**: `solver.oracle.test.ts` cross-checks the $O(R + C)$ sweep against an independent $O(G^2)$ brute-force expanded-Manhattan oracle, exact affine extrapolation $S(1) + 999{,}999 \cdot (S(2) - S(1))$, and an independent sorted-coordinate prefix-sum oracle.
