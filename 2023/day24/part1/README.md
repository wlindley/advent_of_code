# AoC 2023 Day 24 Part 1 — Never Tell Me The Odds

## Consumer Guide

- **Domain solver** (`domain/solver.ts`, re-exported from `domain/index.ts`):
  - `PERSONAL_TEST_AREA`: `TestArea(200_000_000_000_000n, 400_000_000_000_000n)`.
  - `solver`: `Required<PuzzleSolver<readonly Hailstone[], number, HailTrace2DFrame>>` compatible with `tools/aoc/cli.ts`.
- **Site manifest** (`index.ts`):
  - Dispatches `EXAMPLE_INPUT` to `TestArea(7n, 27n)` (expected answer `2`) and all other inputs to `PERSONAL_TEST_AREA`.
- **Visualizer** (`viz/HailPart1Visualizer.tsx`):
  - Renders `HailVisualizer` with live pair-classification badges, a HiDPI 2D XY viewport canvas (`[-0.2, 1.2]` padded around the test box), and `PlaybackControls`.

## Maintainer Architecture

- `part1/domain/solver.ts` is pure TypeScript delegating parsing, exact 2D Cramer intersection counting, and bounded trace generation to `../shared`.
- `part1/viz/HailPart1Visualizer.tsx` is a thin presentation wrapper forwarding `rawInput` and `area` to `../../shared/viz/HailVisualizer`.
- No Part 1 business logic lives in React components or `part1/index.ts`.
