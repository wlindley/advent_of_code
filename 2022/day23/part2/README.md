# 2022 Day 23 Part 2 — Unstable Diffusion

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official 22-elf example (`20`) and `DiffusionPart2Visualizer`.

## Maintainer Guide

- `domain/solver.ts` delegates parsing, static-round detection (`findFirstStaticRound`), and bounded trace capture (`traceUntilStatic`) to `../../shared`.
- `viz/DiffusionPart2Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/DiffusionVisualizer`.
