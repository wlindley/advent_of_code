# `2024/day07/part2` — Bridge Repair (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive reverse-pruning tree visualizer for Advent of Code 2024 Day 7 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 7 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/concatOperator.ts`: Implements `CONCAT_OPERATOR` (`||`) with exact `BigInt` decimal scaling and `PART2_OPERATORS` (`*`, `||`, `+`).
- `domain/solver.ts`: Thin Part 2 facade binding `PART2_OPERATORS` to `totalCalibrationResult` and `traceCalibration` from `../../shared`.
- `viz/BridgeRepairPart2Visualizer.tsx`: Thin React wrapper passing `PART2_OPERATORS` to `../../shared/viz/BridgeRepairVisualizer`.
- `domain/solver.oracle.test.ts`: Cross-validates reverse-DFS solvability against an independent string-concatenation forward oracle across edge cases and 260 seeded PRNG equations.
