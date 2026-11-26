# 2022 Day 25 Part 1 — Full of Hot Air

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<SnafuLedger, string, FuelTraceFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official 13-line example (`2=-1=0`) and `FuelPart1Visualizer`.

## Maintainer Guide

- `domain/solver.ts` delegates parsing (`parseFuelLedger`), summing (`ledger.totalSnafu`), and bounded trace capture (`traceFuelLedger`) to `../../shared`.
- `viz/FuelPart1Visualizer.tsx` delegates rendering and playback controls to `../../shared/viz/SnafuVisualizer`.
