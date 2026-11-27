# 2020 Day 11 Shared Domain (`Seating System`)

## Consumer Guide

Import pure domain models, CSR rule graphs, simulators, trace builders, and solvers from `2020/day11/shared`:

- `parseSeatingLayout(raw)` -> immutable `SeatingLayout` mapping rectangular `.`/`L`/`#` grids to compact seat indices (`seatIndexAt`, `coordOf`, `copyInitialOccupancy`).
- `ADJACENT_SEATING_RULE` / `LINE_OF_SIGHT_SEATING_RULE` -> `SeatingRule` strategies for Part 1 (8-neighbor, threshold `4`) and Part 2 (first-visible ray, threshold `5`).
- `buildSeatGraph(layout, rule)` -> CSR `SeatGraph` (`seatCount`, `edgeCount`, `neighborsOf`, `stepOccupancy`).
- `simulateSeating(layout, rule)` / `simulateSeatingWithGraph(layout, graph)` -> `SimulationResult` with equilibrium detection and cycle rejection.
- `traceSeating(layout, rule, maxSteps)` -> budget-bounded `SeatingTraceFrame[]` with per-seat visual diff states (`0` empty, `1` steady occupied, `2` newly occupied, `3` newly vacated).
- `new SeatingSystemSolver(rule)` -> `PuzzleSolver` exposing `parse`, `solve`, `trace`, and `rule`.

Interactive React visualizers live under `2020/day11/shared/viz/` and are never exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> layout.ts -> rules.ts -> simulation.ts -> trace.ts -> solver.ts -> index.ts`

- Every domain entity is frozen (`Object.freeze(this)`) with zero stored derived state; internal `TypedArray` buffers (`Int32Array`, `Uint8Array`) are never `Object.freeze()`d and are copied or sliced across public boundaries.
- `simulateSeatingWithGraph` uses ping-pong `Uint8Array` buffers, checks `changes === 0` before cycle-set lookup, and encodes states via a module-scoped `TextDecoder('ascii')`.
- `traceSeating` runs a 2-pass replay (`simulateSeatingWithGraph` + `sampleTraceIndices`) so visualization traces remain bounded to `maxSteps` frames.
