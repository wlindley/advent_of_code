# 2022 Day 24 Part 1 — Blizzard Basin

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official 6×8 example (`18`) and `BasinPart1Visualizer`.

## Maintainer Guide

- `domain/solver.ts` delegates parsing, shortest-leg solving (`solveTrip`), and bounded trace capture (`traceTrip`) for `PART1_WAYPOINTS` to `../../shared`.
- `viz/BasinPart1Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/BasinVisualizer`.
