# `2024/day07/part1` — Bridge Repair (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive reverse-pruning tree visualizer for Advent of Code 2024 Day 7 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 7 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: Thin Part 1 facade binding `PART1_OPERATORS` (`*`, `+`) to `totalCalibrationResult` and `traceCalibration` from `../../shared`.
- `viz/BridgeRepairPart1Visualizer.tsx`: Thin React wrapper passing `PART1_OPERATORS` to `../../shared/viz/BridgeRepairVisualizer`.
- `domain/solver.oracle.test.ts`: Cross-validates reverse-DFS solvability and witnesses against an independent left-to-right forward-pruned oracle across edge cases and 100 seeded PRNG equations.
