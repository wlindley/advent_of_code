# `2022/day02/part2` — Rock Paper Scissors (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive 3×3 desired-outcome strategy visualizer for Advent of Code 2022 Day 2 Part 2.

- **CLI Execution**: `npm run aoc -- run 2022 2 2` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: implements `RoundResolver` as `DesiredOutcomeResolver` (`X→Loss`, `Y→Draw`, `Z→Win`), deriving the required player shape via `derivePlayerShape(opponent, desiredOutcome) = euclideanMod(opponent + desiredOutcome - 1, 3)` and delegating parsing, scoring, and bounded trace simulation (`120` max frames) to `../../shared`.
- `viz/OutcomeStrategyVisualizer.tsx`: renders round telemetry, an active-round decryption strip, and an interactive 3×3 opponent-vs-target-outcome matrix driven by `usePlayback` and `<PlaybackControls>`.
