# 2022 Day 22 Part 1 — Monkey Map

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official example (`6032`) and `MonkeyMapPart1Visualizer`.

## Maintainer Guide

- `domain/solver.ts` is a thin adapter delegating input parsing, `FlatTorusTopology` stepping, and bounded trace generation to `../../shared`.
- `viz/MonkeyMapPart1Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/MonkeyMapVisualizer`.
