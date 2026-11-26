# 2024 Day 13 Shared Domain & Visualization

Shared pure-TypeScript BigInt linear-Diophantine solver and interactive vector-space visualization for Advent of Code 2024 Day 13 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain types and helpers from `./index`:

- `Vector2D` / `ClawConfig` / `ClawSolution` / `MachineOutcome` — frozen BigInt value types (`tokens` computed dynamically as `3n * pressesA + pressesB`).
- `ClawMachine` / `parseClawMachines(raw)` — parses blank-line-separated 3-line machine blocks and validates strictly positive button deltas and non-negative prize coordinates.
- `solveClawMachine(machine, config)` — exact solver handling both non-singular (`det !== 0n`) and collinear (`det === 0n`) machines.
- `evaluateClawArcade(machines, config)` / `traceClawArcade(machines, config, options)` / `createClawContraptionSolver(config)` — totals winning tokens and produces bounded `ClawTraceFrame` snapshots (`DEFAULT_MAX_TRACE_STEPS = 80`).

Visualizers in `./viz/` (`ClawContraptionVisualizer.tsx`, `ClawVectorDiagram.tsx`) are `.tsx`-only React components parameterized by `{ rawInput, solver, config }`.

## Maintainer Guide

- **Module DAG**: `types.ts` -> `machine.ts` -> `solver.ts` -> `arcade.ts` -> `index.ts`. Part modules depend on `shared/index.ts`; `shared/viz/` imports from `../index` and `../../../shared/viz`.
- **Exact Arithmetic**: `solveNonSingular` checks divisibility of Cramer numerators by `det`; `solveCollinear` checks ray alignment (`buttonA.cross(target) === 0n`), solves `ax * a + bx * b = target.x` via iterative `extendedGcd`, intersects non-negativity and `maxPresses` bounds with `ceilDiv`/`floorDiv`, and selects the endpoint minimizing `3 * aStep - bStep`.
- **BigInt-Safe SVG**: `ClawVectorDiagram` scales coordinates and ray exits in BigInt (`10_000n` fixed-point ratio) before converting to SVG coordinates, preventing precision loss on Part 2 `10^13` targets.
