# 2023 Day 22 Part 1 — Sand Slabs

## Consumer Guide

- `domain/index.ts` exports `solver: PuzzleSolver<BrickSnapshot, number, SlabTraceFrame>` which parses `x1,y1,z1~x2,y2,z2` snapshots, settles bricks onto `z >= 1`, and returns `SupportGraph.safeCount`.
- `index.ts` exports `manifest: PuzzlePartManifest` configured with the 7-brick example (`exampleAnswer: '5'`).
- `viz/SandSlabsPart1Visualizer.tsx` renders the interactive dual `X-Z` / `Y-Z` orthographic projection with airborne-to-settled playback and click-to-inspect disintegration cascades.

## Maintainer Architecture

- **Shared Domain Reuse**: All parsing, height-map settling, `SupportGraph` classification/BFS, and bounded tracing live in `../shared/`.
- **No Circular Imports**: `SandSlabsPart1Visualizer.tsx` delegates to `../../shared/viz/SlabVisualizer` and never imports from `../index.ts`.
