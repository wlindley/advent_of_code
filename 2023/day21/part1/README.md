# 2023 Day 21 Part 1 — Step Counter

## Consumer Guide

- `domain/index.ts` exports `PART1_STEPS` (`64`) and `solver: PuzzleSolver<GardenMap, number, GardenTraceFrame>`.
- `index.ts` exports `manifest: PuzzlePartManifest` configured with the official `11×11` example (`6` steps -> `16`) and `64`-step full-input solver/visualizer dispatch via `resolvePart1Steps`.
- `viz/GardenPart1Visualizer.tsx` renders the interactive step-by-step parity & wavefront canvas visualizer.

## Maintainer Architecture

- **Solver vs Manifest**: `domain/solver.ts` always solves `PART1_STEPS = 64` for CLI and domain execution. `part1/index.ts` adapts the browser manifest so the `11×11` example evaluates at `PART1_EXAMPLE_STEPS = 6` (`16`) while custom/puzzle inputs evaluate at `64` steps.
- **No Circular Imports**: `GardenPart1Visualizer.tsx` delegates to `../../shared/viz/GardenVisualizer` and never imports from `../index.ts`.
