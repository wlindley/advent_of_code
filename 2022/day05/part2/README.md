# `2022/day05/part2`

## Consumer Guide
Solver, trace generator, manifest, and interactive visualizer for Advent of Code 2022 Day 5 Part 2 ("Supply Stacks: CrateMover 9001").

### Public API
- `2022/day05/part2/domain/index.ts`: exports `CrateMover9001`, `CRATE_MOVER_9001`, `solvePart2`, `tracePart2`, and `solver` (`PuzzleSolver<SupplyProcedure, string, CraneTraceFrame>`).
- `2022/day05/part2/index.ts`: exports `manifest: PuzzlePartManifest` for registry discovery and CLI execution (`npx tsx tools/aoc/cli.ts`).

## Maintainer Guide
- **Pure domain**: `domain/solver.ts` delegates parsing and simulation to `2022/day05/shared/` and binds `CrateMover9001` (order-preserving multi-crate block transfer).
- **Visualization**: `viz/SupplyStacksVisualizer.tsx` wraps the shared `CraneBayVisualizer` with CrateMover 9001 (`FIFO · Block`) telemetry and `var(--accent)` highlight accents.
- **Verification**: validated against an independent `O(S * M)` order-preserving backward coordinate-tracking differential oracle (`backwardTopTrackerOracle`) across edge cases and 50 seeded random procedures.
