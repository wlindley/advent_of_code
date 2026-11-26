# 2022 Day 24 Part 2 — Blizzard Basin

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official 6×8 example (`54`) and `BasinPart2Visualizer`.

## Maintainer Guide

- `domain/solver.ts` delegates parsing, shortest-trip solving (`solveTrip`), and bounded trace capture (`traceTrip`) for `PART2_WAYPOINTS` to `../../shared`.
- `viz/BasinPart2Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/BasinVisualizer`.
