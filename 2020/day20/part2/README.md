# 2020 Day 20 Part 2 — Jurassic Jigsaw

## User Overview

Reassembles square camera-array tiles by aligning shared borders, strips tile borders into a stitched ocean bitmap, detects sea-monster patterns across all eight D4 orientations, and reports the non-monster water roughness (`#` count) alongside an interactive step-playback visualization.

## Developer Notes

- **Domain Entry (`domain/solver.ts`)**: Binds `JigsawSolver` to `WATER_ROUGHNESS_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/JurassicJigsawPart2Visualizer.tsx`)**: Thin wrapper passing `solver` to `JigsawVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 9-tile example (`exampleAnswer: '273'`).
