# 2019 Day 14 Part 2 — Space Stoichiometry

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 14 2` (or pass `--input <path>`).
- **Behavior**: Parses a chemical reaction DAG and computes the maximum integer `FUEL` producible within a `1_000_000_000_000` `ORE` budget via exponential bracketing and `BigInt` binary search.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive search gauge (`FuelSearchGaugeSvg`) stepping through bracket doubling, binary midpoint narrowing, budget fill ratio, and best `FUEL`.

## Maintainer Guide

- `domain/solver.ts` instantiates `new StoichiometrySolver(MAX_FUEL_FOR_TRILLION_ORE_POLICY)` from `../../shared`, keeping Part 2 domain logic 100% pure TypeScript with zero React/DOM imports.
- `domain/index.ts` re-exports `solver` for `index.ts` and CLI consumers.
- `viz/Visualizer.tsx` delegates rendering to `StoichiometryVisualizer` bound to Part 2's `solver`.
