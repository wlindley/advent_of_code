# 2020 Day 5 Part 2: Binary Boarding

## Consumer Guide

- **Manifest**: `export const manifest: PuzzlePartManifest` in `2020/day05/part2/index.ts`.
- **Solver**: `export const solver` in `2020/day05/part2/domain/solver.ts` implements `PuzzleSolver<BoardingManifest, number, BoardingTraceFrame>`.
- **Example**: 4 shuffled passes (`FBFBBFFRRL`, `FBFBBFFLRR`, `FBFBBFFRRR`, `FBFBBFFRLL`, seat IDs `358, 355, 359, 356`) -> `357` (`FBFBBFFRLR`).
- **Visualizer**: `BinaryBoardingPart2Visualizer` renders a 128x8 cabin SVG map highlighting the unique interior gap, a 10-bit `F/B/L/R` BSP narrowing panel, and shared `PlaybackControls`.

## Maintainer Design

- `part2/domain/solver.ts` delegates directly to `new BoardingSolver(MISSING_INTERIOR_SEAT_POLICY)` from `2020/day05/shared`.
- `part2/viz/BinaryBoardingPart2Visualizer.tsx` is a thin wrapper passing `MISSING_INTERIOR_SEAT_POLICY` to `BoardingVisualizer`.
- All boarding pass decoding, bitset occupancy tracking, BSP trace generation, and budget-bounded frame sampling live in `2020/day05/shared/` so Part 2 swaps policies cleanly without duplicating logic.
