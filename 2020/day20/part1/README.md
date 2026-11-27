# 2020 Day 20 Part 1 — Jurassic Jigsaw

## User Overview

Reassembles square camera-array tiles by aligning shared borders under D4 rotations and reflections, then computes the `BigInt` product of the four corner tile IDs and renders an animated assembly mosaic.

## Developer Notes

- **Domain Entry (`domain/solver.ts`)**: Binds `JigsawSolver` to `CORNER_PRODUCT_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/JurassicJigsawPart1Visualizer.tsx`)**: Thin wrapper passing `solver` to `JigsawVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 9-tile example (`exampleAnswer: '20899048083289'`).
