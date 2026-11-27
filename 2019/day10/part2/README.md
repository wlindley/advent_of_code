# `2019/day10/part2` — Monitoring Station

## Consumer Guide
Advent of Code 2019 Day 10 Part 2 solver and interactive laser-vaporization visualizer.

- `domain/`: Exports `solver` (`MonitoringStationSolver` configured with `VAPORIZATION_200TH_POLICY`), parsing `.` / `#` grids into `AsteroidMap` and returning `x * 100 + y` of the 200th vaporized asteroid.
- `viz/Visualizer.tsx`: Thin wrapper binding `solver` to `MonitoringStationVisualizer`, animating clockwise laser sweeps, vaporized markers, and active hit rays.
- `index.ts`: Exports `manifest: PuzzlePartManifest` with metadata, official 20x20 example (`'802'`), `solver`, and `Visualizer`.

## Maintainer Guide
- All geometry, parsing, station selection, exact cross-product ray sorting, round-robin schedule generation, bounded trace sampling (`DEFAULT_MAX_TRACE_FRAMES = 100`), and visualization live in `../shared/`.
- `domain/solver.ts` stays pure TypeScript with zero React/DOM dependencies so `tools/aoc/cli.ts` can run it directly.
