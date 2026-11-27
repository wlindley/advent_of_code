# 2019 Day 14 Part 1 — Space Stoichiometry

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 14 1` (or pass `--input <path>`).
- **Behavior**: Parses a chemical reaction specification into a validated DAG, prunes dead reactions outside the `FUEL -> ORE` relevant subgraph, and computes the exact minimum `ORE` required to synthesize `1 FUEL`.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive top-down layered DAG waterfall (`DemandWaterfallSvg`) stepping through each chemical's batch resolution, surplus leftover, and cumulative `ORE`.

## Maintainer Guide

- `domain/solver.ts` instantiates `new StoichiometrySolver(ORE_FOR_ONE_FUEL_POLICY)` from `../../shared`, keeping Part 1 domain logic 100% pure TypeScript with zero React/DOM imports.
- `domain/index.ts` re-exports `solver` for `index.ts` and CLI consumers.
- `viz/Visualizer.tsx` delegates rendering to `StoichiometryVisualizer` bound to Part 1's `solver`.
