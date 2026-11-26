# `2022/day02/part1` — Rock Paper Scissors (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive 3×3 matchup matrix visualizer for Advent of Code 2022 Day 2 Part 1.

- **CLI Execution**: `npm run aoc -- run 2022 2 1` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: implements `RoundResolver` as `DirectShapeResolver` (`X→Rock`, `Y→Paper`, `Z→Scissors`), delegating parsing to `parseStrategyGuide`, scoring to `scoreStrategyGuide`, and bounded trace simulation (`120` max frames) to `traceStrategyGuide`.
- `viz/RpsScoreboardVisualizer.tsx`: renders round telemetry, Win/Draw/Loss tallies, and an interactive 3×3 opponent-vs-player payoff and frequency matrix driven by `usePlayback` and `<PlaybackControls>`.
