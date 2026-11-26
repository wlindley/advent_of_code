# 2023 Day 10 Part 2 — Pipe Maze (Enclosed Interior Tiles)

## Consumer Guide

- **Manifest**: `2023/day10/part2/index.ts` exports `manifest: PuzzlePartManifest` (auto-discovered by `site/registry.ts`).
- **Domain Solver**: `2023/day10/part2/domain/index.ts` exports `EnclosedAnalysis`, `analyzeEnclosedTiles`, `buildEnclosedScanTrace`, `solvePipeMazePart2`, `tracePipeMazePart2`, and `solver: PuzzleSolver<PipeMaze, number, EnclosedScanFrame>`.
- **Visualization**: `PipeMazePart2Visualizer` animates the row-by-row Jordan-curve parity scan over `PipeMazeCanvas` (SVG for grids up to 25×25, HiDPI `<canvas>` for larger grids) with a Dim/Hide Clutter toggle and bounded playback controls.

## Maintainer Notes

- **Architecture**: `part2/domain/` depends strictly on `2023/day10/shared/` and `shared/core/` (never `part1/`). `EnclosedAnalysis` keeps its internal `Uint8Array` private and unfrozen (copying on construction and `copyMask()`), freezes `crossingsByRow` and `this`, and derives `count` and `enclosedInRow()` dynamically.
- **Parity Rule**: Scanning each row slightly north of center toggles interior parity on loop tiles with `DIR_N` (`|`, `L`, `J`, or inferred `S`), handling `F--J`/`L--7` crossings and `F--7`/`L--J` grazing corners without edge-expansion memory overhead.
- **Correctness**: `solver.oracle.test.ts` cross-checks `analyzeEnclosedTiles` against both Shoelace + Pick's Theorem (count) and a 2×-expanded squeeze flood-fill BFS (cell-by-cell mask equality) across official examples, all six `S` shapes, and seeded non-convex comb mazes.
