# 2022 Day 23 Part 1 — Unstable Diffusion

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official 22-elf example (`110`) and `DiffusionPart1Visualizer`.

## Maintainer Guide

- `domain/solver.ts` delegates parsing, 10-round simulation (`simulateRounds`), and bounded trace capture (`traceFixedRounds`) to `../../shared`.
- `viz/DiffusionPart1Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/DiffusionVisualizer`.
