# AoC 2023 Day 24 Part 2 — Never Tell Me The Odds

## Consumer Guide

- **Domain solver** (`domain/solver.ts`, re-exported from `domain/index.ts`):
  - `solver`: `Required<PuzzleSolver<readonly Hailstone[], bigint, RockTraceFrame>>` compatible with `tools/aoc/cli.ts`.
  - `solver.parse(raw)` parses `px, py, pz @ vx, vy, vz` lines into immutable `Hailstone` instances.
  - `solver.solve(hailstones)` returns the exact `bigint` sum `x + y + z` of the rock's initial position.
  - `solver.trace(hailstones, options)` produces a bounded chronological trace of rock-hailstone collisions.
- **Site manifest** (`index.ts`):
  - Exports `manifest: PuzzlePartManifest` with the official 5-stone example (`exampleAnswer: '47'`) and `RockPart2Visualizer`.
- **Visualizer** (`viz/RockPart2Visualizer.tsx`, `viz/RockProjectionSvg.tsx`):
  - Displays summary badges (`Position Sum`, `Rock Pos`, `Rock Vel`, `Collisions`), an active event banner, side-by-side normalized XY and XZ SVG projection plots, a 7-row windowed chronological collision table, and `PlaybackControls`.

## Maintainer Architecture

- `part2/domain/solver.ts` is 100% pure TypeScript with zero React/DOM imports and delegates parsing, exact 6x6 `RationalLinearSystem` trajectory recovery, and bounded chronological trace generation to `../shared`.
- `part2/viz/RockPart2Visualizer.tsx` normalizes 64-bit+ `BigInt` coordinates to `[0, 1]` using exact integer scaling against `[start, end]` bounds and caps trace steps and SVG collision markers at `DEFAULT_ROCK_TRACE_STEPS` (`120`).
- `part2/` has zero imports from `part1/` and zero edits to shared or site registry files.
