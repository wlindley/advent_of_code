# 2023 Day 23 Part 1 — A Long Walk

## Consumer Guide

- `domain/index.ts` exports `solver: PuzzleSolver<TrailMap, number, HikeTraceFrame>` which parses trail maps, contracts degree-<=2 corridors with directional slopes enforced (`ignoreSlopes = false`), and computes the longest simple walk from start to exit.
- `index.ts` exports `manifest: PuzzlePartManifest` configured with the 23x23 example (`exampleAnswer: '94'`).
- `viz/LongWalkPart1Visualizer.tsx` renders the interactive maze contraction, directional slope chevrons, search-improvement playback, and final optimal hike trail.

## Maintainer Architecture

- **Shared Domain Reuse**: Parsing (`trailMap.ts`), corridor contraction (`trailGraph.ts`), CSR branch-and-bound longest-path DFS (`longestPath.ts`), and bounded tracing (`hikeTrace.ts`) live in `../shared/`.
- **No Circular Imports**: `LongWalkPart1Visualizer.tsx` delegates directly to `../../shared/viz/TrailVisualizer` and never imports from `../index.ts`.
