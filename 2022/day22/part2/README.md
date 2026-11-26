# 2022 Day 22 Part 2 — Monkey Map

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official example (`5031`) and `MonkeyMapPart2Visualizer`.

## Maintainer Guide

- `domain/solver.ts` is a thin adapter delegating input parsing, `CubeNetTopology` 3D seam stepping, and bounded trace generation to `../../shared`.
- `viz/MonkeyMapPart2Visualizer.tsx` infers the cube face size via `CubeNetTopology` and delegates rendering and playback controls to `../../shared/viz/MonkeyMapVisualizer`.
