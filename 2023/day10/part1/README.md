# 2023 Day 10 Part 1 — Pipe Maze

## Consumer Guide

- **Manifest**: `2023/day10/part1/index.ts` exports `manifest: PuzzlePartManifest` (auto-discovered by `site/registry.ts`).
- **Domain Solver**: `2023/day10/part1/domain/index.ts` exports `solvePipeMazePart1`, `tracePipeMazePart1`, and `solver: PuzzleSolver<PipeMaze, number, PipeMazeTraceFrame>`.
- **Visualization**: `PipeMazePart1Visualizer` renders a dual-mode maze view (SVG for grids up to 25×25, HiDPI `<canvas>` for larger grids) with animated dual-wavefront playback and a Dim/Hide Clutter toggle.

## Maintainer Notes

- **Architecture**: `part1/domain/` delegates parsing, loop tracing, and wavefront trace sampling to `2023/day10/shared/` (`parsePipeMaze`, `traceMainLoop`, `buildLoopWalkTrace`).
- **Correctness**: `solver.oracle.test.ts` cross-checks `MainLoop` distances and membership against both a full-grid BFS and a `DisjointSet` connected-component oracle across official examples, all six `S` shapes, and seeded cluttered grids.
