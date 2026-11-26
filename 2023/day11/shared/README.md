# 2023 Day 11 Shared Domain & Visualization Primitives

## Consumer Guide

`2023/day11/shared/index.ts` exports pure TypeScript domain primitives for parsing, expanding, and sweeping 2D galaxy observation maps (without importing or re-exporting React/DOM modules):

- `universe.ts`: `UniverseCell` (`'.' | '#'`), `GalaxyCoord`, `UniverseMap` (immutable wrapper around `Grid2D<UniverseCell>` with dynamic `galaxies()`, `rowCounts()`, and `colCounts()`), and `parseUniverseMap(raw)`.
- `expansion.ts`: `ExpandedGalaxyCoord`, `validateExpansionFactor(factor)`, `sweepAxisDistances(counts, factor)`, `sumExpandedPairwiseDistances(universe, factor)`, and `expandedGalaxyCoords(universe, factor)` using exact `BigInt` arithmetic.
- `trace.ts`: `CosmicExpansionTraceFrame` (dynamic `stepContribution` and `runningTotal` getters) and `buildCosmicExpansionTrace(universe, factor, options?)` capped at `DEFAULT_MAX_TRACE_STEPS` (`120`) frames.
- `solverFactory.ts`: `createCosmicExpansionSolver(factor)` producing a frozen `PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame>`.

`2023/day11/shared/viz/` provides pure `.tsx` interactive visualization components (`StarfieldCanvas.tsx` and `CosmicExpansionVisualizer.tsx`) shared across Part 1 and Part 2.

## Maintainer Notes

- **Module DAG**: `universe.ts` -> `expansion.ts` -> `trace.ts` -> `solverFactory.ts` -> `index.ts`. `shared/viz/*` depends on `shared/index.ts` and never vice versa.
- **No Stored Derived State**: `UniverseMap` stores only `grid: Grid2D<UniverseCell>`, and `CosmicExpansionTraceFrame` stores only canonical sweep counters; totals and galaxy projections are computed on demand.
- **Complexity**: $O(R \cdot C)$ parsing and $O(R + C)$ axis-sweep solving in exact `BigInt` arithmetic, avoiding any $O(G^2)$ pair enumeration or expanded-grid allocation.
