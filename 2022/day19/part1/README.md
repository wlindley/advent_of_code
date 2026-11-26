# 2022 Day 19 Part 1 — Not Enough Minerals

## Consumer Interface

- `solver.parse(raw)` -> `readonly Blueprint[]`
- `solver.solve(blueprints)` -> `number` (sum of `blueprint.id * maxGeodes` over 24 minutes)
- `solver.trace(blueprints, options?)` -> bounded `readonly FactoryTraceFrame[]`
- `manifest` -> `PuzzlePartManifest` registered in `site/registry.ts` via Vite glob.

## Maintainer Notes

- Thin wrapper over `2022/day19/shared`: `domain/solver.ts` delegates parsing, optimization, quality summation, and trace generation with `TIME_LIMIT = 24` and `'quality-sum'` mode.
- `viz/FactoryPart1Visualizer.tsx` delegates rendering and playback controls to `FactoryVisualizer`.
