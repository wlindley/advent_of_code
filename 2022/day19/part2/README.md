# 2022 Day 19 Part 2 — Not Enough Minerals

## Consumer Guide

- `solver.parse(raw)` -> `readonly Blueprint[]`
- `solver.solve(blueprints)` -> `number` (product of `maxGeodes` across the first 3 blueprints over 32 minutes)
- `solver.trace(blueprints, options?)` -> bounded `readonly FactoryTraceFrame[]` (`'geode-product'` mode, default cap 64 frames)
- `manifest` -> `PuzzlePartManifest` registered in `site/registry.ts` via Vite glob.

## Maintainer Notes

- Thin wrapper over `2022/day19/shared`: `domain/solver.ts` slices `blueprints.slice(0, 3)` and delegates parsing, optimization, geode multiplication, and trace generation with `TIME_LIMIT = 32` and `'geode-product'` mode.
- `viz/FactoryPart2Visualizer.tsx` delegates rendering and playback controls to `FactoryVisualizer` with `timeLimit={32}` and `mode="geode-product"`.
