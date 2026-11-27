# `2019/day10/part1` — Monitoring Station

## Consumer Guide
Advent of Code 2019 Day 10 Part 1 solver and interactive visibility-scan visualizer.

- `domain/`: Exports `solver` (`MonitoringStationSolver` configured with `BEST_MONITOR_POLICY`), parsing rectangular `.` / `#` grids into `AsteroidMap` and returning the maximum visible asteroid count.
- `viz/Visualizer.tsx`: Thin wrapper binding `solver` to `MonitoringStationVisualizer`, rendering line-of-sight rays, visibility heatmap bands, and running best station halos.
- `index.ts`: Exports `manifest: PuzzlePartManifest` with metadata, official 5x5 example (`'8'`), `solver`, and `Visualizer`.

## Maintainer Guide
- All geometry, parsing, symmetric visibility counting, bounded trace generation (`DEFAULT_MAX_TRACE_FRAMES = 100`), and visualization live in `../shared/`.
- `domain/solver.ts` stays pure TypeScript with zero React/DOM dependencies so `tools/aoc/cli.ts` can run it directly.
