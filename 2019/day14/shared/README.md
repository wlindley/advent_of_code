# Day 14 Shared Space Stoichiometry Kernel

Pure TypeScript reaction-DAG parsing, single-pass batch stoichiometry, ORE-budget FUEL search, bounded trace generation, and SVG layout modules shared across Advent of Code 2019 Day 14 parts.

## Consumer Guide

- `parseReactionNetwork(raw)`: Parses reaction rules into an immutable `ReactionNetwork`, verifying unique outputs, defined inputs, acyclicity via `DirectedGraph.topologicalOrder()`, and `FUEL -> ORE` relevance pruning.
- `evaluateStoichiometry(network, fuelAmount)` / `oreRequiredForFuel(network, fuelAmount)`: Computes exact `BigInt` reaction batches, leftovers, and total `ORE` in one topological demand pass.
- `findMaxFuelForOre(network, oreBudget)`: Finds maximum integer `FUEL` producible within `oreBudget` via exponential bracketing and binary search.
- `StoichiometrySolver`: `PuzzleSolver` parameterized by `ORE_FOR_ONE_FUEL_POLICY` (Part 1) or `MAX_FUEL_FOR_TRILLION_ORE_POLICY` (Part 2).
- `computeDagLayout(network)`, `computeLogScalePosition`, `computeBudgetFillRatio`, `formatCompactBigInt`: Pure geometry and formatting helpers for interactive visualization.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `models.ts` -> `shared/core` (`DirectedGraph`): immutable `Ingredient`, `Reaction`, `ReactionNetwork`, and 5-step validated `parseReactionNetwork`.
- `stoichiometry.ts` -> `shared/core` (`ceilDiv`), `models.ts`: frozen `ChemicalDemand` (derived getters `batches`, `produced`, `leftover`), `FuelSearchStep` (derived `fits`), `evaluateStoichiometry`, `findMaxFuelForOre`.
- `trace.ts` -> `shared/core` (`sampleTraceIndices`, `validateMaxSteps`), `models.ts`, `stoichiometry.ts`: bounded `buildDemandTrace` and `buildFuelSearchTrace` (`DEFAULT_MAX_TRACE_FRAMES = 80`).
- `policies.ts` -> `models.ts`, `stoichiometry.ts`, `trace.ts`: Part 1 and Part 2 `StoichiometryPolicy` factories and presets.
- `solver.ts` -> `shared/core`, `models.ts`, `policies.ts`, `trace.ts`: `StoichiometrySolver<TTrace>`.
- `vizLayout.ts` -> `shared/core` (`bigintLog2`), `models.ts`: layered DAG layout, log-scale gauge math, and compact `BigInt` formatting.
- `viz/` -> React components (`DemandWaterfallSvg`, `FuelSearchGaugeSvg`, `StoichiometryVisualizer`) consuming `shared/viz` `PlaybackControls` and CSS theme tokens.
