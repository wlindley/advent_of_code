# `2022/day05/part1`

## Consumer Guide
Solver, trace generator, manifest, and interactive visualizer for Advent of Code 2022 Day 5 Part 1 ("Supply Stacks").

### Public API
- `2022/day05/part1/domain/index.ts`: exports `CrateMover9000`, `CRATE_MOVER_9000`, `solvePart1`, `tracePart1`, and `solver` (`PuzzleSolver<SupplyProcedure, string, CraneTraceFrame>`).
- `2022/day05/part1/index.ts`: exports `manifest: PuzzlePartManifest` for registry discovery and CLI execution (`npx tsx tools/aoc/cli.ts`).

## Maintainer Guide
- **Pure domain**: `domain/solver.ts` delegates parsing and simulation to `2022/day05/shared/` and binds `CrateMover9000` (LIFO single-crate transfer, reversing lifted slices).
- **Visualization**: `viz/SupplyStacksVisualizer.tsx` wraps the shared `CraneBayVisualizer` with CrateMover 9000 telemetry and `var(--gold)` highlight accents.
- **Verification**: validated against an independent `O(S * M)` backward coordinate-tracking differential oracle (`backwardTopTrackerOracle`) across edge cases and 45 seeded random procedures.
