# 2020 Day 5 Part 1: Binary Boarding

## Consumer Guide

- **Manifest**: `export const manifest: PuzzlePartManifest` in `2020/day05/part1/index.ts`.
- **Solver**: `export const solver` in `2020/day05/part1/domain/solver.ts` implements `PuzzleSolver<BoardingManifest, number, BoardingTraceFrame>`.
- **Example**: 4 passes (`FBFBBFFRLR`, `BFFFBBFRRR`, `FFFBBBFRRR`, `BBFFBBFRLL`) -> `820`.
- **Visualizer**: `BinaryBoardingPart1Visualizer` renders a 128x8 cabin SVG map, a 10-bit `F/B/L/R` BSP narrowing panel, and shared `PlaybackControls`.

## Maintainer Design

- `part1/domain/solver.ts` delegates directly to `new BoardingSolver(HIGHEST_SEAT_POLICY)` from `2020/day05/shared`.
- `part1/viz/BinaryBoardingPart1Visualizer.tsx` is a thin wrapper passing `HIGHEST_SEAT_POLICY` to `BoardingVisualizer`.
- All boarding pass decoding, bitset occupancy tracking, BSP trace generation, and budget-bounded frame sampling live in `2020/day05/shared/` so Part 2 can swap policies cleanly without duplicating logic.
